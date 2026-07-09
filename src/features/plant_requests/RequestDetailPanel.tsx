import { zodResolver } from '@hookform/resolvers/zod';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LockIcon from '@mui/icons-material/Lock';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
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
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import {
  useCancelRequestMutation,
  useCreateRequestResponseMutation,
  useGetRequestQuery,
  useListRequestResponsesQuery,
  useListResourceQuery,
  useUpdateRequestResponseMutation,
  useUpdateRequestStatusMutation,
} from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { StatusChip } from '../../components/status/StatusChip';
import { normalizeApiError } from '../../utils/apiError';

function text(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string' && (value.endsWith('Z') || value.includes('T'))) {
    try {
      return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return String(value);
    }
  }
  return String(value);
}

// ─── Response status colour mapping ──────────────────────────────────────────
function responseRowSx(status: string) {
  if (status === 'ACCEPTED') return { bgcolor: 'success.light' };
  if (status === 'REJECTED') return { bgcolor: 'action.hover', opacity: 0.6 };
  if (status === 'NOT_AVAILABLE') return { bgcolor: 'action.hover', opacity: 0.5 };
  return {};
}

function responseStatusLabel(status: string) {
  switch (status) {
    case 'AVAILABLE': return { label: 'Available', color: 'success' as const };
    case 'PARTIAL': return { label: 'Partial', color: 'warning' as const };
    case 'NOT_AVAILABLE': return { label: 'Not Available', color: 'error' as const };
    case 'ACCEPTED': return { label: 'Accepted', color: 'success' as const };
    case 'REJECTED': return { label: 'Rejected', color: 'default' as const };
    default: return { label: status, color: 'default' as const };
  }
}

// ─── Manager Accept / Reject per response row ─────────────────────────────────
function ResponseActions({
  responseId,
  currentStatus,
  requestIsActive,
  onDone,
}: {
  responseId: number;
  currentStatus: string;
  requestIsActive: boolean;
  onDone: () => void;
}) {
  const [updateResponse, state] = useUpdateRequestResponseMutation();
  const { label, color } = responseStatusLabel(currentStatus);

  async function handle(status: 'ACCEPTED' | 'REJECTED') {
    try {
      await updateResponse({ responseId, body: { status } }).unwrap();
      onDone();
    } catch {
      // surfaced at table level
    }
  }

  if (currentStatus === 'ACCEPTED' || currentStatus === 'REJECTED') {
    return <Chip label={label} color={color} size="small" />;
  }

  if (!requestIsActive) {
    return <Chip label={label} color={color} size="small" />;
  }

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Chip label={label} color={color} size="small" sx={{ mr: 0.5 }} />
      <Tooltip title="Select this supplier">
        <span>
          <Button
            color="success"
            disabled={state.isLoading || currentStatus === 'NOT_AVAILABLE'}
            onClick={() => handle('ACCEPTED')}
            size="small"
            variant="outlined"
          >
            {state.isLoading ? <CircularProgress size={14} /> : 'Select'}
          </Button>
        </span>
      </Tooltip>
      <Tooltip title="Reject this supplier">
        <span>
          <Button
            color="error"
            disabled={state.isLoading}
            onClick={() => handle('REJECTED')}
            size="small"
            variant="outlined"
          >
            Reject
          </Button>
        </span>
      </Tooltip>
    </Stack>
  );
}

// ─── Supplier availability response form ──────────────────────────────────────
const responseSchema = z.object({
  supplier_nursery_id: z.coerce.number().min(1, 'Select a supplier nursery'),
  available_quantity: z.coerce.number().min(1, 'Must be ≥ 1'),
  status: z.enum(['AVAILABLE', 'PARTIAL', 'NOT_AVAILABLE']),
  remarks: z.string().optional(),
});

type ResponseFormValues = z.infer<typeof responseSchema>;

