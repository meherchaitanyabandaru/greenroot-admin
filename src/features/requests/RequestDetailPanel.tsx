import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Chip,
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
  useUpdateRequestResponseMutation,
} from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { StatusChip } from '../../components/status/StatusChip';
import { normalizeApiError } from '../../utils/apiError';

function text(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

// ─── Accept / Reject buttons per response row ───────────────────────────────
function ResponseActions({
  responseId,
  currentStatus,
  onDone,
}: {
  responseId: number;
  currentStatus: string;
  onDone: () => void;
}) {
  const [updateResponse, state] = useUpdateRequestResponseMutation();

  async function handle(status: 'ACCEPTED' | 'REJECTED') {
    if (!window.confirm(`Mark this response as ${status}?`)) return;
    try {
      await updateResponse({ responseId, body: { status } }).unwrap();
      onDone();
    } catch {
      // error surfaced by the table-level alert
    }
  }

  if (currentStatus === 'ACCEPTED' || currentStatus === 'REJECTED') {
    return <StatusChip value={currentStatus} />;
  }

  return (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title="Accept — mark this supplier as able to fulfil the request">
        <span>
          <Button
            color="success"
            disabled={state.isLoading}
            onClick={() => handle('ACCEPTED')}
            size="small"
            variant="outlined"
          >
            {state.isLoading ? <CircularProgress size={14} /> : 'Accept'}
          </Button>
        </span>
      </Tooltip>
      <Tooltip title="Reject this supplier response">
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

// ─── Add Response form (supplier submitting availability) ────────────────────
const responseSchema = z.object({
  supplier_nursery_id: z.coerce.number().min(1, 'Supplier nursery ID is required'),
  available_quantity: z.coerce.number().min(1, 'Must be at least 1'),
  remarks: z.string().optional(),
});

type ResponseFormValues = z.infer<typeof responseSchema>;

function ResponseForm({ requestId, onDone }: { requestId: number; onDone: () => void }) {
  const [createResponse, state] = useCreateRequestResponseMutation();
  const { control, handleSubmit, reset } = useForm<ResponseFormValues>({
    resolver: zodResolver(responseSchema) as Resolver<ResponseFormValues>,
    defaultValues: { supplier_nursery_id: 0, available_quantity: 0, remarks: '' },
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
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Controller
          control={control}
          name="supplier_nursery_id"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              error={!!fieldState.error}
              fullWidth
              helperText={fieldState.error?.message ?? 'Supplier nursery internal ID'}
              label="Supplier Nursery ID"
              size="small"
              type="number"
            />
          )}
        />
        <Controller
          control={control}
          name="available_quantity"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              error={!!fieldState.error}
              fullWidth
              helperText={fieldState.error?.message}
              label="Available Qty"
              size="small"
              type="number"
            />
          )}
        />
      </Stack>
      <Controller
        control={control}
        name="remarks"
        render={({ field }) => (
          <TextField {...field} fullWidth label="Remarks" multiline rows={2} size="small" />
        )}
      />
      <Button disabled={state.isLoading} size="small" type="submit" variant="contained">
        {state.isLoading ? <CircularProgress size={16} /> : 'Submit Response'}
      </Button>
    </Stack>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────
export function RequestDetailPanel({
  requestId,
  onCancelled,
}: {
  requestId: number;
  onCancelled?: () => void;
}) {
  const requestQuery = useGetRequestQuery(requestId);
  const responsesQuery = useListRequestResponsesQuery(requestId);
  const [cancelRequest, cancelState] = useCancelRequestMutation();
  const [showForm, setShowForm] = useState(false);

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

  const isCancellable = req.status !== 'CANCELLED' && req.status !== 'FULFILLED';
  const acceptedCount = responses.filter((r) => r.status === 'ACCEPTED').length;

  async function handleCancel() {
    if (!window.confirm('Cancel this plant request?')) return;
    await cancelRequest(requestId).unwrap();
    onCancelled?.();
  }

  const summaryItems: Array<[string, unknown]> = [
    ['Requesting nursery', req.requesting_nursery],
    ['Requested by', req.requested_by_name],
    ['Plant', req.common_name ?? req.scientific_name],
    ['Scientific name', req.scientific_name],
    ['Size', req.size_name ?? req.size_code ?? '-'],
    ['Qty required', req.quantity_required],
    ['Radius (km)', req.radius_km],
    ['Expires', req.expires_at],
    ['Fulfilled at', req.fulfilled_at ?? '-'],
    ['Created', req.created_at],
  ];

  return (
    <Stack spacing={2}>
      {cancelState.isError && (
        <Alert severity="error">{normalizeApiError(cancelState.error).message}</Alert>
      )}

      {/* ── Header card ── */}
      <Paper sx={{ p: 2 }} variant="outlined">
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography color="text.secondary" variant="body2">
                Plant Request
              </Typography>
              <Typography variant="h6">{text(req.request_code)}</Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <StatusChip value={req.status} />
              {isCancellable && (
                <Button
                  color="error"
                  disabled={cancelState.isLoading}
                  onClick={handleCancel}
                  size="small"
                  variant="outlined"
                >
                  {cancelState.isLoading ? <CircularProgress size={14} /> : 'Cancel Request'}
                </Button>
              )}
            </Stack>
          </Stack>

          {req.notes ? (
            <Alert severity="info" sx={{ py: 0.5 }}>
              {text(req.notes)}
            </Alert>
          ) : null}

          <Grid container spacing={1.5}>
            {summaryItems.map(([label, value]) => (
              <Grid key={String(label)} size={{ xs: 12, sm: 6 }}>
                <Typography color="text.secondary" variant="caption">
                  {label}
                </Typography>
                <Typography variant="body2">{text(value)}</Typography>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Paper>

      {/* ── Responses section ── */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1">Supplier Responses</Typography>
            {responses.length > 0 && (
              <Chip label={`${responses.length} total`} size="small" />
            )}
            {acceptedCount > 0 && (
              <Chip color="success" label={`${acceptedCount} accepted`} size="small" />
            )}
          </Stack>
          {isCancellable && (
            <Button onClick={() => setShowForm((v) => !v)} size="small" variant="outlined">
              {showForm ? 'Hide form' : '+ Add response'}
            </Button>
          )}
        </Stack>

        {showForm && (
          <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
            <Typography gutterBottom variant="subtitle2">
              Submit Supplier Response
            </Typography>
            <ResponseForm
              requestId={requestId}
              onDone={() => {
                setShowForm(false);
                responsesQuery.refetch();
              }}
            />
          </Paper>
        )}

        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  'Supplier Nursery',
                  'Responded By',
                  'Qty Available',
                  'Remarks',
                  'Status / Action',
                ].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {responsesQuery.isFetching ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <LoadingState />
                  </TableCell>
                </TableRow>
              ) : responses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary" variant="body2">
                      No responses yet. Supplier nurseries can submit responses to this open request.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                responses.map((r, i) => (
                  <TableRow
                    key={i}
                    sx={{
                      backgroundColor:
                        r.status === 'ACCEPTED'
                          ? 'success.light'
                          : r.status === 'REJECTED'
                            ? 'action.hover'
                            : undefined,
                      opacity: r.status === 'REJECTED' ? 0.6 : 1,
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{text(r.supplier_nursery)}</TableCell>
                    <TableCell>{text(r.responded_by_name)}</TableCell>
                    <TableCell>{text(r.available_quantity)}</TableCell>
                    <TableCell>{text(r.remarks)}</TableCell>
                    <TableCell>
                      <ResponseActions
                        responseId={Number(r.id)}
                        currentStatus={String(r.status ?? '')}
                        onDone={() => responsesQuery.refetch()}
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
        Accepting a response marks it fulfilled. To complete the order, create a new order from
        the accepted nursery's inventory.
      </Typography>
    </Stack>
  );
}
