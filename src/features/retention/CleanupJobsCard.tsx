import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useToast } from '../../components/feedback/toastContext';
import { normalizeApiError } from '../../utils/apiError';
import { download } from '../../utils/download';
import { formatDateTime } from '../../utils/labels';
import {
  ACTION_LABEL,
  type JobPreview,
  lastPeriods,
  type RetentionRule,
  type RetentionRun,
  formatBytes,
  useCancelJobMutation,
  useGetJobsQuery,
  useLazyDownloadJobExportQuery,
  useLazyPreviewJobQuery,
  useQueueJobMutation,
} from './retentionApi';

const STATUS_COLOR: Record<string, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
  QUEUED: 'info', RUNNING: 'warning', DONE: 'success', FAILED: 'error', CANCELLED: 'default',
};

/** The day before an exclusive end (the API stores ranges as [from, to)). */
const inclusiveTo = (toExcl?: string) => (toExcl ? new Date(new Date(toExcl).getTime() - 86_400_000 + 5.5 * 3_600_000).toISOString().slice(0, 10) : '');
const istDay = (ts?: string) => (ts ? new Date(new Date(ts).getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10) : '');

type Form = { rule: string; from: string; to: string; status: string; nursery: string; withExport: boolean; runAt: string; retryOf?: number };

/**
 * Clean-up jobs: pick a data type and fixed filters, preview what matches
 * (counts and record codes), then a super admin queues it for the night by
 * typing the count and a reason. The jobs table refreshes on demand.
 */