function ResponseForm({ requestId, onDone }: { requestId: number; onDone: () => void }) {
  const [createResponse, state] = useCreateRequestResponseMutation();
  const nurseriesQuery = useListResourceQuery({ resource: 'nurseries', params: { page: 1, per_page: 100 } });
  const nurseries = nurseriesQuery.data?.rows ?? [];

  const { control, handleSubmit, reset } = useForm<ResponseFormValues>({
    resolver: zodResolver(responseSchema) as Resolver<ResponseFormValues>,
    defaultValues: { supplier_nursery_id: 0, available_quantity: 1, status: 'AVAILABLE', remarks: '' },
  });

  async function onSubmit(values: ResponseFormValues) {
    await createResponse({ id: requestId, body: values }).unwrap();
    reset();
    onDone();
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={1.5}>
      {state.isError && (
        <Alert severity="error">{normalizeApiError(state.error).message}</Alert>
      )}

      <Controller
        control={control}
        name="supplier_nursery_id"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            select
            label="Supplier Nursery"
            size="small"
            fullWidth
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          >
            <MenuItem value={0} disabled>Select nursery…</MenuItem>
            {nurseries.map((n) => (
              <MenuItem key={String(n.id)} value={Number(n.id)}>
                {String(n.nursery_name ?? n.name ?? n.id)}
              </MenuItem>
            ))}
          </TextField>
        )}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Controller
          control={control}
          name="available_quantity"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Available Qty"
              size="small"
              fullWidth
              type="number"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <TextField {...field} select label="Availability" size="small" fullWidth>
              <MenuItem value="AVAILABLE">Available — full qty in stock</MenuItem>
              <MenuItem value="PARTIAL">Partial — can supply some qty</MenuItem>
              <MenuItem value="NOT_AVAILABLE">Not Available</MenuItem>
            </TextField>
          )}
        />
      </Stack>

      <Controller
        control={control}
        name="remarks"
        render={({ field }) => (
          <TextField {...field} label="Remarks" size="small" fullWidth multiline rows={2} />
        )}
      />

      <Button disabled={state.isLoading} size="small" type="submit" variant="contained">
        {state.isLoading ? <CircularProgress size={16} /> : 'Submit Response'}
      </Button>
    </Stack>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────
