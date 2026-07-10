import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SendIcon from '@mui/icons-material/Send';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useGetQuotationQuery, useDeleteQuotationMutation, useSendQuotationMutation } from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { normalizeApiError } from '../../utils/apiError';

function text(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return String(value);
}

function money(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? `₹${amount.toFixed(2)}` : '-';
}

function formatDate(iso: unknown) {
  if (!iso || typeof iso !== 'string') return '-';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function statusColor(status: string): 'default' | 'warning' | 'info' | 'success' | 'error' {
  switch (status) {
    case 'DRAFT':    return 'warning';
    case 'SENT':     return 'info';
    case 'ACCEPTED': return 'success';
    case 'REJECTED': return 'error';
    case 'CUSTOMER_DRAFT': return 'warning';
    case 'CUSTOMER_SENT': return 'info';
    case 'CUSTOMER_ACCEPTED': return 'success';
    case 'CUSTOMER_REJECTED': return 'error';
    case 'CONVERTED': return 'success';
    default:         return 'default';
  }
}

function InfoRow({ label, value }: { label: string; value: unknown }) {
  return (
    <Stack direction="row" spacing={2} sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {text(value)}
      </Typography>
    </Stack>
  );
}

export function QuotationDetailPanel({
  quotationId,
  onDeleted,
}: {
  quotationId: number;
  onDeleted?: () => void;
}) {
  const { data, isLoading, error, refetch } = useGetQuotationQuery(quotationId);
  const [deleteQuotation, deleteState] = useDeleteQuotationMutation();
  const [sendQuotation, sendState] = useSendQuotationMutation();

  if (isLoading) return <LoadingState label="Loading quotation…" />;
  if (error) return <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q: Record<string, any> = data?.quotation ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: Record<string, any>[] = (q.items as Record<string, any>[] | undefined) ?? [];
  const status = String(q.status ?? 'DRAFT');

  async function handleDelete() {
    if (!window.confirm(`Delete quotation ${q.quotation_code}? This cannot be undone.`)) return;
    await deleteQuotation(quotationId).unwrap();
    onDeleted?.();
  }

  async function handleSend() {
    if (!window.confirm(`Send quotation ${q.quotation_code} to the customer?`)) return;
    await sendQuotation(quotationId).unwrap();
    refetch();
  }

  function handlePrint() {
    window.open(`/api/v1/quotations/${quotationId}`, '_blank');
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="h6" fontWeight={700}>
            {text(q.quotation_code)}
          </Typography>
          <Chip
            label={status}
            size="small"
            color={statusColor(status)}
            sx={{ fontWeight: 600, fontSize: 11 }}
          />
        </Stack>
        <Stack direction="row" spacing={1}>
          {status === 'CUSTOMER_DRAFT' && (
            <Button
              size="small"
              variant="contained"
              startIcon={sendState.isLoading ? <CircularProgress size={14} /> : <SendIcon />}
              disabled={sendState.isLoading}
              onClick={handleSend}
              sx={{ fontSize: 12 }}
            >
              Send to Customer
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={handlePrint}
            sx={{ fontSize: 12 }}
          >
            View JSON
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={deleteState.isLoading ? <CircularProgress size={14} /> : <DeleteOutlineIcon />}
            disabled={deleteState.isLoading}
            onClick={handleDelete}
            sx={{ fontSize: 12 }}
          >
            Delete
          </Button>
        </Stack>
      </Stack>

      {deleteState.error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>
          {normalizeApiError(deleteState.error).message}
        </Alert>
      )}
      {sendState.error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>
          {normalizeApiError(sendState.error).message}
        </Alert>
      )}

      {/* Generated by */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'text.secondary', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em' }}>
        Generated By
      </Typography>
      <InfoRow label="Name" value={q.created_by_name} />
      <InfoRow label="Nursery" value={q.nursery_name} />
      <InfoRow label="Nursery Phone" value={q.nursery_phone} />
      <InfoRow label="Generated At" value={formatDate(q.created_at)} />
      <InfoRow label="Sent At" value={formatDate(q.sent_at)} />
      <InfoRow label="Customer Responded At" value={formatDate(q.customer_responded_at)} />
      <InfoRow label="Valid Until" value={q.valid_until ? formatDate(q.valid_until) : '15 days after approval (default)'} />
      <InfoRow label="Assigned To" value={q.assigned_manager_name ?? (q.assigned_manager_user_id ? `User #${q.assigned_manager_user_id}` : null)} />
      <Divider sx={{ my: 2 }} />

      {/* Recipient */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'text.secondary', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em' }}>
        Recipient
      </Typography>
      <InfoRow label="Name" value={q.recipient_name} />
      <InfoRow label="Mobile" value={q.recipient_mobile} />
      <Divider sx={{ my: 2 }} />

      {/* Converted to order */}
      {q.status === 'CONVERTED' && q.converted_order_id && (
        <>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'text.secondary', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em' }}>
            Conversion
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.75 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160, flexShrink: 0 }}>Linked Order</Typography>
            <Chip label={text(q.converted_order_code ?? `#${q.converted_order_id}`)} size="small" color="success" sx={{ fontWeight: 700, fontSize: 11 }} />
          </Stack>
          <InfoRow label="Converted On" value={formatDate(q.converted_at)} />
          <Divider sx={{ my: 2 }} />
        </>
      )}

      {/* Notes */}
      {q.notes && (
        <>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'text.secondary', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em' }}>
            Notes
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{text(q.notes)}</Typography>
          <Divider sx={{ my: 2 }} />
        </>
      )}

      {/* Rejection reason */}
      {q.status === 'CUSTOMER_REJECTED' && q.rejection_reason && (
        <>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'error.main', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em' }}>
            Rejection Reason
          </Typography>
          <Typography variant="body2" color="error" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{text(q.rejection_reason)}</Typography>
          <Divider sx={{ my: 2 }} />
        </>
      )}

      {/* Items table */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em' }}>
        Items ({items.length})
      </Typography>
      <Box sx={{ overflowX: 'auto', mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, bgcolor: 'action.hover' } }}>
              <TableCell>Plant</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, i) => (
              <TableRow key={i} hover>
                <TableCell sx={{ fontSize: 13 }}>
                  <Typography variant="body2" fontWeight={600}>{text(item.scientific_name)}</Typography>
                  {item.common_name && (
                    <Typography variant="caption" color="text.secondary">{text(item.common_name)}</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{text(item.description)}</TableCell>
                <TableCell align="right" sx={{ fontSize: 13 }}>{text(item.quantity)}</TableCell>
                <TableCell align="right" sx={{ fontSize: 13 }}>{money(item.unit_price)}</TableCell>
                <TableCell align="right" sx={{ fontSize: 13, fontWeight: 700 }}>{money(item.total_price)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Total */}
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
        <Stack direction="row" spacing={4} alignItems="center">
          <Typography variant="body2" fontWeight={600} color="text.secondary">Grand Total</Typography>
          <Typography variant="h6" fontWeight={800} color="primary.main">
            {money(q.total_amount)}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
