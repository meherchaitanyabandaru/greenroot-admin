import AutorenewIcon from '@mui/icons-material/Autorenew';
import BlockIcon from '@mui/icons-material/Block';
import CloseIcon from '@mui/icons-material/Close';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
  useRenewSubscriptionMutation,
  useUpdateSubscriptionStatusMutation,
} from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { StatusChip } from '../../components/status/StatusChip';
import { normalizeApiError } from '../../utils/apiError';

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
function RenewDialog({ open, onClose, onSubmit, loading }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (billingCycle: string, paymentMethod: string) => void;
  loading: boolean;
}) {
  const [cycle, setCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [method, setMethod] = useState('UPI');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Renew Subscription</Typography>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 500 }}>Billing Cycle</Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={cycle}
              onChange={(_, v) => v && setCycle(v)}
              size="small"
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', py: 1 } }}
            >
              <ToggleButton value="MONTHLY">
                <Stack spacing={0} alignItems="center">
                  <Typography variant="body2" fontWeight={600}>Monthly</Typography>
                  <Typography variant="caption" color="text.secondary">₹499/mo</Typography>
                </Stack>
              </ToggleButton>
              <ToggleButton value="YEARLY">
                <Stack spacing={0} alignItems="center">
                  <Typography variant="body2" fontWeight={600}>Yearly</Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">₹4,999/yr</Typography>
                    <Chip size="small" label="Save 17%" sx={{ bgcolor: '#D1FAE5', color: '#16A34A', fontWeight: 700, fontSize: 9, height: 16 }} />
                  </Stack>
                </Stack>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <FormControl fullWidth size="small">
            <InputLabel>Payment Method</InputLabel>
            <Select value={method} label="Payment Method" onChange={(e) => setMethod(e.target.value)}>
              <MenuItem value="UPI">UPI</MenuItem>
              <MenuItem value="CARD">Card</MenuItem>
              <MenuItem value="NETBANKING">Net Banking</MenuItem>
              <MenuItem value="CASH">Cash</MenuItem>
              <MenuItem value="RAZORPAY_MOCK">Mock (Test)</MenuItem>
            </Select>
          </FormControl>

          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>Billing Summary</Typography>
            {(() => {
              const base = cycle === 'YEARLY' ? 4999 : 499;
              return (
                <Stack spacing={0.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Base ({cycle === 'YEARLY' ? 'Annual' : 'Monthly'})</Typography>
                    <Typography variant="body2">₹{base.toLocaleString('en-IN')}</Typography>
                  </Stack>
                  <Divider sx={{ my: 0.5 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={700}>Total</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      ₹{base.toLocaleString('en-IN')}
                    </Typography>
                  </Stack>
                </Stack>
              );
            })()}
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button
          variant="contained"
          size="small"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} /> : <AutorenewIcon fontSize="small" />}
          onClick={() => onSubmit(cycle, method)}
        >
          Confirm Renewal
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
  const [renew, renewState] = useRenewSubscriptionMutation();
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

  async function handleRenew(billingCycle: string, paymentMethod: string) {
    try {
      setActionError('');
      await renew({
        id: subscriptionId,
        body: {
          billing_cycle: billingCycle,
          payment_method: paymentMethod,
          provider: 'razorpay_mock',
          provider_order_id: `MOCK-ORDER-${Date.now()}`,
        },
      }).unwrap();
      setActionSuccess('Subscription renewed successfully.');
      setRenewOpen(false);
      subQuery.refetch();
      paymentsQuery.refetch();
      onMutated?.();
    } catch (e) {
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
              Renew Subscription
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
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    {['Code', 'Date', 'Method', 'Amount', 'Status'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: 'text.secondary', py: 1 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{String(p.payment_code ?? '—')}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{fmtDate(p.payment_date ?? p.created_at)}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{String(p.payment_method ?? '—')}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{fmtMoney(p.amount)}</TableCell>
                      <TableCell><StatusChip value={p.payment_status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
