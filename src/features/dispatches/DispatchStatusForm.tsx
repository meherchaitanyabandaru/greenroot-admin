import { zodResolver } from '@hookform/resolvers/zod';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  dispatch_status: z.enum(['PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']),
  delivery_date: z.string().optional(),
  notes: z.string().optional(),
});

type DispatchStatusFormValues = z.infer<typeof schema>;

export function DispatchStatusForm({
  initial,
  loading,
  onSubmit,
}: {
  initial?: Record<string, unknown>;
  loading?: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const { control, handleSubmit } = useForm<DispatchStatusFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      dispatch_status: (String(initial?.dispatch_status ?? 'PENDING') as DispatchStatusFormValues['dispatch_status']) || 'PENDING',
      delivery_date: String(initial?.delivery_date ?? '').slice(0, 16),
      notes: String(initial?.notes ?? ''),
    },
  });

  function submit(values: DispatchStatusFormValues) {
    onSubmit({
      dispatch_status: values.dispatch_status,
      delivery_date: values.delivery_date || null,
      notes: values.notes || null,
    });
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(submit)} spacing={2}>
      <Controller
        control={control}
        name="dispatch_status"
        render={({ field, fieldState }) => (
          <TextField {...field} error={!!fieldState.error} fullWidth helperText={fieldState.error?.message} label="Status" select>
            {['PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        control={control}
        name="delivery_date"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            error={!!fieldState.error}
            fullWidth
            helperText={fieldState.error?.message}
            InputLabelProps={{ shrink: true }}
            label="Delivery date"
            type="datetime-local"
          />
        )}
      />
      <Controller
        control={control}
        name="notes"
        render={({ field, fieldState }) => (
          <TextField {...field} error={!!fieldState.error} fullWidth helperText={fieldState.error?.message} label="Notes" />
        )}
      />
      <Button disabled={loading} type="submit" variant="contained">
        Update status
      </Button>
    </Stack>
  );
}
