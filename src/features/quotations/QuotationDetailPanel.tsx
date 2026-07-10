import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useGetQuotationQuery, useLazyGetQuotationCurrentDocumentQuery } from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';

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

export function QuotationDetailPanel({ quotationId }: { quotationId: number }) {
  const { data, isLoading, error, refetch } = useGetQuotationQuery(quotationId);
  const [fetchCurrentDoc, { isFetching: isPdfFetching }] = useLazyGetQuotationCurrentDocumentQuery();
  const [copied, setCopied] = useState(false);
  const [pdfSnack, setPdfSnack] = useState<{ open: boolean; severity: 'success' | 'error' | 'info'; msg: string }>({
    open: false, severity: 'info', msg: '',
  });

  if (isLoading) return <LoadingState label="Loading quotation…" />;
  if (error) {
    const msg = (error as { data?: { error?: string } })?.data?.error ?? 'Failed to load quotation';
    return <ErrorState message={msg} onRetry={refetch} />;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q: Record<string, any> = data?.quotation ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: Record<string, any>[] = (q.items as Record<string, any>[] | undefined) ?? [];
  const status = String(q.status ?? 'DRAFT');

  function handleCopyId() {
    const code = String(q.quotation_code ?? '');
    navigator.clipboard.writeText(code).then(() => { setCopied(true); });
  }

  async function handleDownloadPdf() {
    try {
      const result = await fetchCurrentDoc(quotationId).unwrap();
      const url = result.download_url;
      if (!url) throw new Error('No download URL');
      // Open presigned URL in new tab — browser will trigger the PDF download
      window.open(url, '_blank', 'noopener,noreferrer');
      setPdfSnack({ open: true, severity: 'success', msg: 'PDF opened for download.' });
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 404) {
        setPdfSnack({
          open: true,
          severity: 'info',
          msg: 'No PDF stored yet for this quotation. Share it from the mobile app to generate one.',
        });
      } else {
        setPdfSnack({ open: true, severity: 'error', msg: 'Failed to fetch PDF. Please try again.' });
      }
    }
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
          <Button
            size="small"
            variant="outlined"
            startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
            onClick={handleCopyId}
            sx={{ fontSize: 12 }}
          >
            Copy ID
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={isPdfFetching ? <CircularProgress size={14} color="inherit" /> : <PictureAsPdfIcon sx={{ fontSize: 16 }} />}
            endIcon={!isPdfFetching && <DownloadIcon sx={{ fontSize: 14 }} />}
            onClick={handleDownloadPdf}
            disabled={isPdfFetching}
            sx={{ fontSize: 12 }}
          >
            {isPdfFetching ? 'Fetching…' : 'Download PDF'}
          </Button>
        </Stack>
      </Stack>

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

      {/* Copy ID snackbar */}
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message={`Copied: ${q.quotation_code}`}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* PDF download feedback snackbar */}
      <Snackbar
        open={pdfSnack.open}
        autoHideDuration={5000}
        onClose={() => setPdfSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setPdfSnack((s) => ({ ...s, open: false }))}
          severity={pdfSnack.severity}
          variant="filled"
          sx={{ width: '100%', fontSize: 13 }}
        >
          {pdfSnack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
