import { Alert, Box, Button, Chip, Link, MenuItem, Stack, Switch, Tab, Tabs, TextField, Typography } from '@mui/material';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { AppDataTable } from '../../components/data-table/AppDataTable';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState, TableSkeleton } from '../../components/feedback/LoadingState';
import { useToast } from '../../components/feedback/toastContext';
import { FormDrawer } from '../../components/forms/FormDrawer';
import { PageHeader } from '../../components/page/PageHeader';
import { normalizeApiError } from '../../utils/apiError';
import { formatDateTime } from '../../utils/labels';
import {
  type RiskRule,
  type RiskSignal,
  riskActions,
  useActOnRiskSignalMutation,
  useGetRiskSignalQuery,
  useListRiskRulesQuery,
  useListRiskSignalsQuery,
  useScanRiskMutation,
  useUpdateRiskRuleMutation,
} from './riskApi';

const levelColor: Record<string, 'default' | 'info' | 'warning' | 'error'> = { LOW: 'info', MEDIUM: 'warning', HIGH: 'error', CONFIRMED_FRAUD: 'error' };

const entityLink = (s: RiskSignal) =>
  s.entity_type === 'ORDER' ? `/orders?search=${encodeURIComponent(s.entity_label ?? '')}` : s.entity_type === 'NURSERY' ? '/nurseries' : '/users';

/**
 * Admin → Risk Review: unusual activity the detector found (every 10 minutes).
 * A signal is a question, not a verdict: review, hold an order's dispatch,
 * ask the partner to verify, then resolve or dismiss — every step with a
 * note. Only a super admin confirms fraud. Partners are suspended from their
 * own pages.
 */
export function RiskPage() {
  const [tab, setTab] = useState(0);
  return (
    <Box>
      <PageHeader title="Risk Review" description="Unusual activity for a person to judge. Unusual prices alone are only LOW: legitimate nursery business is never stopped automatically." />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Queue" />
        <Tab label="Rules" />
      </Tabs>
      {tab === 0 ? <Queue /> : <Rules />}
    </Box>
  );
}

function Queue() {
  const { showToast } = useToast();
  const [status, setStatus] = useState('OPEN,UNDER_REVIEW');
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [open, setOpen] = useState<number | null>(null);
  const { data, isFetching, error, refetch } = useListRiskSignalsQuery({ status: status || undefined, risk_level: level || undefined, page: page + 1, per_page: rowsPerPage });
  const [scan, scanState] = useScanRiskMutation();

  const columns: ColumnDef<RiskSignal>[] = [
    {
      id: '_what',
      header: 'Signal',
      cell: ({ row }) => (
        <Link component="button" underline="hover" onClick={() => setOpen(row.original.id)} sx={{ textAlign: 'left' }}>
          <Typography fontSize={13} fontWeight={600}>{row.original.description}</Typography>
          <Typography fontSize={12} color="text.secondary">{row.original.signal_code}</Typography>
        </Link>
      ),
    },
    { id: '_on', header: 'On', cell: ({ row }) => `${row.original.entity_type} · ${row.original.entity_label ?? `#${row.original.entity_id}`}` },
    { id: '_level', header: 'Level', cell: ({ row }) => <Chip size="small" color={levelColor[row.original.risk_level]} label={row.original.risk_level} /> },
    {
      id: '_status',
      header: 'Status',
      cell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Chip size="small" variant="outlined" label={row.original.status} />
          {row.original.is_hold && <Chip size="small" color="error" label="On hold" />}
        </Stack>
      ),
    },
    { id: '_when', header: 'Found', cell: ({ row }) => formatDateTime(row.original.created_at) },
  ];

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2}>
        <TextField select size="small" label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} sx={{ minWidth: 200 }}>
          <MenuItem value="OPEN,UNDER_REVIEW">Open and in review</MenuItem>
          <MenuItem value="RESOLVED">Resolved</MenuItem>
          <MenuItem value="DISMISSED">Dismissed</MenuItem>
          <MenuItem value="">All</MenuItem>
        </TextField>
        <TextField select size="small" label="Level" value={level} onChange={(e) => { setLevel(e.target.value); setPage(0); }} sx={{ minWidth: 160 }}>
          <MenuItem value="">Any</MenuItem>
          {['LOW', 'MEDIUM', 'HIGH', 'CONFIRMED_FRAUD'].map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
        </TextField>
        <Button
          variant="outlined"
          disabled={scanState.isLoading}
          onClick={async () => {
            try {
              const r = await scan().unwrap();
              showToast(`${r.raised} new signal(s)`, 'success');
            } catch (e) {
              showToast(normalizeApiError(e).message, 'error');
            }
          }}
        >
          Check now
        </Button>
      </Stack>
      {isFetching && <TableSkeleton rows={6} cols={columns.length} />}
      {error && <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />}
      {!isFetching && !error && (
        <AppDataTable columns={columns} data={data?.signals ?? []} count={data?.total ?? 0} page={page} rowsPerPage={rowsPerPage}
          onPageChange={setPage} onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(0); }} />
      )}
      <FormDrawer open={open !== null} title="Risk signal" onClose={() => setOpen(null)} width={{ xs: '100%', sm: 620 }}>
        {open !== null && <SignalPanel id={open} />}
      </FormDrawer>
    </>
  );
}

