import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useToast } from '../../components/feedback/toastContext';
import { PageHeader } from '../../components/page/PageHeader';
import { useAppSelector } from '../../hooks/redux';
import { normalizeApiError } from '../../utils/apiError';
import { formatDateTime } from '../../utils/labels';
import {
  ACTION_LABEL,
  formatBytes,
  type RetentionRule,
  type RetentionRun,
  useDryRunAllMutation,
  useDryRunRuleMutation,
  useGetRetentionQuery,
  useGetRetentionRunsQuery,
  useUpdateRuleMutation,
} from './retentionApi';

function StatusChips({ rule }: { rule: RetentionRule }) {
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {rule.is_enabled ? <Chip size="small" color="success" label="On" /> : <Chip size="small" label="Off" />}
      {rule.legal_review_required && (
        <Tooltip title={rule.legal_review_note ?? ''}>
          <Chip size="small" color="warning" label="Legal review hold" />
        </Tooltip>
      )}
      {rule.dry_run_only && <Chip size="small" color="info" label="Report only" />}
    </Stack>
  );
}

const runText = (r?: RetentionRun | null) => {
  if (!r) return 'Never';
  if (r.status === 'FAILED') return `Failed (${r.error_code ?? 'error'}) · ${formatDateTime(r.started_at)}`;
  return formatDateTime(r.started_at);
};

