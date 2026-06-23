import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
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
import { useState } from 'react';
import { Controller, useFieldArray, useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { useCreateOrderMutation, useCreateOrderItemMutation } from '../../api/adminResources';
import { normalizeApiError } from '../../utils/apiError';

// ─── Schemas ─────────────────────────────────────────────────────────────────
const itemSchema = z.object({
  plant_id: z.coerce.number().min(1, 'Plant ID required'),
  size_id: z.coerce.number().optional(),
  quantity: z.coerce.number().min(0.01, 'Qty must be > 0'),
  unit_price: z.coerce.number().min(0, 'Price required'),
  remarks: z.string().optional(),
});

const orderSchema = z.object({
  buyer_user_id: z.coerce.number().optional(),
  seller_nursery_id: z.coerce.number().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one item'),
});

type OrderFormValues = z.infer<typeof orderSchema>;
type ItemFormValues = z.infer<typeof itemSchema>;

function money(qty: number, price: number) {
  return `₹${(qty * price).toFixed(2)}`;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function OrderCreateDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (orderId: number) => void;
}) {
  const [createOrder, orderState] = useCreateOrderMutation();
  const [createOrderItem] = useCreateOrderItemMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, reset, watch } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema) as Resolver<OrderFormValues>,
    defaultValues: {
      buyer_user_id: undefined,
      seller_nursery_id: undefined,
      notes: '',
      items: [{ plant_id: 0, size_id: undefined, quantity: 1, unit_price: 0, remarks: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems: ItemFormValues[] = watch('items');

  const grandTotal = watchedItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0
  );

  async function onSubmit(values: OrderFormValues) {
    setSubmitError(null);
    try {
      // 1. Create the order (header only)
      const orderBody: Record<string, unknown> = {};
      if (values.buyer_user_id) orderBody.buyer_user_id = values.buyer_user_id;
      if (values.seller_nursery_id) orderBody.seller_nursery_id = values.seller_nursery_id;
      if (values.notes) orderBody.notes = values.notes;

      const result = await createOrder(orderBody).unwrap();
      const orderId = Number((result as Record<string, Record<string, unknown>>).order?.id ?? 0);

      if (!orderId) throw new Error('Order created but no ID returned');

      // 2. Add each item sequentially
      for (const item of values.items) {
        const itemBody: Record<string, unknown> = {
          plant_id: item.plant_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
        };
        if (item.size_id) itemBody.size_id = item.size_id;
        if (item.remarks) itemBody.remarks = item.remarks;
        await createOrderItem({ orderId, body: itemBody }).unwrap();
      }

      reset();
      onCreated?.(orderId);
      onClose();
    } catch (err) {
      setSubmitError(normalizeApiError(err).message);
    }
  }

  function handleClose() {
    reset();
    setSubmitError(null);
    onClose();
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 620 }, p: 3 } }}
    >
      <Stack spacing={2.5} component="form" onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Create New Order</Typography>
          <Button onClick={handleClose} size="small" color="inherit">
            Close
          </Button>
        </Stack>

        <Divider />

        {submitError && <Alert severity="error">{submitError}</Alert>}

        {/* Buyer & Nursery */}
        <Stack spacing={1.5}>
          <Typography variant="subtitle2" color="text.secondary">
            Order Details
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Controller
              control={control}
              name="buyer_user_id"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  error={!!fieldState.error}
                  fullWidth
                  helperText={fieldState.error?.message ?? 'Buyer user ID (optional)'}
                  label="Buyer User ID"
                  size="small"
                  type="number"
                />
              )}
            />
            <Controller
              control={control}
              name="seller_nursery_id"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  error={!!fieldState.error}
                  fullWidth
                  helperText={fieldState.error?.message ?? 'Seller nursery ID (optional)'}
                  label="Seller Nursery ID"
                  size="small"
                  type="number"
                />
              )}
            />
          </Stack>
          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Notes"
                multiline
                rows={2}
                size="small"
                placeholder="Handle with care, delivery instructions, etc."
              />
            )}
          />
        </Stack>

        <Divider />

        {/* Items */}
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">
              Order Items
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={() =>
                append({ plant_id: 0, size_id: undefined, quantity: 1, unit_price: 0, remarks: '' })
              }
              size="small"
              variant="outlined"
            >
              Add Item
            </Button>
          </Stack>

          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Plant ID', 'Size ID', 'Qty', 'Unit ₹', 'Total', 'Remarks', ''].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, py: 1 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell sx={{ py: 0.5 }}>
                      <Controller
                        control={control}
                        name={`items.${index}.plant_id`}
                        render={({ field: f, fieldState }) => (
                          <TextField
                            {...f}
                            error={!!fieldState.error}
                            size="small"
                            type="number"
                            sx={{ width: 80 }}
                            inputProps={{ min: 1 }}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 0.5 }}>
                      <Controller
                        control={control}
                        name={`items.${index}.size_id`}
                        render={({ field: f }) => (
                          <TextField
                            {...f}
                            value={f.value ?? ''}
                            size="small"
                            type="number"
                            sx={{ width: 70 }}
                            placeholder="—"
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 0.5 }}>
                      <Controller
                        control={control}
                        name={`items.${index}.quantity`}
                        render={({ field: f, fieldState }) => (
                          <TextField
                            {...f}
                            error={!!fieldState.error}
                            size="small"
                            type="number"
                            sx={{ width: 70 }}
                            inputProps={{ min: 0.01, step: 0.01 }}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 0.5 }}>
                      <Controller
                        control={control}
                        name={`items.${index}.unit_price`}
                        render={({ field: f, fieldState }) => (
                          <TextField
                            {...f}
                            error={!!fieldState.error}
                            size="small"
                            type="number"
                            sx={{ width: 90 }}
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 0.5 }}>
                      <Typography variant="body2" sx={{ minWidth: 70 }}>
                        {money(
                          Number(watchedItems[index]?.quantity) || 0,
                          Number(watchedItems[index]?.unit_price) || 0
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5 }}>
                      <Controller
                        control={control}
                        name={`items.${index}.remarks`}
                        render={({ field: f }) => (
                          <TextField {...f} size="small" sx={{ width: 120 }} placeholder="—" />
                        )}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 0.5 }}>
                      <Tooltip title="Remove item">
                        <span>
                          <IconButton
                            color="error"
                            disabled={fields.length === 1}
                            onClick={() => remove(index)}
                            size="small"
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="subtitle1">
              Grand Total:{' '}
              <strong>₹{grandTotal.toFixed(2)}</strong>
            </Typography>
          </Box>
        </Stack>

        <Divider />

        {/* Submit */}
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button onClick={handleClose} variant="text">
            Cancel
          </Button>
          <Button
            disabled={orderState.isLoading}
            startIcon={orderState.isLoading ? <CircularProgress size={16} /> : null}
            type="submit"
            variant="contained"
          >
            {orderState.isLoading ? 'Creating…' : 'Create Order'}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
