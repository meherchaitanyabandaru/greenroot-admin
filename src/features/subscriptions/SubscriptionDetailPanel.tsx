import AutorenewIcon from '@mui/icons-material/Autorenew';
import BlockIcon from '@mui/icons-material/Block';
import CloseIcon from '@mui/icons-material/Close';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import UndoIcon from '@mui/icons-material/Undo';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useCancelSubscriptionMutation,
  useGetSubscriptionQuery,
  useListSubscriptionPaymentsQuery,
  useListSubscriptionPlansQuery,
  useRefundSubscriptionPaymentMutation,
  useRenewSubscriptionMutation,
  useUpdateSubscriptionStatusMutation,
} from '../../api/adminResources';
import type { SubscriptionPlan } from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { StatusChip } from '../../components/status/StatusChip';
import { normalizeApiError } from '../../utils/apiError';
import { canRefund } from './refundRules';

function fmtDate(dateStr: unknown): string {
  if (!dateStr) return '—';
  return new Date(String(dateStr)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtMoney(value: unknown): string {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
}

function daysUntil(dateStr: unknown): number | null {
  if (!dateStr) return null;
  return Math.max(0, Math.floor((new Date(String(dateStr)).getTime() - Date.now()) / 86400000));
}

interface Props {
  subscriptionId: number;
  onClose?: () => void;
  onMutated?: () => void;
}

// ── Renew Dialog ──────────────────────────────────────────────────────────────
// Records a payment made outside the app (cash, bank transfer…). Owners pay
// online in the app through Razorpay; the API sets the amount from the plan.
const OFFLINE_METHODS: [string, string][] = [
  ['UPI', 'UPI (direct)'],
  ['BANK_TRANSFER', 'Bank transfer'],
  ['NET_BANKING', 'Net banking'],
  ['CASH', 'Cash'],
  ['CHEQUE', 'Cheque'],
];

function RenewDialog({ open, onClose, onSubmit, loading, plans, currentPlanId, endDate }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (billingCycle: string, paymentMethod: string, planId: number) => void;
  loading: boolean;
  plans: SubscriptionPlan[];
  currentPlanId: number;
  endDate: unknown;
}) {
  // Only paid plans: "renewing" the free trial recorded nothing and just stacked free time.
  const paidPlans = plans.filter((p) => p.is_active && Number(p.six_month_price ?? 0) > 0);
  const [cycle, setCycle] = useState<'SIX_MONTH' | 'YEARLY'>('SIX_MONTH');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [planId, setPlanId] = useState<number>(
    paidPlans.some((p) => p.id === currentPlanId) ? currentPlanId : (paidPlans[0]?.id ?? 0),
  );
  const plan = paidPlans.find((p) => p.id === planId);
  const price = cycle === 'YEARLY' ? plan?.yearly_price : plan?.six_month_price;
  const period = renewalPeriod(endDate, cycle);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Record Offline Payment</Typography>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Alert severity="info" variant="outlined">
            Use this only for money received outside the app. It renews the subscription and records the payment as paid.
          </Alert>
          <FormControl fullWidth size="small">
            <InputLabel>Plan</InputLabel>
            <Select value={planId || ''} label="Plan" onChange={(e) => setPlanId(Number(e.target.value))}>
              {paidPlans.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.plan_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 500 }}>
              Billing Cycle{plan ? ` · ${plan.plan_name}` : ''}
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={cycle}
              onChange={(_, v) => v && setCycle(v)}
              size="small"
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', py: 1 } }}
            >
              <ToggleButton value="SIX_MONTH">
                <Stack spacing={0} alignItems="center">
                  <Typography variant="body2" fontWeight={600}>6 Months</Typography>
                  <Typography variant="caption" color="text.secondary">{plan ? fmtMoney(plan.six_month_price) : '—'}</Typography>
                </Stack>
              </ToggleButton>
              <ToggleButton value="YEARLY">
                <Stack spacing={0} alignItems="center">
                  <Typography variant="body2" fontWeight={600}>Yearly</Typography>
                  <Typography variant="caption" color="text.secondary">{plan ? fmtMoney(plan.yearly_price) : '—'}</Typography>
                </Stack>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <FormControl fullWidth size="small">
            <InputLabel>Received via</InputLabel>
            <Select value={method} label="Received via" onChange={(e) => setMethod(e.target.value)}>
              {OFFLINE_METHODS.map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" fontWeight={700}>Amount</Typography>
              <Typography variant="body2" fontWeight={700} color="primary.main">{price != null ? fmtMoney(price) : '—'}</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">Plan price for the cycle, before any promo.</Typography>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">New period</Typography>
              <Typography variant="body2" fontWeight={600}>{fmtDate(period.start)} → {fmtDate(period.end)}</Typography>
            </Stack>
            {period.stacks && (
              <Typography variant="caption" color="warning.main">
                Starts after the current period ends ({fmtDate(endDate)}), so it adds time on top.
              </Typography>
            )}
          </Paper>
          {period.tooEarly && (
            <Alert severity="warning">
              Already paid until {fmtDate(endDate)} — more than a year ahead. Renew closer to that date.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button
          variant="contained"
          size="small"
          disabled={loading || !plan || period.tooEarly}
          startIcon={loading ? <CircularProgress size={14} /> : <AutorenewIcon fontSize="small" />}
          onClick={() => onSubmit(cycle, method, planId)}
        >
          Record &amp; Renew
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Mirrors the API: a renewal starts the day after the current end (or today if
// it has passed) and is refused while more than a year is already paid.
function renewalPeriod(endDate: unknown, cycle: 'SIX_MONTH' | 'YEARLY') {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = endDate ? new Date(String(endDate)) : null;
  const stacks = end != null && end >= today;
  const start = stacks ? new Date(end.getTime() + 86400000) : today;
  const until = new Date(start);
  until.setMonth(until.getMonth() + (cycle === 'YEARLY' ? 12 : 6));
  until.setDate(until.getDate() - 1);
  const yearAhead = new Date(today);
  yearAhead.setFullYear(yearAhead.getFullYear() + 1);
  return { start, end: until, stacks, tooEarly: end != null && end > yearAhead };
}

// ── Refund Dialog ─────────────────────────────────────────────────────────────
// Full Razorpay refund of the latest payment, within 7 days (the API enforces it).
function RefundDialog({ payment, onClose, onSubmit, loading }: {
  payment: Record<string, unknown> | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');
  const valid = reason.trim().length >= 5;
  return (
    <Dialog open={payment != null} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Refund {fmtMoney(payment?.amount)}?</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2">
            Payment <b>{String(payment?.payment_code ?? '')}</b> · Razorpay{' '}
            <Box component="span" sx={{ fontFamily: 'monospace' }}>{String(payment?.provider_payment_id ?? '')}</Box>
          </Typography>
          <Alert severity="warning" variant="outlined">
            The full amount goes back to the customer (5–7 working days) and the period this payment bought is removed.
            If that period has already started, the subscription expires now. This cannot be undone.
          </Alert>
          <TextField
            label="Reason"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            helperText="Required, at least 5 characters. Stored with the payment and in the audit log."
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button
          variant="contained"
          color="error"
          size="small"
          disabled={loading || !valid}
          startIcon={loading ? <CircularProgress size={14} /> : <UndoIcon fontSize="small" />}
          onClick={() => onSubmit(reason.trim())}
        >
          Refund
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Cancel Dialog ─────────────────────────────────────────────────────────────
function CancelDialog({ open, onClose, onSubmit, loading }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');

  function handleSubmit() {
    onSubmit(reason);
    setReason('');
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1, color: 'error.main' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <BlockIcon fontSize="small" />
          <Typography variant="h6">Cancel Subscription</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2, fontSize: 13 }}>
          Cancellation takes effect immediately and cannot be undone.
        </Alert>
        <TextField
          fullWidth
          size="small"
          multiline
          rows={3}
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Owner requested cancellation, duplicate account…"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">Keep Active</Button>
        <Button
          variant="contained"
          color="error"
          size="small"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} /> : <BlockIcon fontSize="small" />}
          onClick={handleSubmit}
        >
          Cancel Subscription
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function SubscriptionDetailPanel({ subscriptionId, onClose, onMutated }: Props) {
  const subQuery = useGetSubscriptionQuery(subscriptionId);
  const paymentsQuery = useListSubscriptionPaymentsQuery(subscriptionId);
  const plansQuery = useListSubscriptionPlansQuery();
  const [renew, renewState] = useRenewSubscriptionMutation();
  const [refund, refundState] = useRefundSubscriptionPaymentMutation();
  const [refundPayment, setRefundPayment] = useState<Record<string, unknown> | null>(null);
  const [cancel, cancelState] = useCancelSubscriptionMutation();
  const [updateStatus, updateStatusState] = useUpdateSubscriptionStatusMutation();

  const [renewOpen, setRenewOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  if (subQuery.isLoading) return <LoadingState />;
  if (subQuery.error)
    return <ErrorState message={normalizeApiError(subQuery.error).message} onRetry={subQuery.refetch} />;

  const sub = subQuery.data?.subscription ?? {};
  const payments = (paymentsQuery.data?.payments ?? []) as Record<string, unknown>[];
  const status = String(sub.subscription_status ?? '');
  const isCancelled = status === 'CANCELLED';
  const isExpired = status === 'EXPIRED';
  const days = daysUntil(sub.end_date);
  const capabilities = (sub.capabilities ?? {}) as Record<string, boolean>;
  const canRenew = capabilities.can_renew ?? false;
  const canCancel = capabilities.can_cancel ?? false;
  const canPause = capabilities.can_pause ?? false;
  const canResume = capabilities.can_resume ?? false;

  async function handleRenew(billingCycle: string, paymentMethod: string, planId: number) {
    try {
      setActionError('');
      await renew({
        id: subscriptionId,
        body: {
          billing_cycle: billingCycle,
          plan_id: planId,
          payment_method: paymentMethod, // no provider: an offline payment, recorded as paid
        },
      }).unwrap();
      setActionSuccess('Offline payment recorded and subscription renewed.');
      setRenewOpen(false);
      subQuery.refetch();
      paymentsQuery.refetch();
      onMutated?.();
    } catch (e) {
      setActionError(normalizeApiError(e).message);
    }
  }

  async function handleRefund(reason: string) {
    if (!refundPayment) return;
    try {
      setActionError('');
      await refund({ id: subscriptionId, paymentId: Number(refundPayment.id), reason }).unwrap();
      setActionSuccess(`Refunded ${fmtMoney(refundPayment.amount)}. It reaches the customer in 5–7 working days.`);
      setRefundPayment(null);
      subQuery.refetch();
      paymentsQuery.refetch();
      onMutated?.();
    } catch (e) {
      setRefundPayment(null);
      setActionError(normalizeApiError(e).message);
    }
  }

  async function handleCancel(reason: string) {
    try {
      setActionError('');
      await cancel({
        id: subscriptionId,
        body: { cancel_immediately: true, ...(reason ? { reason } : {}) },
      }).unwrap();
      setActionSuccess('Subscription cancelled.');
      setCancelOpen(false);
      subQuery.refetch();
      onMutated?.();
    } catch (e) {
      setActionError(normalizeApiError(e).message);
    }
  }

  async function handleStatusUpdate() {
    if (!newStatus) return;
    try {
      setActionError('');
      await updateStatus({ id: subscriptionId, status: newStatus }).unwrap();
      setActionSuccess(`Status updated to ${newStatus}.`);
      setNewStatus('');
      subQuery.refetch();
      onMutated?.();
    } catch (e) {
      setActionError(normalizeApiError(e).message);
    }
  }

  return (
    <>
      <Stack spacing={2.5}>
        {/* Header */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                p: 1,
                bgcolor: isCancelled || isExpired ? '#F3F4F6' : '#ECFDF5',
                borderRadius: 2,
                color: isCancelled || isExpired ? 'text.disabled' : '#16A34A',
                display: 'flex',
              }}
            >
              <WorkspacePremiumIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                {String(sub.subscription_code ?? 'Subscription')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                User #{String(sub.user_id ?? '—')}
              </Typography>
            </Box>
          </Stack>
          {onClose && (
            <Tooltip title="Close">
              <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Feedback */}
        {actionError && <Alert severity="error" onClose={() => setActionError('')}>{actionError}</Alert>}
        {actionSuccess && <Alert severity="success" onClose={() => setActionSuccess('')}>{actionSuccess}</Alert>}

        {/* Status hero card */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2,
            background: isCancelled || isExpired
              ? 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)'
              : days !== null && days <= 14
              ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'
              : 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>Plan</Typography>
              <Typography variant="h6" fontWeight={700} lineHeight={1.3}>
                {String(sub.plan_name ?? '—')}
                {sub.plan_code === 'TRIAL' && (
                  <Chip size="small" label="Trial" sx={{ ml: 1, bgcolor: '#CFFAFE', color: '#0E7490', fontWeight: 700, fontSize: 10, height: 18 }} />
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {fmtDate(sub.start_date)} → {fmtDate(sub.end_date)}
              </Typography>
            </Box>
            <Stack alignItems="flex-end" spacing={0.5}>
              <StatusChip value={sub.subscription_status} />
              {days !== null && (
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color={days === 0 ? 'error.main' : days <= 14 ? 'warning.main' : 'success.main'}
                >
                  {days === 0 ? 'Expired' : `${days} days left`}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Paper>

        {/* Details grid */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Details</Typography>
          <Stack spacing={1.25}>
            {([
              ['Plan Code', sub.plan_code],
              ['Auto Renew', sub.auto_renew ? 'Enabled' : 'Disabled'],
              ['Created', fmtDate(sub.created_at)],
              ['Last Updated', fmtDate(sub.updated_at)],
            ] as [string, unknown][]).map(([label, value]) => (
              <Stack key={label} direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={500}>{String(value ?? '—')}</Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>

        {/* Actions */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Actions</Typography>
          <Stack spacing={2}>
            {/* Renew */}
            <Button
              variant="contained"
              size="small"
              fullWidth
              disabled={renewState.isLoading || !canRenew}
              startIcon={renewState.isLoading ? <CircularProgress size={14} /> : <AutorenewIcon fontSize="small" />}
              onClick={() => setRenewOpen(true)}
            >
              Record Offline Payment
            </Button>

            {/* Status update */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block', fontWeight: 500 }}>
                Update Status
              </Typography>
              <Stack direction="row" spacing={1}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <Select
                    displayEmpty
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    renderValue={(v) => v || <Typography variant="body2" color="text.secondary">Select new status…</Typography>}
                  >
                    {[
                      ...(canResume ? ['ACTIVE'] : []),
                      ...(canPause ? ['PAUSED'] : []),
                      'EXPIRED',
                    ].map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!newStatus || updateStatusState.isLoading}
                  startIcon={updateStatusState.isLoading ? <CircularProgress size={14} /> : <EditNoteIcon fontSize="small" />}
                  onClick={handleStatusUpdate}
                >
                  Apply
                </Button>
              </Stack>
            </Box>

            {/* Cancel */}
            <Button
              variant="outlined"
              color="error"
              size="small"
              fullWidth
              disabled={cancelState.isLoading || !canCancel}
              startIcon={cancelState.isLoading ? <CircularProgress size={14} /> : <BlockIcon fontSize="small" />}
              onClick={() => setCancelOpen(true)}
            >
              {isCancelled ? 'Already Cancelled' : 'Cancel Subscription'}
            </Button>
          </Stack>
        </Paper>

        {/* Payment history */}
        <Accordion variant="outlined" defaultExpanded={payments.length > 0} sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 48, px: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Payment History
              {payments.length > 0 && (
                <Chip size="small" label={payments.length} sx={{ ml: 1, height: 18, fontSize: 11 }} />
              )}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            {paymentsQuery.isLoading ? (
              <Box sx={{ p: 2 }}><CircularProgress size={20} /></Box>
            ) : payments.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">No payments recorded yet.</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    {['Code', 'Date', 'Method', 'Amount', 'Status', ''].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: 'text.secondary', py: 1 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>
                        {String(p.payment_code ?? '—')}
                        {Boolean(p.provider_payment_id) && (
                          <Typography component="div" sx={{ fontSize: 10, fontFamily: 'monospace', color: 'text.secondary' }}>
                            {String(p.provider_payment_id)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{fmtDate(p.payment_date ?? p.created_at)}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{String(p.payment_method ?? '—')}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{fmtMoney(p.amount)}</TableCell>
                      <TableCell><StatusChip value={p.payment_status} /></TableCell>
                      <TableCell align="right">
                        {canRefund(p, payments) && (
                          <Button size="small" color="error" onClick={() => setRefundPayment(p)}>Refund</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </Stack>

      {/* Dialogs */}
      <RenewDialog
        open={renewOpen}
        onClose={() => setRenewOpen(false)}
        onSubmit={handleRenew}
        loading={renewState.isLoading}
        key={renewOpen ? 'open' : 'closed'}
        plans={plansQuery.data?.plans ?? []}
        currentPlanId={Number(sub.plan_id)}
        endDate={sub.end_date}
      />
      <RefundDialog
        key={String(refundPayment?.id ?? 'none')}
        payment={refundPayment}
        onClose={() => setRefundPayment(null)}
        onSubmit={handleRefund}
        loading={refundState.isLoading}
      />
      <CancelDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onSubmit={handleCancel}
        loading={cancelState.isLoading}
      />
    </>
  );
}