export function RequestDetailPanel({ requestId }: { requestId: number }) {
  const requestQuery = useGetRequestQuery(requestId);
  const responsesQuery = useListRequestResponsesQuery(requestId);
  const [cancelRequest, cancelState] = useCancelRequestMutation();
  const [updateStatus, updateStatusState] = useUpdateRequestStatusMutation();
  const [showResponseForm, setShowResponseForm] = useState(false);

  if (requestQuery.isLoading) return <LoadingState />;
  if (requestQuery.error)
    return (
      <ErrorState
        message={normalizeApiError(requestQuery.error).message}
        onRetry={requestQuery.refetch}
      />
    );

  const req = requestQuery.data?.request ?? {};
  const responses: Record<string, unknown>[] = Array.isArray(responsesQuery.data?.responses)
    ? (responsesQuery.data!.responses as Record<string, unknown>[])
    : [];

  const status = String(req.status ?? '');
  const isActive = !['CLOSED', 'REJECTED'].includes(status);
  const isCancellable = isActive && status !== 'ACCEPTED';
  const isClosable = status === 'ACCEPTED' || status === 'PARTIALLY_ACCEPTED';

  const requiredQty = Number(req.quantity_required ?? 0);
  const acceptedQty = responses
    .filter((r) => r.status === 'ACCEPTED')
    .reduce((sum, r) => sum + Number(r.available_quantity ?? 0), 0);
  const acceptedPct = requiredQty > 0 ? Math.min(100, Math.round((acceptedQty / requiredQty) * 100)) : 0;

  async function handleCancel() {
    if (!window.confirm('Cancel this plant request? It will be marked REJECTED.')) return;
    await cancelRequest(requestId).unwrap();
    requestQuery.refetch();
  }

  async function handleClose() {
    if (!window.confirm('Close this request? Plants have been collected.')) return;
    await updateStatus({ id: requestId, status: 'CLOSED' }).unwrap();
    requestQuery.refetch();
  }

  const summaryItems: Array<[string, unknown]> = [
    ['Requesting nursery', req.requesting_nursery],
    ['Requested by', req.requested_by_name],
    ['Plant', req.common_name ?? req.scientific_name],
    ['Scientific name', req.scientific_name],
    ['Size', req.size_name ?? req.size_code ?? '—'],
    ['Qty required', req.quantity_required],
    ['Required by', req.required_by_date],
    ['Radius (km)', req.radius_km],
    ['Expires', req.expires_at ?? '—'],
    ['Created', req.created_at],
  ];

  return (
    <Stack spacing={2.5}>
      {(cancelState.isError || updateStatusState.isError) && (
        <Alert severity="error">
          {normalizeApiError(cancelState.error ?? updateStatusState.error).message}
        </Alert>
      )}

      {/* ── Header ── */}
      <Paper sx={{ p: 2 }} variant="outlined">
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography color="text.secondary" variant="body2">Plant Request</Typography>
              <Typography variant="h6">{text(req.request_code)}</Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <StatusChip value={status} />
              {isClosable && (
                <Tooltip title="Mark request closed — plants have been collected">
                  <Button
                    color="success"
                    disabled={updateStatusState.isLoading}
                    onClick={handleClose}
                    size="small"
                    startIcon={<CheckCircleOutlineIcon />}
                    variant="contained"
                  >
                    {updateStatusState.isLoading ? <CircularProgress size={14} /> : 'Close Request'}
                  </Button>
                </Tooltip>
              )}
              {status === 'CLOSED' && (
                <Chip icon={<LockIcon sx={{ fontSize: 14 }} />} label="Closed" color="default" size="small" />
              )}
              {isCancellable && (
                <Button
                  color="error"
                  disabled={cancelState.isLoading}
                  onClick={handleCancel}
                  size="small"
                  variant="outlined"
                >
                  {cancelState.isLoading ? <CircularProgress size={14} /> : 'Cancel'}
                </Button>
              )}
            </Stack>
          </Stack>

          {req.notes ? (
            <Alert severity="info" sx={{ py: 0.5 }}>{text(req.notes)}</Alert>
          ) : null}

          <Grid container spacing={1.5}>
            {summaryItems.map(([label, value]) => (
              <Grid key={String(label)} size={{ xs: 12, sm: 6 }}>
                <Typography color="text.secondary" variant="caption">{label}</Typography>
                <Typography variant="body2" fontWeight={label === 'Qty required' || label === 'Required by' ? 600 : 400}>
                  {text(value)}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Paper>

      {/* ── What suppliers see ── */}
      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
        <Typography variant="subtitle2" gutterBottom color="text.secondary">
          What supplier nurseries see
        </Typography>
        <Stack spacing={0.5}>
          <Typography variant="body2">
            <strong>Need:</strong> {text(req.common_name ?? req.scientific_name)} — {text(req.quantity_required)}
          </Typography>
          {Boolean(req.required_by_date) && (
            <Typography variant="body2">
              <strong>Required by:</strong> {text(req.required_by_date)}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Customer name, phone, address, and pricing are hidden from suppliers.
          </Typography>
        </Stack>
      </Paper>

      {/* ── Fulfilment tally ── */}
      {responses.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">Fulfilment Progress</Typography>
              <Typography variant="body2" fontWeight={600} color={acceptedQty >= requiredQty ? 'success.main' : 'text.primary'}>
                {acceptedQty} / {requiredQty} accepted
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={acceptedPct}
              color={acceptedQty >= requiredQty ? 'success' : 'warning'}
              sx={{ height: 8, borderRadius: 1 }}
            />
            {acceptedQty >= requiredQty && (
              <Typography variant="caption" color="success.main">
                Full quantity covered — you can now close the request after collecting plants.
              </Typography>
            )}
            {acceptedQty > 0 && acceptedQty < requiredQty && (
              <Typography variant="caption" color="warning.main">
                Partially covered — accept more supplier responses or adjust the required quantity.
              </Typography>
            )}
          </Stack>
        </Paper>
      )}

      {/* ── Supplier responses ── */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1">Supplier Responses</Typography>
            {responses.length > 0 && (
              <Chip label={`${responses.length}`} size="small" />
            )}
          </Stack>
          {isActive && (
            <Button onClick={() => setShowResponseForm((v) => !v)} size="small" variant="outlined">
              {showResponseForm ? 'Hide' : '+ Add Response'}
            </Button>
          )}
        </Stack>

        {showResponseForm && (
          <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
            <Typography gutterBottom variant="subtitle2">Submit Supplier Availability</Typography>
            <ResponseForm
              requestId={requestId}
              onDone={() => {
                setShowResponseForm(false);
                responsesQuery.refetch();
                requestQuery.refetch();
              }}
            />
          </Paper>
        )}

        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Supplier Nursery', 'Qty Available', 'Availability', 'Remarks', 'Manager Action'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {responsesQuery.isFetching ? (
                <TableRow>
                  <TableCell colSpan={5}><LoadingState /></TableCell>
                </TableRow>
              ) : responses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary" variant="body2" sx={{ py: 1 }}>
                      No responses yet. Supplier nurseries will submit their availability here.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                responses.map((r, i) => (
                  <TableRow key={i} sx={responseRowSx(String(r.status ?? ''))}>
                    <TableCell sx={{ fontWeight: 500 }}>{text(r.supplier_nursery)}</TableCell>
                    <TableCell>{text(r.available_quantity)}</TableCell>
                    <TableCell>
                      {(() => {
                        const { label, color } = responseStatusLabel(String(r.status ?? ''));
                        const isManagerStatus = r.status === 'ACCEPTED' || r.status === 'REJECTED';
                        if (isManagerStatus) return null;
                        return <Chip label={label} color={color} size="small" />;
                      })()}
                    </TableCell>
                    <TableCell>{text(r.remarks)}</TableCell>
                    <TableCell>
                      <ResponseActions
                        responseId={Number(r.id)}
                        currentStatus={String(r.status ?? '')}
                        requestIsActive={isActive}
                        onDone={() => {
                          responsesQuery.refetch();
                          requestQuery.refetch();
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      <Divider />
      <Typography color="text.secondary" variant="caption">
        Workflow: suppliers submit availability → manager selects suppliers → quantity tally auto-advances request
        status → manager closes request once plants are collected.
      </Typography>
    </Stack>
  );
}