export function SignalPanel({ id }: { id: number }) {
  const { showToast } = useToast();
  const { data, isLoading, error, refetch } = useGetRiskSignalQuery(id);
  const [act, actState] = useActOnRiskSignalMutation();
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />;
  const s = data.signal;

  async function run(action: string, label: string) {
    setErr('');
    if (action === 'CONFIRM_FRAUD' && !window.confirm('Mark this as confirmed fraud? Only do this with evidence.')) return;
    try {
      await act({ id, action, note: note.trim() }).unwrap();
      setNote('');
      showToast(`${label}: saved with your note`, 'success');
    } catch (e) {
      setErr(normalizeApiError(e).message);
    }
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h6">{s.description}</Typography>
        <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
          <Chip size="small" color={levelColor[s.risk_level]} label={s.risk_level} />
          <Chip size="small" variant="outlined" label={s.status} />
          {s.is_hold && <Chip size="small" color="error" label="Order on hold: dispatch paused" />}
        </Stack>
        <Typography mt={1} fontSize={13}>
          {s.entity_type} <Link href={entityLink(s)}>{s.entity_label ?? `#${s.entity_id}`}</Link> · found {formatDateTime(s.created_at)}
        </Typography>
      </Box>
      <Box component="pre" sx={{ m: 0, p: 1.5, bgcolor: 'action.hover', borderRadius: 1, fontSize: 12, whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(s.details, null, 2)}
      </Box>
      {err && <Alert severity="error">{err}</Alert>}
      <TextField label="Note (required for every action)" value={note} onChange={(e) => setNote(e.target.value)} multiline minRows={2} />
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {riskActions(s).map((a) => (
          <Button key={a.action} size="small" variant={a.action === 'RESOLVE' ? 'contained' : 'outlined'} color={a.danger ? 'error' : 'primary'}
            disabled={note.trim().length < 5 || actState.isLoading} onClick={() => void run(a.action, a.label)}>
            {a.label}
          </Button>
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Suspend a nursery, driver or user from their own page; then note it here.
      </Typography>
      <Box>
        <Typography fontWeight={700} mb={1}>History</Typography>
        {(s.notes ?? []).length === 0 && <Typography fontSize={13} color="text.secondary">No decisions yet.</Typography>}
        {(s.notes ?? []).map((n) => (
          <Box key={n.id} sx={{ borderLeft: 2, borderColor: 'divider', pl: 1.5, mb: 1 }}>
            <Typography fontSize={12} color="text.secondary">{formatDateTime(n.created_at)} · {n.user_name ?? 'Admin'} · {n.action}</Typography>
            <Typography fontSize={13}>{n.note}</Typography>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}

function Rules() {
  const { showToast } = useToast();
  const { data, isLoading, error, refetch } = useListRiskRulesQuery();
  const [save, saveState] = useUpdateRiskRuleMutation();
  const [edits, setEdits] = useState<Record<string, Partial<RiskRule>>>({});
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />;
  return (
    <Stack spacing={1.5}>
      <Alert severity="info">Only a super admin can change rules. A rule never marks fraud; unusual prices always stay LOW.</Alert>
      {(data?.rules ?? []).map((r) => {
        const e = { ...r, ...edits[r.signal_code] };
        const set = (p: Partial<RiskRule>) => setEdits((x) => ({ ...x, [r.signal_code]: { ...x[r.signal_code], ...p } }));
        return (
          <Stack key={r.signal_code} direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Box flex={1}>
              <Typography fontWeight={600} fontSize={13}>{r.signal_code}</Typography>
              <Typography fontSize={12} color="text.secondary">{r.description}</Typography>
            </Box>
            <Switch checked={e.is_enabled} onChange={(ev) => set({ is_enabled: ev.target.checked })} inputProps={{ 'aria-label': `${r.signal_code} on` }} />
            <TextField size="small" type="number" label="Threshold" value={e.threshold} onChange={(ev) => set({ threshold: Number(ev.target.value) })} sx={{ width: 140 }} />
            <TextField size="small" select label="Level" value={e.risk_level} onChange={(ev) => set({ risk_level: ev.target.value })} sx={{ width: 120 }}
              disabled={r.signal_code === 'PRICE_OUTLIER'}>
              {['LOW', 'MEDIUM', 'HIGH'].map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </TextField>
            <Button size="small" variant="contained" disabled={!edits[r.signal_code] || saveState.isLoading || !(e.threshold > 0)}
              onClick={async () => {
                try {
                  await save({ code: r.signal_code, is_enabled: e.is_enabled, threshold: e.threshold, risk_level: e.risk_level }).unwrap();
                  setEdits((x) => { const { [r.signal_code]: _drop, ...rest } = x; void _drop; return rest; });
                  showToast('Rule saved', 'success');
                } catch (err) {
                  showToast(normalizeApiError(err).message, 'error');
                }
              }}>
              Save
            </Button>
          </Stack>
        );
      })}
    </Stack>
  );
}
