import { Alert, Box, Button, Chip, MenuItem, Stack, TextField, Typography } from '@mui/material';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { type PaymentIssue, useListPaymentIssuesQuery, useResolvePaymentIssueMutation } from '../../api/adminResources';
import { AppDataTable } from '../../components/data-table/AppDataTable';
import { ErrorState } from '../../components/feedback/ErrorState';
import { TableSkeleton } from '../../components/feedback/LoadingState';
import { useToast } from '../../components/feedback/toastContext';
import { FormDrawer } from '../../components/forms/FormDrawer';
import { PageHeader } from '../../components/page/PageHeader';
import { normalizeApiError } from '../../utils/apiError';

const typeLabel: Record<PaymentIssue['issue_type'], string> = {
  PAID_NOT_APPLIED: 'Paid, not applied',
  REFUND_FAILED: 'Refund failed',
};

const whatToDo: Record<PaymentIssue['issue_type'], string> = {
  PAID_NOT_APPLIED:
    'The customer was charged but GreenRoot could not apply the payment (for example the subscription was paused after checkout). Refund it in the Razorpay dashboard, or apply it to the subscription by hand, then resolve this with what you did.',
  REFUND_FAILED:
    'Razorpay could not return this money to the customer. Retry the refund in the Razorpay dashboard (or pay the customer another way), then resolve this with the new refund id.',
};

function formatDate(value?: string) {
  return value
    ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';
}

function money(amount?: number) {
  return amount == null ? '—' : `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

/**
 * Admin → Payment issues: Razorpay money that moved but could not be applied
 * here. The API records them from the webhook (and raises the PaymentIssues
 * alarm); each stays OPEN until an admin settles it in Razorpay and resolves
 * it with a note.
 */
export function PaymentIssuesPage() {
  const [status, setStatus] = useState('OPEN');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [open, setOpen] = useState<PaymentIssue | null>(null);
  const { data, isFetching, error, refetch } = useListPaymentIssuesQuery({ status });
  const issues = data?.issues ?? [];

  const columns: ColumnDef<PaymentIssue>[] = [
    { id: '_when', header: 'Received', cell: ({ row }) => formatDate(row.original.created_at) },
    {
      id: '_type',
      header: 'Issue',
      cell: ({ row }) => (
        <Chip
          size="small"
          color={row.original.issue_type === 'REFUND_FAILED' ? 'error' : 'warning'}
          label={typeLabel[row.original.issue_type]}
          sx={{ height: 22, fontSize: 11 }}
        />
      ),
    },
    { id: '_amount', header: 'Amount', cell: ({ row }) => money(row.original.amount) },
    {
      id: '_ids',
      header: 'Razorpay',
      cell: ({ row }) => (
        <Box>
          <Typography fontSize={12} fontFamily="monospace">{row.original.provider_payment_id}</Typography>
          {row.original.provider_order_id && (
            <Typography fontSize={12} fontFamily="monospace" color="text.secondary">{row.original.provider_order_id}</Typography>
          )}
          {row.original.provider_refund_id && (
            <Typography fontSize={12} fontFamily="monospace" color="text.secondary">{row.original.provider_refund_id}</Typography>
          )}
        </Box>
      ),
    },
    { id: '_user', header: 'User', cell: ({ row }) => (row.original.user_id ? `#${row.original.user_id}` : '—') },
    { id: '_reason', header: 'Why', cell: ({ row }) => row.original.reason },
    {
      id: '_action',
      header: '',
      cell: ({ row }) =>
        row.original.status === 'OPEN' ? (
          <Button size="small" variant="contained" onClick={() => setOpen(row.original)}>
            Resolve
          </Button>
        ) : (
          <Typography fontSize={12} color="text.secondary">
            Resolved {formatDate(row.original.resolved_at)}
          </Typography>
        ),
    },
  ];

  const pageRows = issues.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <Box>
      <PageHeader
        title="Payment Issues"
        description="Razorpay payments and refunds that need a manual action. Settle each one in the Razorpay dashboard, then resolve it here."
      />
      <TextField
        select
        size="small"
        label="Status"
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setPage(0);
        }}
        sx={{ minWidth: 180, mb: 2 }}
      >
        <MenuItem value="OPEN">Open</MenuItem>
        <MenuItem value="RESOLVED">Resolved</MenuItem>
        <MenuItem value="">All</MenuItem>
      </TextField>
      {status === 'OPEN' && !isFetching && !error && issues.length === 0 && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Nothing to settle: every Razorpay payment and refund was applied.
        </Alert>
      )}
      {isFetching && <TableSkeleton rows={4} cols={columns.length} />}
      {error && <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />}
      {!isFetching && !error && issues.length > 0 && (
        <AppDataTable
          columns={columns}
          data={pageRows}
          count={issues.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => {
            setRowsPerPage(n);
            setPage(0);
          }}
        />
      )}

      <FormDrawer open={open !== null} title="Resolve payment issue" onClose={() => setOpen(null)} width={{ xs: '100%', sm: 520 }}>
        {open && <ResolvePanel key={open.id} issue={open} onDone={() => setOpen(null)} />}
      </FormDrawer>
    </Box>
  );
}

export function ResolvePanel({ issue, onDone }: { issue: PaymentIssue; onDone: () => void }) {
  const { showToast } = useToast();
  const [note, setNote] = useState('');
  const [resolve, state] = useResolvePaymentIssueMutation();
  const tooShort = note.trim().length < 5;

  const submit = async () => {
    try {
      await resolve({ id: issue.id, note: note.trim() }).unwrap();
      showToast('Payment issue resolved', 'success');
      onDone();
    } catch (e) {
      showToast(normalizeApiError(e).message, 'error');
    }
  };

  return (
    <Stack spacing={2}>
      <Alert severity="warning">{whatToDo[issue.issue_type]}</Alert>
      <Typography fontSize={13}>
        {money(issue.amount)} · payment <code>{issue.provider_payment_id}</code>
      </Typography>
      <Typography fontSize={13} color="text.secondary">
        {issue.reason}
      </Typography>
      <TextField
        label="What did you do?"
        placeholder="Refunded in the Razorpay dashboard, rfnd_..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        multiline
        minRows={3}
        required
        helperText={tooShort ? 'At least 5 characters' : ' '}
      />
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button onClick={onDone}>Cancel</Button>
        <Button variant="contained" disabled={tooShort || state.isLoading} onClick={submit}>
          Mark resolved
        </Button>
      </Stack>
    </Stack>
  );
}
