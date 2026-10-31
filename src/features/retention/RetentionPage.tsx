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
  CLASSIFICATION_LABEL,
  type Classification,
  periodText,
  ruleSection,
  formatBytes,
  type LegalHold,
  type RetentionRule,
  type RetentionRun,
  useDryRunAllMutation,
  useGetHoldsQuery,
  useGetPreviewQuery,
  useGetRuleHistoryQuery,
  usePlaceHoldMutation,
  useReleaseHoldMutation,
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
      <Chip size="small" variant="outlined" label={CLASSIFICATION_LABEL[rule.classification] ?? rule.classification}
        color={rule.classification === 'LEGAL_REQUIREMENT' ? 'primary' : rule.classification === 'LEGAL_REVIEW' ? 'warning' : 'default'} />
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
  const [details, setDetails] = useState<RetentionRule | null>(null);
  const roles = useAppSelector((s) => s.auth.user?.roles ?? []);
  const isSuperAdmin = roles.some((r) => r.code === 'SUPER_ADMIN');
  const toast = useToast();

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />;
  const s = data.summary;

  const runOne = async (code: string) => {
    try {
      const { run } = await dryRun(code).unwrap();
      toast.showToast(`${code}: ${run.eligible} eligible, ${run.held} on hold, ${run.excluded} excluded (nothing changed)`, 'success');
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

      {(['Orders', 'Quotations', 'Market ads', 'Other data'] as const).map((title) => [title, data.rules.filter((r) => ruleSection(r.rule_code) === title)] as const)
        .filter(([, rules]) => rules.length > 0).map(([title, rules]) => (
        <Box key={title as string} mb={2}>
          <Typography fontWeight={700} mb={1}>{title as string}</Typography>
          <RulesTable rules={rules as RetentionRule[]} isSuperAdmin={isSuperAdmin} onDryRun={(c) => void runOne(c)} dryRunning={dryRunState.isLoading}
            onChange={setEditing} onDetails={setDetails} />
        </Box>
      ))}

      <LegalHoldsCard isSuperAdmin={isSuperAdmin} />

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
      {details && <RuleDetailsDialog rule={details} onClose={() => setDetails(null)} />}
    </Box>
  );
}

