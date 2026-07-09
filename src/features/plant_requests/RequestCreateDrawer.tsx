import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  CircularProgress,
  Drawer,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { useCreateRequestMutation, useListResourceQuery } from '../../api/adminResources';
import { normalizeApiError } from '../../utils/apiError';

const schema = z.object({
  requesting_nursery_id: z.coerce.number().min(1, 'Nursery is required'),
  plant_id: z.coerce.number().min(1, 'Plant ID is required'),
  size_id: z.coerce.number().optional(),
  quantity_required: z.coerce.number().min(1, 'Quantity must be ≥ 1'),
  radius_km: z.coerce.number().min(1, 'Radius must be ≥ 1').default(50),
  required_by_date: z.string().optional(),
  expires_at: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'OPEN']).default('OPEN'),
});

type FormValues = z.infer<typeof schema>;

export function RequestCreateDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [createRequest, state] = useCreateRequestMutation();

  const nurseriesQuery = useListResourceQuery(
    { resource: 'nurseries', params: { page: 1, per_page: 100 } },
    { skip: !open },
  );
  const nurseries = nurseriesQuery.data?.rows ?? [];

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      requesting_nursery_id: 0,
      plant_id: 0,
      quantity_required: 1,
      radius_km: 50,
      status: 'OPEN',
    },
  });

  async function onSubmit(values: FormValues) {
    const body: Record<string, unknown> = {
      requesting_nursery_id: values.requesting_nursery_id,
      plant_id: values.plant_id,
      quantity_required: values.quantity_required,
      radius_km: values.radius_km,
      status: values.status,
    };
    if (values.size_id) body.size_id = values.size_id;
    if (values.notes) body.notes = values.notes;
    if (values.required_by_date) body.required_by_date = new Date(values.required_by_date).toISOString();
    if (values.expires_at) body.expires_at = new Date(values.expires_at).toISOString();

    await createRequest(body).unwrap();
    reset();
    onCreated?.();
    onClose();
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 3 } }}
    >
      <Typography variant="h6" gutterBottom>
        New Plant Request
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create a sourcing request to broadcast to supplier nurseries. Suppliers will see only the
        plant, quantity, and required date — not customer details.
      </Typography>

      {state.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {normalizeApiError(state.error).message}
        </Alert>
      )}

      <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2}>
        <Controller
          control={control}
          name="requesting_nursery_id"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              select
              label="Requesting Nursery"
              size="small"
              fullWidth
              error={!!fieldState.error}
              helperText={fieldState.error?.message ?? 'Your nursery that needs the plants'}
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

        <Controller
          control={control}
          name="plant_id"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Plant ID"
              size="small"
              fullWidth
              type="number"
              error={!!fieldState.error}
              helperText={fieldState.error?.message ?? 'Internal plant ID from the catalog'}
            />
          )}
        />

        <Stack direction="row" spacing={1.5}>
          <Controller
            control={control}
            name="quantity_required"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Qty Required"
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
            name="size_id"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Size ID"
                size="small"
                fullWidth
                type="number"
                error={!!fieldState.error}
                helperText={fieldState.error?.message ?? 'Optional'}
              />
            )}
          />
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <Controller
            control={control}
            name="required_by_date"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Required By"
                size="small"
                fullWidth
                type="date"
                InputLabelProps={{ shrink: true }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message ?? 'Date you need the plants'}
              />
            )}
          />
          <Controller
            control={control}
            name="radius_km"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Radius (km)"
                size="small"
                fullWidth
                type="number"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Stack>

        <Controller
          control={control}
          name="expires_at"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Request Expires At"
              size="small"
              fullWidth
              type="date"
              InputLabelProps={{ shrink: true }}
              error={!!fieldState.error}
              helperText={fieldState.error?.message ?? 'Optional — stop accepting responses after this date'}
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <TextField
              {...field}
              label="Notes"
              size="small"
              fullWidth
              multiline
              rows={2}
              helperText="Internal notes — not visible to suppliers"
            />
          )}
        />

        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <TextField {...field} select label="Initial Status" size="small" fullWidth>
              <MenuItem value="DRAFT">Draft — save without broadcasting</MenuItem>
              <MenuItem value="OPEN">Open — broadcast to suppliers now</MenuItem>
            </TextField>
          )}
        />

        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 1 }}>
          <Button onClick={onClose} size="small" variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button type="submit" size="small" variant="contained" disabled={state.isLoading}>
            {state.isLoading ? <CircularProgress size={16} /> : 'Create Request'}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
