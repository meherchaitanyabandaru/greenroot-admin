import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Stack, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  order_id: z.string().min(1, 'Order ID is required'),
  dispatch_number: z.string().optional(),
  vehicle_id: z.string().optional(),
  driver_id: z.string().optional(),
  dispatch_date: z.string().optional(),
  destination_address: z.string().optional(),
  notes: z.string().optional(),
});

type DispatchFormValues = z.infer<typeof schema>;

export function DispatchForm({
  loading,
  onSubmit,
}: {
  loading?: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const { control, handleSubmit } = useForm<DispatchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      order_id: '',
      dispatch_number: '',
      vehicle_id: '',
      driver_id: '',
      dispatch_date: '',
      destination_address: '',
      notes: '',
    },
  });

  function submit(values: DispatchFormValues) {
    onSubmit({
      order_id: Number(values.order_id),
      dispatch_number: values.dispatch_number || null,
      vehicle_id: values.vehicle_id ? Number(values.vehicle_id) : null,
      driver_id: values.driver_id ? Number(values.driver_id) : null,
      dispatch_date: values.dispatch_date || null,
      destination_address: values.destination_address || null,
      notes: values.notes || null,
      items: [],
    });
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(submit)} spacing={2}>
      {[
        ['order_id', 'Order ID', 'number'],
        ['dispatch_number', 'Dispatch number', 'text'],
        ['vehicle_id', 'Vehicle ID', 'number'],
        ['driver_id', 'Driver ID', 'number'],
        ['dispatch_date', 'Dispatch date', 'datetime-local'],
        ['destination_address', 'Destination address', 'text'],
        ['notes', 'Notes', 'text'],
      ].map(([name, label, type]) => (
        <Controller
          control={control}
          key={name}
          name={name as keyof DispatchFormValues}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              error={!!fieldState.error}
              fullWidth
              helperText={fieldState.error?.message}
              InputLabelProps={type === 'datetime-local' ? { shrink: true } : undefined}
              label={label}
              type={type}
            />
          )}
        />
      ))}
      <Button disabled={loading} type="submit" variant="contained">
        Save dispatch
      </Button>
    </Stack>
  );
}