/** Super admin only. Every change needs a reason (kept in the audit log). */
export function ChangeRuleDialog({ rule, onClose }: { rule: RetentionRule; onClose: () => void }) {
  const [period, setPeriod] = useState(String(rule.period_days));
  const [classification, setClassification] = useState<Classification>(rule.classification);
  const [enabled, setEnabled] = useState(rule.is_enabled);
  const [clearHold, setClearHold] = useState(false);
  const [legalNote, setLegalNote] = useState('');
  const [reason, setReason] = useState('');
  const [save, { isLoading }] = useUpdateRuleMutation();
  const toast = useToast();
  const p = Number(period);
  const maxPeriod = rule.period_unit === 'FINANCIAL_YEARS' ? 50 : 3650;
  const unit = rule.period_unit === 'FINANCIAL_YEARS' ? 'financial years' : 'days';
  const periodOk = Number.isInteger(p) && p >= rule.min_period_days && p <= maxPeriod;
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
        classification,
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
          <TextField label={`Period (${unit}, ${rule.min_period_days}–${maxPeriod})`} value={period} onChange={(e) => setPeriod(e.target.value)}
            error={!periodOk} type="number" size="small"
            helperText={rule.period_unit === 'FINANCIAL_YEARS' ? 'Kept through the end of this many financial years after the record’s own (April–March, India time)' : undefined} />
          <TextField select SelectProps={{ native: true }} size="small" label="Classification" value={classification}
            onChange={(e) => setClassification(e.target.value as Classification)}>
            {(Object.keys(CLASSIFICATION_LABEL) as Classification[]).map((c) => <option key={c} value={c}>{CLASSIFICATION_LABEL[c]}</option>)}
          </TextField>
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

function RulesTable({ rules, isSuperAdmin, onDryRun, dryRunning, onChange, onDetails }: {
  rules: RetentionRule[]; isSuperAdmin: boolean; onDryRun: (code: string) => void; dryRunning: boolean;
  onChange: (r: RetentionRule) => void; onDetails: (r: RetentionRule) => void;
}) {
  return (
    <Card variant="outlined" sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Data</TableCell>
            <TableCell>Action</TableCell>
            <TableCell align="right">Period</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Eligible</TableCell>
            <TableCell align="right">On hold</TableCell>
            <TableCell align="right">Excluded</TableCell>
            <TableCell>Last dry run</TableCell>
            <TableCell>Last execution</TableCell>
            <TableCell>Next run</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rules.map((r) => (
            <TableRow key={r.rule_code} hover>
              <TableCell>
                <Typography fontWeight={600} fontSize={14}>{r.category}</Typography>
                <Typography fontSize={12} color="text.secondary">{r.description}</Typography>
              </TableCell>
              <TableCell>{ACTION_LABEL[r.action]}</TableCell>
              <TableCell align="right">{periodText(r)}</TableCell>
              <TableCell><StatusChips rule={r} /></TableCell>
              <TableCell align="right">
                {r.last_dry_run ? r.last_dry_run.eligible : '-'}
                {r.action === 'REPORT' && r.last_dry_run ? <Typography fontSize={12} color="text.secondary">{formatBytes(r.last_dry_run.bytes)}</Typography> : null}
              </TableCell>
              <TableCell align="right">{r.last_dry_run ? r.last_dry_run.held : '-'}</TableCell>
              <TableCell align="right">{r.last_dry_run ? r.last_dry_run.excluded : '-'}</TableCell>
              <TableCell>{runText(r.last_dry_run)}</TableCell>
              <TableCell>{r.last_execution ? `${runText(r.last_execution)} · ${r.last_execution.affected} changed` : 'Never'}</TableCell>
              <TableCell>{r.next_run_at ? formatDateTime(r.next_run_at) : 'At next start'}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => onDryRun(r.rule_code)} disabled={dryRunning}>Dry run</Button>
                  <Button size="small" onClick={() => onDetails(r)}>Details</Button>
                  {isSuperAdmin && <Button size="small" variant="outlined" onClick={() => onChange(r)}>Change</Button>}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

/** What a rule would touch now (codes only) and who changed it, when and why. */
export function RuleDetailsDialog({ rule, onClose }: { rule: RetentionRule; onClose: () => void }) {
  const preview = useGetPreviewQuery(rule.rule_code);
  const history = useGetRuleHistoryQuery(rule.id);
  const list = (title: string, items?: string[]) => (
    <Box>
      <Typography fontWeight={600} fontSize={14}>{title} ({items?.length ?? 0}{items && items.length >= 50 ? '+' : ''})</Typography>
      <Typography fontSize={13} color="text.secondary" sx={{ wordBreak: 'break-word' }}>{items && items.length ? items.join(', ') : 'None'}</Typography>
    </Box>
  );
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{rule.category}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography fontSize={13} color="text.secondary">Records as of now (codes only; nothing is changed by looking).</Typography>
          {preview.isLoading ? <LoadingState /> : preview.error ? <Alert severity="error">{normalizeApiError(preview.error).message}</Alert> : (
            <>
              {list('Eligible', preview.data?.preview.eligible)}
              {list('On hold (legal hold or pending report)', preview.data?.preview.held)}
              {list('Excluded (open enquiry or shared)', preview.data?.preview.excluded)}
            </>
          )}
          <Typography fontWeight={700}>Change history</Typography>
          {(history.data?.audit_logs ?? []).length === 0 ? <Typography fontSize={13} color="text.secondary">No changes yet.</Typography> : (
            <Table size="small">
              <TableHead><TableRow><TableCell>When</TableCell><TableCell>Who</TableCell><TableCell>Change and reason</TableCell></TableRow></TableHead>
              <TableBody>
                {(history.data?.audit_logs ?? []).map((a) => (
                  <TableRow key={a.id}><TableCell>{formatDateTime(a.changed_at)}</TableCell><TableCell>{a.user_name ?? '-'}</TableCell><TableCell>{a.description}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}

const HOLD_TYPES: Record<LegalHold['entity_type'], string> = {
  ORDER: 'Order', QUOTATION: 'Quotation', PAYMENT: 'Payment', MARKET_AD: 'Market ad', MARKET_ENQUIRY: 'Market enquiry',
};

/** Legal holds override every rule. Super admins place and release them, always with a reason. */
export function LegalHoldsCard({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const { data } = useGetHoldsQuery();
  const [place, placing] = usePlaceHoldMutation();
  const [release] = useReleaseHoldMutation();
  const [type, setType] = useState<LegalHold['entity_type']>('ORDER');
  const [code, setCode] = useState('');
  const [reason, setReason] = useState('');
  const [releasing, setReleasing] = useState<LegalHold | null>(null);
  const [releaseReason, setReleaseReason] = useState('');
  const toast = useToast();
  const holds = data?.holds ?? [];
  const run = (p: Promise<unknown>, ok: string, after?: () => void) =>
    p.then(() => { toast.showToast(ok, 'success'); after?.(); }).catch((e) => toast.showToast(normalizeApiError(e).message, 'error'));

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography fontWeight={700}>Legal holds</Typography>
        <Typography fontSize={13} color="text.secondary" mb={1}>
          A hold on an ad keeps its location and photos; on an enquiry, its chat; on an order, the order, its payments, documents, delivery proof and quotation; on a quotation or payment, that record. Holds override every rule.
        </Typography>
        {isSuperAdmin && (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} mb={2}>
            <TextField select SelectProps={{ native: true }} size="small" label="Type" value={type} onChange={(e) => setType(e.target.value as LegalHold['entity_type'])}>
              {Object.entries(HOLD_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </TextField>
            <TextField size="small" label="Code (ad, enquiry, order, quotation or payment)" value={code} onChange={(e) => setCode(e.target.value)} />
            <TextField size="small" label="Reason (kept with the hold)" value={reason} onChange={(e) => setReason(e.target.value)} sx={{ flex: 1 }} />
            <Button variant="contained" disabled={!code.trim() || reason.trim().length < 10 || placing.isLoading}
              onClick={() => void run(place({ entity_type: type, code: code.trim(), reason: reason.trim() }).unwrap(), 'Legal hold placed', () => { setCode(''); setReason(''); })}>
              Place hold
            </Button>
          </Stack>
        )}
        <Table size="small">
          <TableHead>
            <TableRow><TableCell>On</TableCell><TableCell>Reason</TableCell><TableCell>Placed</TableCell><TableCell>Released</TableCell><TableCell /></TableRow>
          </TableHead>
          <TableBody>
            {holds.length === 0 && <TableRow><TableCell colSpan={5}>No legal holds.</TableCell></TableRow>}
            {holds.map((h) => (
              <TableRow key={h.id}>
                <TableCell>{HOLD_TYPES[h.entity_type]} {h.entity_code ?? `#${h.entity_id}`}</TableCell>
                <TableCell>{h.reason}</TableCell>
                <TableCell>{formatDateTime(h.placed_at)} · {h.placed_by ?? '-'}</TableCell>
                <TableCell>{h.released_at ? `${formatDateTime(h.released_at)} · ${h.released_by ?? '-'}: ${h.release_reason ?? ''}` : <Chip size="small" color="warning" label="Active" />}</TableCell>
                <TableCell>{isSuperAdmin && !h.released_at && <Button size="small" onClick={() => setReleasing(h)}>Release</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      {releasing && (
        <Dialog open onClose={() => setReleasing(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Release hold on {releasing.entity_code ?? `#${releasing.entity_id}`}</DialogTitle>
          <DialogContent>
            <TextField fullWidth multiline minRows={2} sx={{ mt: 1 }} label="Why it can be released (kept with the hold)" value={releaseReason}
              onChange={(e) => setReleaseReason(e.target.value)} helperText="At least 10 characters" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReleasing(null)}>Cancel</Button>
            <Button variant="contained" disabled={releaseReason.trim().length < 10}
              onClick={() => void run(release({ id: releasing.id, reason: releaseReason.trim() }).unwrap(), 'Legal hold released', () => { setReleasing(null); setReleaseReason(''); })}>
              Release
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Card>
  );
}
