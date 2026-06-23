import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useGetSubscriptionQuery,
  useListSubscriptionPaymentsQuery,
  useRenewSubscriptionMutation,
  useCancelSubscriptionMutation,
} from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { StatusChip } from '../../components/status/StatusChip';
import { normalizeApiError } from '../../utils/apiError';

function text(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function money(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? `₹${n.toFixed(2)}` : '-';
}

export function SubscriptionDetailPanel({ subscriptionId }: { subscriptionId: number }) {
  const subQuery = useGetSubscriptionQuery(subscriptionId);
  const paymentsQuery = useListSubscriptionPaymentsQuery(subscriptionId);
  const [renew, renewState] = useRenewSubscriptionMutation();
  const [cancel, cancelState] = useCancelSubscriptionMutation();
  const [actionError, setActionError] = useState('');

  if (subQuery.isLoading) return <LoadingState />;
  if (subQuery.error)
    return <ErrorState message={normalizeApiError(subQuery.error).message} onRetry={subQuery.refetch} />;

  const sub = subQuery.data?.subscription ?? {};
  const payments = paymentsQuery.data?.payments ?? [];
  const isCancelled = sub.subscription_status === 'CANCELLED';

  const summaryItems: Array<[string, unknown]> = [
    ['Plan', sub.plan_name],
    ['Plan Code', sub.plan_code],
    ['User ID', sub.user_id],
    ['Start Date', sub.start_date],
    ['End Date', sub.end_date],
    ['Auto Renew', sub.auto_renew ? 'Yes' : 'No'],
  ];

  async function handleRenew() {
    try {
      setActionError('');
      await renew(subscriptionId).unwrap();
      subQuery.refetch();
    } catch (e) {
      setActionError(normalizeApiError(e).message);
    }
  }

  async function handleCancel() {
    if (!window.confirm('Cancel this subscription? This cannot be undone.')) return;
    try {
      setActionError('');
      await cancel(subscriptionId).unwrap();
      subQuery.refetch();
    } catch (e) {
      setActionError(normalizeApiError(e).message);
    }
  }

  return (
    <Stack spacing={2}>
      {actionError && <Alert severity="error">{actionError}</Alert>}

      <Paper sx={{ p: 2 }} variant="outlined">
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography color="text.secondary" variant="body2">Subscription</Typography>
              <Typography variant="h6">{text(sub.subscription_code)}</Typography>
            </Box>
            <StatusChip value={sub.subscription_status} />
          </Stack>

          <Grid container spacing={1.5}>
            {summaryItems.map(([label, value]) => (
              <Grid key={String(label)} size={{ xs: 12, sm: 6 }}>
                <Typography color="text.secondary" variant="caption">{label}</Typography>
                <Typography variant="body2">{text(value)}</Typography>
              </Grid>
            ))}
          </Grid>

          <Divider />

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              size="small"
              disabled={renewState.isLoading || isCancelled}
              onClick={handleRenew}
            >
              {renewState.isLoading ? <CircularProgress size={14} /> : 'Renew'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              disabled={cancelState.isLoading || isCancelled}
              onClick={handleCancel}
            >
              {cancelState.isLoading ? <CircularProgress size={14} /> : 'Cancel'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Box>
        <Typography sx={{ mb: 1 }} variant="subtitle1">Payments</Typography>
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Code', 'Method', 'Amount', 'Status', 'Reference'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary" variant="body2">No payments recorded.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell>{text(p.payment_code)}</TableCell>
                    <TableCell>{text(p.payment_method)}</TableCell>
                    <TableCell>{money(p.amount)}</TableCell>
                    <TableCell><StatusChip value={p.payment_status} /></TableCell>
                    <TableCell>{text(p.transaction_reference)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Stack>
  );
}