export function CleanupJobsCard({ rules, isSuperAdmin }: { rules: RetentionRule[]; isSuperAdmin: boolean }) {
  const choices = rules.filter((r) => r.jobs);
  const periods = lastPeriods();
  const [form, setForm] = useState<Form>({ rule: '', from: periods.month[0], to: periods.month[1], status: '', nursery: '', withExport: true, runAt: '' });
  const [preview, setPreview] = useState<{ filter: string; data: JobPreview } | null>(null);
  const [typed, setTyped] = useState('');
  const [reason, setReason] = useState('');
  const [runPreview, previewState] = useLazyPreviewJobQuery();
  const [queue, queueState] = useQueueJobMutation();
  const [cancel] = useCancelJobMutation();
  const [fetchExport] = useLazyDownloadJobExportQuery();
  const jobs = useGetJobsQuery();
  const toast = useToast();

  const rule = choices.find((r) => r.rule_code === form.rule);
  const filterKey = JSON.stringify([form.rule, form.from, form.to, form.status, form.nursery]);
  const current = preview?.filter === filterKey ? preview.data : null; // a changed filter needs a new preview
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const verb = rule ? ACTION_LABEL[rule.action].toLowerCase() : 'delete';
  const nurseryId = form.nursery.trim() ? Number(form.nursery) : undefined;
  const canQueue = isSuperAdmin && rule && !rule.jobs?.blocked && current && current.eligible > 0
    && typed.trim() === String(current.eligible) && reason.trim().length >= 10;

  const doPreview = async () => {
    try {
      const { preview: data } = await runPreview({ rule: form.rule, from: form.from, to: form.to, status: form.status || undefined, nursery_id: nurseryId }).unwrap();
      setPreview({ filter: filterKey, data });
      setTyped('');
    } catch (e) {
      toast.showToast(normalizeApiError(e).message, 'error');
    }
  };

  const doQueue = async () => {
    if (!current) return;
    try {
      const out = await queue({
        rule_code: form.rule, from: form.from, to: form.to, status: form.status || undefined, nursery_id: nurseryId,
        with_export: form.withExport, run_at: form.runAt ? new Date(form.runAt).toISOString() : undefined,
        confirm_count: Number(typed), reason: reason.trim(), retry_of_run_id: form.retryOf,
      }).unwrap();
      toast.showToast(`Job queued for ${formatDateTime(out.scheduled_at)}`, 'success');
      setPreview(null);
      setTyped('');
      setReason('');
      set({ retryOf: undefined });
    } catch (e) {
      toast.showToast(normalizeApiError(e).message, 'error');
    }
  };

  const retry = (j: RetentionRun) => {
    set({ rule: j.rule_code, from: istDay(j.range_from), to: inclusiveTo(j.range_to_excl), status: j.filter_status ?? '',
      nursery: j.filter_nursery_id ? String(j.filter_nursery_id) : '', withExport: !!j.has_export, runAt: '', retryOf: j.id });
    setPreview(null);
    toast.showToast('Filters copied: preview again, then queue. Records already done no longer match.', 'info');
  };

  const getExport = async (id: number) => {
    try {
      const out = await fetchExport(id).unwrap();
      download(out.blob, out.filename ?? `retention-job-${id}.csv`);
    } catch (e) {
      toast.showToast(normalizeApiError(e).message, 'error');
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography fontWeight={700} mb={1}>Clean-up jobs</Typography>
        <Typography fontSize={13} color="text.secondary" mb={2}>
          Pick the data and dates, preview what matches, then queue a job for the night. Every batch re-checks the rule, legal holds and
          exclusions, so anything held or still in use is skipped. Orders, payments and quotations are never deleted.
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} mb={1} flexWrap="wrap" useFlexGap>
          <TextField select SelectProps={{ native: true }} size="small" label="Data" value={form.rule} sx={{ minWidth: 240 }}
            onChange={(e) => set({ rule: e.target.value, status: '', nursery: '' })}>
            <option value="">Choose…</option>
            {choices.map((r) => <option key={r.rule_code} value={r.rule_code}>{r.category}</option>)}
          </TextField>
          <TextField size="small" type="date" label={`From (${rule?.jobs?.date_label ?? 'date'})`} value={form.from}
            onChange={(e) => set({ from: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="date" label="To (inclusive)" value={form.to} onChange={(e) => set({ to: e.target.value })} InputLabelProps={{ shrink: true }} />
          <Button size="small" onClick={() => set({ from: periods.month[0], to: periods.month[1] })}>Last month</Button>
          <Button size="small" onClick={() => set({ from: periods.quarter[0], to: periods.quarter[1] })}>Last quarter</Button>
          {!!rule?.jobs?.statuses?.length && (
            <TextField select SelectProps={{ native: true }} InputLabelProps={{ shrink: true }} size="small" label="Status" value={form.status}
              onChange={(e) => set({ status: e.target.value })}>
              <option value="">Any</option>
              {rule.jobs.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </TextField>
          )}
          {rule?.jobs?.nursery && (
            <TextField size="small" label="Nursery ID (optional)" value={form.nursery} sx={{ width: 170 }}
              onChange={(e) => set({ nursery: e.target.value.replace(/\D/g, '') })} />
          )}
          <Button variant="outlined" disabled={!form.rule || !form.from || !form.to || previewState.isFetching} onClick={() => void doPreview()}>
            {previewState.isFetching ? 'Counting…' : 'Preview'}
          </Button>
        </Stack>

        {rule?.jobs?.blocked && <Alert severity="info" sx={{ mb: 1 }}>Preview only: {rule.jobs.blocked}.</Alert>}

        {current && (
          <Box mb={2}>
            <Typography fontSize={14} mb={1}>
              <b>{current.eligible}</b> would be {verb === 'mask' ? 'masked' : 'deleted'} · <b>{current.held}</b> on hold · <b>{current.excluded}</b> excluded (in use)
            </Typography>
            {(['eligible', 'held', 'excluded'] as const).filter((k) => current.codes[k].length > 0).map((k) => (
              <Typography key={k} fontSize={12} color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                {k === 'eligible' ? 'Matching' : k === 'held' ? 'On hold' : 'Excluded'}: {current.codes[k].join(', ')}{current.codes[k].length === 50 ? ' …' : ''}
              </Typography>
            ))}
            {current.eligible === 0 && <Alert severity="success" sx={{ mt: 1 }}>Nothing matches: no job needed.</Alert>}
            {current.eligible > 0 && rule && !rule.jobs?.blocked && isSuperAdmin && (
              <Stack spacing={1} mt={1} maxWidth={560}>
                <RadioGroup row value={form.withExport ? 'export' : 'plain'} onChange={(e) => set({ withExport: e.target.value === 'export' })}>
                  <FormControlLabel value="export" control={<Radio size="small" />} label={`Export, then ${verb}`} />
                  <FormControlLabel value="plain" control={<Radio size="small" />} label={`${verb[0].toUpperCase()}${verb.slice(1)} only`} />
                </RadioGroup>
                <TextField size="small" type="datetime-local" label="Run at (empty: 2:00 AM India time)" value={form.runAt}
                  onChange={(e) => set({ runAt: e.target.value })} InputLabelProps={{ shrink: true }} />
                <TextField size="small" label={`Type ${current.eligible} to confirm`} value={typed} onChange={(e) => setTyped(e.target.value)}
                  error={typed !== '' && typed.trim() !== String(current.eligible)} />
                <TextField size="small" label="Reason (kept with the job and in the audit log)" value={reason} onChange={(e) => setReason(e.target.value)}
                  helperText="At least 10 characters" />
                <Box>
                  <Button variant="contained" color="error" disabled={!canQueue || queueState.isLoading} onClick={() => void doQueue()}>
                    {form.retryOf ? `Queue retry of job ${form.retryOf}` : 'Queue job'}
                  </Button>
                </Box>
              </Stack>
            )}
            {current.eligible > 0 && !isSuperAdmin && <Alert severity="info" sx={{ mt: 1 }}>Only a super admin can queue a clean-up job.</Alert>}
          </Box>
        )}

        <Stack direction="row" alignItems="center" justifyContent="space-between" mt={2} mb={1}>
          <Typography fontWeight={700} fontSize={14}>Jobs</Typography>
          <Button size="small" onClick={() => void jobs.refetch()} disabled={jobs.isFetching}>{jobs.isFetching ? 'Refreshing…' : 'Refresh'}</Button>
        </Stack>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Job</TableCell><TableCell>Data</TableCell><TableCell>Dates</TableCell><TableCell>Runs at</TableCell><TableCell>Status</TableCell>
                <TableCell align="right">Done / matched</TableCell><TableCell align="right">Skipped</TableCell><TableCell align="right">Failed</TableCell>
                <TableCell>Batches</TableCell><TableCell>Reason</TableCell><TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {(jobs.data?.runs ?? []).map((j) => (
                <TableRow key={j.id}>
                  <TableCell>#{j.id}{j.retry_of_run_id ? ` (retry of #${j.retry_of_run_id})` : ''}</TableCell>
                  <TableCell>
                    {j.rule_code}
                    {(j.filter_status || j.filter_nursery_id) && (
                      <Typography fontSize={12} color="text.secondary">{[j.filter_status, j.filter_nursery_id && `nursery ${j.filter_nursery_id}`].filter(Boolean).join(' · ')}</Typography>
                    )}
                  </TableCell>
                  <TableCell>{istDay(j.range_from)} – {inclusiveTo(j.range_to_excl)}</TableCell>
                  <TableCell>{j.scheduled_at ? formatDateTime(j.scheduled_at) : '-'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={j.cancel_requested_at && j.status === 'RUNNING' ? 'STOPPING' : j.status} color={STATUS_COLOR[j.status] ?? 'default'} />
                    {j.failure_detail && <Typography fontSize={12} color="error">{j.failure_detail}</Typography>}
                  </TableCell>
                  <TableCell align="right">{j.affected} / {j.eligible}</TableCell>
                  <TableCell align="right">{j.skipped}</TableCell>
                  <TableCell align="right">{j.failed}</TableCell>
                  <TableCell>{j.batches_done ?? 0}</TableCell>
                  <TableCell sx={{ maxWidth: 220 }}><Typography fontSize={12}>{j.reason}</Typography></TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {isSuperAdmin && (j.status === 'QUEUED' || j.status === 'RUNNING') && !j.cancel_requested_at && (
                      <Button size="small" color="error" onClick={() => void cancel(j.id).unwrap()
                        .then((o) => toast.showToast(o.status === 'CANCELLED' ? 'Job cancelled' : 'Stopping after the current batch', 'success'))
                        .catch((e) => toast.showToast(normalizeApiError(e).message, 'error'))}>Cancel</Button>
                    )}
                    {isSuperAdmin && (j.status === 'FAILED' || j.status === 'CANCELLED') && <Button size="small" onClick={() => retry(j)}>Retry</Button>}
                    {isSuperAdmin && j.export_ready && (
                      <Button size="small" onClick={() => void getExport(j.id)}>Export{j.export_bytes ? ` (${formatBytes(j.export_bytes)})` : ''}</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {jobs.data?.runs.length === 0 && (
                <TableRow><TableCell colSpan={11}><Typography fontSize={13} color="text.secondary">No clean-up jobs yet.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
        <Typography fontSize={12} color="text.secondary" mt={1}>Export files are private to super admins, every download is audit-logged, and they are removed after 30 days.</Typography>
      </CardContent>
    </Card>
  );
}
