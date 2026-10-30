import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { AppDataTable } from '../../components/data-table/AppDataTable';
import { ErrorState } from '../../components/feedback/ErrorState';
import { TableSkeleton } from '../../components/feedback/LoadingState';
import { useToast } from '../../components/feedback/toastContext';
import { PageHeader } from '../../components/page/PageHeader';
import { StatusChip } from '../../components/status/StatusChip';
import { normalizeApiError } from '../../utils/apiError';
import { formatDate } from '../../utils/labels';
import {
  LINK_ACTIONS,
  LINK_STATUSES,
  type LinkStatus,
  type VehicleDriverLink,
  useListVehicleLinksQuery,
  useSetVehicleLinkStatusMutation,
} from './vehiclesApi';

/** Asks for the decision note (required unless approving) and confirms. */
export function DecisionDialog({
  open,
  title,
  needsNote,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  needsNote: boolean;
  busy: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState('');
  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label={needsNote ? 'Reason (the driver sees it)' : 'Note (optional)'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={2}
            required={needsNote}
            autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" disabled={busy || (needsNote && !note.trim())} onClick={() => onConfirm(note.trim())}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Driver ↔ lorry links with the actions the API allows for each. */
export function VehicleLinksTable({ vehicleId, status, search }: { vehicleId?: number; status?: string; search?: string }) {
  const { showToast } = useToast();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const { data, isFetching, error, refetch } = useListVehicleLinksQuery({
    vehicle_id: vehicleId,
    status: status || undefined,
    search: search || undefined,
    page: page + 1,
    per_page: rowsPerPage,
  });
  const [setStatus, setState] = useSetVehicleLinkStatusMutation();
  const [pending, setPending] = useState<{ link: VehicleDriverLink; status: LinkStatus; label: string; needsNote: boolean } | null>(null);
  const [err, setErr] = useState('');

  async function decide(note: string) {
    if (!pending) return;
    setErr('');
    try {
      await setStatus({ id: pending.link.id, status: pending.status, note: note || undefined }).unwrap();
      showToast(`${pending.label}: ${pending.link.vehicle_number} — the driver was notified`, 'success');
      setPending(null);
    } catch (e) {
      setErr(normalizeApiError(e).message);
    }
  }

  const columns: ColumnDef<VehicleDriverLink>[] = [
    ...(vehicleId
      ? []
      : [
          {
            id: '_lorry',
            header: 'Lorry',
            cell: ({ row }: { row: { original: VehicleDriverLink } }) => (
              <Box>
                <Typography fontSize={13} fontWeight={600}>{row.original.vehicle_number}</Typography>
                <Typography fontSize={12} color="text.secondary">
                  {row.original.vehicle_type ?? '—'} · owner {row.original.owner_name ?? '—'}
                </Typography>
              </Box>
            ),
          } as ColumnDef<VehicleDriverLink>,
        ]),
    {
      id: '_driver',
      header: 'Driver',
      cell: ({ row }) => (
        <Box>
          <Typography fontSize={13}>{row.original.driver_name ?? `User #${row.original.driver_user_id}`}</Typography>
          <Typography fontSize={12} color="text.secondary">{row.original.driver_mobile}</Typography>
        </Box>
      ),
    },
    {
      id: '_checks',
      header: 'Checks',
      cell: ({ row }) => {
        const l = row.original;
        const expired = l.license_expiry_date ? new Date(l.license_expiry_date) < new Date(new Date().toDateString()) : false;
        return (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={`Driver ${l.driver_approval_status ?? '—'}`} color={l.driver_approval_status === 'APPROVED' ? 'success' : 'default'} />
            <Chip size="small" label={`Lorry ${l.vehicle_approval_status}`} color={l.vehicle_approval_status === 'APPROVED' ? 'success' : 'warning'} />
            <Chip size="small" label={l.license_expiry_date ? `Licence to ${formatDate(l.license_expiry_date)}` : 'Licence expiry unknown'} color={expired ? 'error' : 'default'} />
            {l.is_on_active_trip && <Chip size="small" color="info" label="On a trip" />}
          </Stack>
        );
      },
    },
    { id: '_status', header: 'Status', cell: ({ row }) => <StatusChip value={row.original.status} /> },
    { id: '_note', header: 'Note', cell: ({ row }) => row.original.decision_note ?? '—' },
    {
      id: '_actions',
      header: '',
      cell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          {(LINK_ACTIONS[row.original.status] ?? []).map((a) => (
            <Button
              key={a.status}
              size="small"
              variant={a.status === 'APPROVED' ? 'contained' : 'outlined'}
              color={a.status === 'APPROVED' ? 'primary' : 'inherit'}
              // Removing waits until the driver's trip with this lorry ends (the API refuses it too).
              disabled={a.status === 'REMOVED' && row.original.is_on_active_trip}
              onClick={() => { setErr(''); setPending({ link: row.original, ...a }); }}
            >
              {a.label}
            </Button>
          ))}
        </Stack>
      ),
    },
  ];

  return (
    <>
      {isFetching && <TableSkeleton rows={4} cols={columns.length} />}
      {error && <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />}
      {!isFetching && !error && (
        <AppDataTable
          columns={columns}
          data={data?.links ?? []}
          count={data?.pagination.total ?? 0}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(0); }}
          maxHeight={vehicleId ? 360 : undefined}
        />
      )}
      {pending && (
        <DecisionDialog
          open
          title={`${pending.label} ${pending.link.driver_name ?? 'driver'} for ${pending.link.vehicle_number}`}
          needsNote={pending.needsNote}
          busy={setState.isLoading}
          error={err}
          onCancel={() => setPending(null)}
          onConfirm={(note) => void decide(note)}
        />
      )}
    </>
  );
}

/** Admin → Driver lorry links: requests waiting for review first. */
export function VehicleLinksPage() {
  const [status, setStatus] = useState<string>('PENDING');
  const [search, setSearch] = useState('');
  return (
    <Box>
      <PageHeader
        title="Driver ↔ Lorry Links"
        description="Drivers ask to drive a lorry from the app. Check the driver, the lorry and the licence, then approve or reject. Suspending stops future trips; removing waits until a trip with that lorry ends."
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2}>
        <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
          {LINK_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          <MenuItem value="">All</MenuItem>
        </TextField>
        <TextField size="small" label="Search lorry, driver or owner" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 280 }} />
      </Stack>
      <VehicleLinksTable status={status} search={search} />
    </Box>
  );
}
