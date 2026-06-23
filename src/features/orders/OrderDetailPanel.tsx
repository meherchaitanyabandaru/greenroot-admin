import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
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
import { StatusTimeline } from '../../components/timeline/StatusTimeline';
import { formatCurrency, formatDate } from '../../utils/labels';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import {
  useGetOrderQuery,
  useListOrderDispatchesQuery,
  useListOrderItemsQuery,
  useListOrderPaymentsQuery,
  useUpdateOrderStatusMutation,
  useUpdateOrderItemMutation,
  useDeleteOrderItemMutation,
  useDeleteOrderMutation,
} from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { StatusChip } from '../../components/status/StatusChip';
import { normalizeApiError } from '../../utils/apiError';
import { OrderStatusForm } from './OrderStatusForm';

function text(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return String(value);
}

function money(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? `₹${amount.toFixed(2)}` : '-';
}

// ─── Inline editable item row ─────────────────────────────────────────────────
function ItemRow({
  row,
  onUpdated,
  onDeleted,
}: {
  row: Record<string, unknown>;
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(String(row.quantity ?? ''));
  const [price, setPrice] = useState(String(row.unit_price ?? ''));
  const [updateItem, updateState] = useUpdateOrderItemMutation();
  const [deleteItem, deleteState] = useDeleteOrderItemMutation();

  async function handleSave() {
    const q = Number(qty);
    const p = Number(price);
    if (!q || !p) return;
    await updateItem({
      itemId: Number(row.id),
      body: { plant_id: row.plant_id, size_id: row.size_id, quantity: q, unit_price: p, total_price: q * p },
    }).unwrap();
    setEditing(false);
    onUpdated();
  }

  async function handleDelete() {
    if (!window.confirm('Remove this item from the order?')) return;
    await deleteItem(Number(row.id)).unwrap();
    onDeleted();
  }

  const total = Number(qty || 0) * Number(price || 0);

  if (editing) {
    return (
      <TableRow>
        <TableCell>{text(row.common_name ?? row.scientific_name)}</TableCell>
        <TableCell>{text(row.size_name ?? row.size_code)}</TableCell>
        <TableCell>
          <TextField
            size="small"
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            sx={{ width: 80 }}
            inputProps={{ min: 0.01, step: 0.01 }}
          />
        </TableCell>
        <TableCell>
          <TextField
            size="small"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            sx={{ width: 90 }}
            inputProps={{ min: 0, step: 0.01 }}
          />
        </TableCell>
        <TableCell>{`₹${total.toFixed(2)}`}</TableCell>
        <TableCell>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Save">
              <span>
                <IconButton
                  color="success"
                  disabled={updateState.isLoading}
                  onClick={handleSave}
                  size="small"
                >
                  {updateState.isLoading ? (
                    <CircularProgress size={14} />
                  ) : (
                    <CheckIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Cancel">
              <IconButton onClick={() => setEditing(false)} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>{text(row.common_name ?? row.scientific_name)}</TableCell>
      <TableCell>{text(row.size_name ?? row.size_code)}</TableCell>
      <TableCell>{text(row.quantity)}</TableCell>
      <TableCell>{money(row.unit_price)}</TableCell>
      <TableCell>{money(row.total_price)}</TableCell>
      <TableCell>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit qty / price">
            <IconButton onClick={() => setEditing(true)} size="small">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove item">
            <span>
              <IconButton
                color="error"
                disabled={deleteState.isLoading}
                onClick={handleDelete}
                size="small"
              >
                {deleteState.isLoading ? (
                  <CircularProgress size={14} />
                ) : (
                  <DeleteOutlineIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

// ─── Read-only section table (payments, dispatches) ───────────────────────────
function SectionTable({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: Record<string, unknown>[];
  columns: Array<{ key: string; label: string; format?: (value: unknown) => string | unknown }>;
}) {
  const isStatusKey = (key: string) => key.includes('status');

  return (
    <Box>
      <Typography
        fontSize={11}
        fontWeight={700}
        textTransform="uppercase"
        letterSpacing="0.06em"
        color="text.secondary"
        mb={1}
      >
        {title}
      </Typography>
      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key}>{column.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ border: 0 }}>
                  <Typography color="text.secondary" fontSize={13} py={1}>
                    No records found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={`${title}-${text(row.id)}-${index}`}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {isStatusKey(column.key) ? (
                        <StatusChip value={row[column.key]} />
                      ) : column.format ? (
                        column.format(row[column.key]) as string
                      ) : (
                        text(row[column.key])
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export function OrderDetailPanel({
  orderId,
  onDeleted,
}: {
  orderId: number;
  onDeleted?: () => void;
}) {
  const orderQuery = useGetOrderQuery(orderId);
  const itemsQuery = useListOrderItemsQuery(orderId);
  const paymentsQuery = useListOrderPaymentsQuery(orderId);
  const dispatchesQuery = useListOrderDispatchesQuery(orderId);
  const [updateStatus, updateStatusState] = useUpdateOrderStatusMutation();
  const [deleteOrder, deleteState] = useDeleteOrderMutation();

  if (orderQuery.isLoading) return <LoadingState />;
  if (orderQuery.error)
    return (
      <ErrorState
        message={normalizeApiError(orderQuery.error).message}
        onRetry={orderQuery.refetch}
      />
    );

  const order = orderQuery.data?.order ?? {};
  const items = itemsQuery.data?.items ?? [];

  const summaryItems: Array<[string, string]> = [
    ['Buyer', text(order.buyer_name)],
    ['Nursery', text(order.seller_nursery)],
    ['Total', formatCurrency(order.total_amount)],
    ['Order Date', formatDate(order.order_date)],
    ['Notes', text(order.notes)],
  ];

  const orderSteps = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Partial', value: 'PARTIALLY_FULFILLED' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  async function submitStatus(values: Record<string, unknown>) {
    await updateStatus({ id: orderId, body: values }).unwrap();
  }

  async function handleDelete() {
    if (!window.confirm('Delete this order? This cannot be undone.')) return;
    await deleteOrder(orderId).unwrap();
    onDeleted?.();
  }

  const isDeletable = order.order_status === 'PENDING' || order.order_status === 'CANCELLED';

  return (
    <Stack spacing={2}>
      {updateStatusState.isError && (
        <Alert severity="error">{normalizeApiError(updateStatusState.error).message}</Alert>
      )}
      {deleteState.isError && (
        <Alert severity="error">{normalizeApiError(deleteState.error).message}</Alert>
      )}

      {/* ── Order header ── */}
      <Paper sx={{ p: 2.5, borderRadius: 2 }} variant="outlined">
        <Stack spacing={2.5}>
          {/* Title row */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography fontSize={11} fontWeight={700} textTransform="uppercase" letterSpacing="0.06em" color="text.secondary" mb={0.25}>
                Order
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {text(order.order_number)}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <StatusChip value={order.order_status} />
              {isDeletable && (
                <Tooltip title="Delete order (only PENDING or CANCELLED)">
                  <span>
                    <Button
                      color="error"
                      disabled={deleteState.isLoading}
                      onClick={handleDelete}
                      size="small"
                      variant="outlined"
                    >
                      {deleteState.isLoading ? <CircularProgress size={14} /> : 'Delete'}
                    </Button>
                  </span>
                </Tooltip>
              )}
            </Stack>
          </Stack>

          {/* Timeline */}
          <Box sx={{ px: 0.5 }}>
            <StatusTimeline
              steps={orderSteps}
              currentStatus={String(order.order_status ?? 'PENDING')}
              cancelledStatus="CANCELLED"
            />
          </Box>

          <Divider />

          {/* Details grid */}
          <Grid container spacing={1.5}>
            {summaryItems.map(([label, value]) => (
              <Grid key={String(label)} size={{ xs: 12, sm: 6 }}>
                <Typography fontSize={11} fontWeight={600} textTransform="uppercase" letterSpacing="0.05em" color="text.secondary">
                  {label}
                </Typography>
                <Typography fontSize={13.5} mt={0.25}>{value}</Typography>
              </Grid>
            ))}
          </Grid>

          <Divider />
          <OrderStatusForm
            initialStatus={order.order_status}
            loading={updateStatusState.isLoading}
            onSubmit={submitStatus}
          />
        </Stack>
      </Paper>

      {/* ── Items (inline editable) ── */}
      <Box>
        <Typography sx={{ mb: 1 }} variant="subtitle1">
          Order Items
        </Typography>
        {itemsQuery.isFetching ? (
          <LoadingState />
        ) : (
          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Plant', 'Size', 'Qty', 'Unit ₹', 'Total ₹', 'Actions'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="text.secondary" variant="body2">
                        No items on this order.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row, i) => (
                    <ItemRow
                      key={i}
                      row={row}
                      onUpdated={() => itemsQuery.refetch()}
                      onDeleted={() => itemsQuery.refetch()}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>

      {/* ── Payments ── */}
      <SectionTable
        title="Payments"
        rows={paymentsQuery.data?.payments ?? []}
        columns={[
          { key: 'payment_code', label: 'Reference' },
          { key: 'payment_method', label: 'Method' },
          { key: 'amount', label: 'Amount', format: formatCurrency },
          {
            key: 'payment_status',
            label: 'Status',
            format: (v) => v as unknown as string,
          },
          { key: 'transaction_reference', label: 'Transaction ID' },
        ]}
      />

      {/* ── Dispatches ── */}
      <SectionTable
        title="Dispatches"
        rows={dispatchesQuery.data?.dispatches ?? []}
        columns={[
          { key: 'dispatch_number', label: 'Dispatch No.' },
          { key: 'vehicle_number', label: 'Vehicle' },
          { key: 'driver_name', label: 'Driver' },
          {
            key: 'dispatch_status',
            label: 'Status',
            format: (v) => v as unknown as string,
          },
        ]}
      />
    </Stack>
  );
}