/** Admin → Data retention: what is deleted or masked after how long, with counts. Never shows personal data. */
export function RetentionPage() {
  const { data, isLoading, error, refetch } = useGetRetentionQuery(undefined, { pollingInterval: 60_000 });
  const runs = useGetRetentionRunsQuery();
  const [dryRun, dryRunState] = useDryRunRuleMutation();
  const [dryRunAll, dryRunAllState] = useDryRunAllMutation();
  const [editing, setEditing] = useState<RetentionRule | null>(null);
  const roles = useAppSelector((s) => s.auth.user?.roles ?? []);
  const isSuperAdmin = roles.some((r) => r.code === 'SUPER_ADMIN');
  const toast = useToast();

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />;
  const s = data.summary;

  const runOne = async (code: string) => {
    try {
      const { run } = await dryRun(code).unwrap();
      toast.showToast(`${code}: ${run.eligible} eligible, ${run.held} on hold (nothing changed)`, 'success');
    } catch (e) {
      toast.showToast(normalizeApiError(e).message, 'error');
    }
  };

  return (
    <Box>
      <PageHeader
        title="Data retention"
        description="What personal data is deleted or masked, and after how long. Counts only: no names or numbers are shown here."
        action={
          <Button
            variant="outlined"
            disabled={dryRunAllState.isLoading}
            onClick={() => void dryRunAll().unwrap()
              .then(() => toast.showToast('Dry run of every rule done (nothing changed)', 'success'))
              .catch((e) => toast.showToast(normalizeApiError(e).message, 'error'))}
          >
            {dryRunAllState.isLoading ? 'Running…' : 'Dry run all rules'}
          </Button>
        }
      />
      <Alert severity="info" sx={{ mb: 2 }}>
        A dry run only counts. Rules on legal review hold, and the uploaded-files rule, can never be switched on here.
        {!isSuperAdmin && ' Only a super admin can change a rule.'}
      </Alert>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
        {[
          ['Rules on', s.enabled_rules],
          ['Legal review holds', s.legal_review_holds],
          ['Failed runs (7 days)', s.failed_runs_7d],
          ['Accounts deleted (30 days)', s.accounts_deleted_30d],
          ['Deleted accounts awaiting clean-up', s.deleted_accounts_awaiting_scrub],
        ].map(([label, n]) => (
          <Card key={label} variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h5" color={label === 'Failed runs (7 days)' && Number(n) > 0 ? 'error' : undefined}>{n}</Typography>
              <Typography fontSize={13} color="text.secondary">{label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Card variant="outlined" sx={{ mb: 2, overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Action</TableCell>
              <TableCell align="right">Period</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Eligible</TableCell>
              <TableCell align="right">On hold</TableCell>
              <TableCell>Last dry run</TableCell>
              <TableCell>Last execution</TableCell>
              <TableCell>Next run</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {data.rules.map((r) => (
              <TableRow key={r.rule_code} hover>
                <TableCell>
                  <Typography fontWeight={600} fontSize={14}>{r.category}</Typography>
                  <Typography fontSize={12} color="text.secondary">{r.description}</Typography>
                </TableCell>
                <TableCell>{ACTION_LABEL[r.action]}</TableCell>
                <TableCell align="right">{r.period_days} days</TableCell>
                <TableCell><StatusChips rule={r} /></TableCell>
                <TableCell align="right">
                  {r.last_dry_run ? r.last_dry_run.eligible : '-'}
                  {r.action === 'REPORT' && r.last_dry_run ? <Typography fontSize={12} color="text.secondary">{formatBytes(r.last_dry_run.bytes)}</Typography> : null}
                </TableCell>
                <TableCell align="right">{r.last_dry_run ? r.last_dry_run.held : '-'}</TableCell>
                <TableCell>{runText(r.last_dry_run)}</TableCell>
                <TableCell>{r.last_execution ? `${runText(r.last_execution)} · ${r.last_execution.affected} changed` : 'Never'}</TableCell>
                <TableCell>{r.next_run_at ? formatDateTime(r.next_run_at) : 'At next start'}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => void runOne(r.rule_code)} disabled={dryRunState.isLoading}>Dry run</Button>
                    {isSuperAdmin && <Button size="small" variant="outlined" onClick={() => setEditing(r)}>Change</Button>}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card variant="outlined" sx={{ overflowX: 'auto' }}>
        <CardContent>
          <Typography fontWeight={700} mb={1}>Recent runs</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell><TableCell>Rule</TableCell><TableCell>Mode</TableCell><TableCell>By</TableCell><TableCell>Status</TableCell>
                <TableCell align="right">Eligible</TableCell><TableCell align="right">On hold</TableCell><TableCell align="right">Changed</TableCell>
                <TableCell align="right">Failed</TableCell><TableCell align="right">Size</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(runs.data?.runs ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{formatDateTime(r.started_at)}</TableCell>
                  <TableCell>{r.rule_code}</TableCell>
                  <TableCell>{r.mode === 'DRY_RUN' ? 'Dry run' : 'Execution'}</TableCell>
                  <TableCell>{r.trigger_source === 'SCHEDULE' ? 'Schedule' : 'Admin'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={r.status === 'FAILED' ? `Failed: ${r.error_code ?? ''}` : r.status.toLowerCase()}
                      color={r.status === 'FAILED' ? 'error' : r.status === 'SUCCEEDED' ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="right">{r.eligible}</TableCell>
                  <TableCell align="right">{r.held}</TableCell>
                  <TableCell align="right">{r.affected}</TableCell>
                  <TableCell align="right">{r.failed}</TableCell>
                  <TableCell align="right">{r.bytes ? formatBytes(r.bytes) : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editing && <ChangeRuleDialog rule={editing} onClose={() => setEditing(null)} />}
    </Box>
  );
}

/** Super admin only. Every change needs a reason (kept in the audit log). */
export function ChangeRuleDialog({ rule, onClose }: { rule: RetentionRule; onClose: () => void }) {
  const [period, setPeriod] = useState(String(rule.period_days));
  const [enabled, setEnabled] = useState(rule.is_enabled);
  const [clearHold, setClearHold] = useState(false);
  const [legalNote, setLegalNote] = useState('');
  const [reason, setReason] = useState('');
  const [save, { isLoading }] = useUpdateRuleMutation();
  const toast = useToast();
  const p = Number(period);
  const periodOk = Number.isInteger(p) && p >= rule.min_period_days && p <= 3650;
  const stillHeld = rule.legal_review_required && !clearHold;
  const canEnable = !rule.dry_run_only && !stillHeld;
  const turningOn = enabled && !rule.is_enabled;
  const ok = periodOk && reason.trim().length >= 10 && (!clearHold || legalNote.trim().length >= 10) && (!enabled || canEnable);

  const submit = async () => {
    try {
      await save({
        code: rule.rule_code,
        period_days: p,
        is_enabled: enabled,
        ...(clearHold ? { legal_review_required: false, legal_review_note: legalNote.trim() } : {}),
        reason: reason.trim(),
      }).unwrap();
      toast.showToast('Rule saved (audit-logged)', 'success');
      onClose();
    } catch (e) {
      toast.showToast(normalizeApiError(e).message, 'error');
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change: {rule.category}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Typography fontSize={13} color="text.secondary">{rule.description}</Typography>
          <TextField label={`Period (days, ${rule.min_period_days}–3650)`} value={period} onChange={(e) => setPeriod(e.target.value)}
            error={!periodOk} type="number" size="small" />
          {rule.legal_review_required && (
            <Alert severity="warning">
              On legal review hold: {rule.legal_review_note}
              <FormControlLabel sx={{ display: 'block', mt: 1 }} control={<Switch checked={clearHold} onChange={(e) => setClearHold(e.target.checked)} />}
                label="Legal review is complete" />
              {clearHold && (
                <TextField fullWidth size="small" sx={{ mt: 1 }} label="Who confirmed it, and when" value={legalNote} onChange={(e) => setLegalNote(e.target.value)} />
              )}
            </Alert>
          )}
          <FormControlLabel
            control={<Switch checked={enabled} disabled={!canEnable && !rule.is_enabled} onChange={(e) => setEnabled(e.target.checked)} />}
            label={rule.dry_run_only ? 'Report only: can never delete' : stillHeld ? 'Cannot be switched on while on legal review hold' : 'Rule on (deletes or masks on schedule)'}
          />
          {turningOn && (
            <Alert severity="error">
              Switching this on deletes or masks real data on the next scheduled run. Run a dry run first and check the counts.
            </Alert>
          )}
          <TextField label="Reason (kept in the audit log)" value={reason} onChange={(e) => setReason(e.target.value)} multiline minRows={2} size="small"
            helperText="At least 10 characters" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color={turningOn ? 'error' : 'primary'} disabled={!ok || isLoading} onClick={() => void submit()}>
          {turningOn ? 'Switch on' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
