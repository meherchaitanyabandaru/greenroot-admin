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
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateQuotationMutation } from '../../api/adminResources';
import { normalizeApiError } from '../../utils/apiError';

const itemSchema = z.object({
  plant_id: z.coerce.number().min(1, 'Plant ID required'),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0.01, 'Qty must be > 0'),
  unit_price: z.coerce.number().min(0, 'Price required'),
});

const quotationSchema = z.object({
  nursery_id: z.coerce.number().optional(),
  recipient_name: z.string().optional(),
  recipient_mobile: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one item'),
});

type QuotationFormValues = z.infer<typeof quotationSchema>;
type ItemFormValues = z.infer<typeof itemSchema>;

function lineTotal(item: ItemFormValues) {
  return (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
}

export function QuotationCreateDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [createQuotation, createState] = useCreateQuotationMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, reset, watch } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema) as Resolver<QuotationFormValues>,
    defaultValues: {
      nursery_id: undefined,
      recipient_name: '',
      recipient_mobile: '',
      notes: '',
      items: [{ plant_id: 0, description: '', quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems: ItemFormValues[] = watch('items');
  const grandTotal = watchedItems.reduce((sum, item) => sum + lineTotal(item), 0);

  async function onSubmit(values: QuotationFormValues) {
    setSubmitError(null);
    try {
      const body: Record<string, unknown> = {
        items: values.items.map((item) => ({
          plant_id: item.plant_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: lineTotal(item),
          ...(item.description ? { description: item.description } : {}),
        })),
      };
      if (values.nursery_id) body.nursery_id = values.nursery_id;
      if (values.recipient_name) body.recipient_name = values.recipient_name;
      if (values.recipient_mobile) body.recipient_mobile = values.recipient_mobile;
      if (values.notes) body.notes = values.notes;

      await createQuotation(body).unwrap();
      reset();
      onCreated?.();
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
    <Drawer anchor="right" open={open} onClose={handleClose} PaperProps={{ sx: { width: { xs: '100%', sm: 540 }, p: 3 } }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        New Quotation
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{submitError}</Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%' }}>
        {/* Nursery */}
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em', mb: -1 }}>
          Nursery (optional)
        </Typography>
        <Controller
          name="nursery_id"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Nursery ID"
              type="number"
              size="small"
              error={!!fieldState.error}
              helperText={fieldState.error?.message ?? 'Leave blank to use your own nursery'}
              inputProps={{ min: 1 }}
            />
          )}
        />

        <Divider />

        {/* Recipient */}
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em', mb: -1 }}>
          Recipient (optional)
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Controller
            name="recipient_name"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Name" size="small" fullWidth />
            )}
          />
          <Controller
            name="recipient_mobile"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Mobile" size="small" fullWidth />
            )}
          />
        </Stack>

        <Divider />

        {/* Items */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em' }}>
            Plant Items
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => append({ plant_id: 0, description: '', quantity: 1, unit_price: 0 })}
          >
            Add Item
          </Button>
        </Stack>

        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, bgcolor: 'action.hover' } }}>
                <TableCell>Plant ID</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right" sx={{ minWidth: 70 }}>Qty</TableCell>
                <TableCell align="right" sx={{ minWidth: 90 }}>Unit ₹</TableCell>
                <TableCell align="right" sx={{ minWidth: 80 }}>Total</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.map((field, i) => (
                <TableRow key={field.id}>
                  <TableCell sx={{ minWidth: 80 }}>
                    <Controller
                      name={`items.${i}.plant_id`}
                      control={control}
                      render={({ field: f, fieldState }) => (
                        <TextField
                          {...f}
                          type="number"
                          size="small"
                          error={!!fieldState.error}
                          inputProps={{ min: 1 }}
                          sx={{ width: 80 }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`items.${i}.description`}
                      control={control}
                      render={({ field: f }) => (
                        <TextField {...f} size="small" placeholder="Optional" sx={{ width: 130 }} />
                      )}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Controller
                      name={`items.${i}.quantity`}
                      control={control}
                      render={({ field: f, fieldState }) => (
                        <TextField
                          {...f}
                          type="number"
                          size="small"
                          error={!!fieldState.error}
                          inputProps={{ min: 0.01, step: 0.01 }}
                          sx={{ width: 70 }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Controller
                      name={`items.${i}.unit_price`}
                      control={control}
                      render={({ field: f, fieldState }) => (
                        <TextField
                          {...f}
                          type="number"
                          size="small"
                          error={!!fieldState.error}
                          inputProps={{ min: 0, step: 0.01 }}
                          sx={{ width: 90 }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: 13, fontWeight: 700 }}>
                    ₹{lineTotal(watchedItems[i] ?? { quantity: 0, unit_price: 0 }).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Remove">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={fields.length === 1}
                          onClick={() => remove(i)}
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
        </Box>

        <Stack direction="row" justifyContent="flex-end" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary" fontWeight={600}>Grand Total</Typography>
          <Typography variant="h6" fontWeight={800} color="primary.main">
            ₹{grandTotal.toFixed(2)}
          </Typography>
        </Stack>

        <Divider />

        {/* Notes */}
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Notes (optional)" multiline rows={3} size="small" />
          )}
        />

        {/* Actions */}
        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 'auto', pt: 1 }}>
          <Button variant="outlined" onClick={handleClose} disabled={createState.isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createState.isLoading}
            startIcon={createState.isLoading ? <CircularProgress size={16} /> : undefined}
          >
            Create Quotation
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
