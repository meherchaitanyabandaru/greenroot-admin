import { zodResolver } from '@hookform/resolvers/zod';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  order_status: z.enum(['PENDING', 'CONFIRMED', 'PARTIALLY_FULFILLED', 'COMPLETED', 'CANCELLED']),
});

type OrderStatusFormValues = z.infer<typeof schema>;

export function OrderStatusForm({
  initialStatus,
  loading,
  onSubmit,
}: {
  initialStatus?: unknown;
  loading?: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const { control, handleSubmit } = useForm<OrderStatusFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      order_status: (String(initialStatus ?? 'PENDING') as OrderStatusFormValues['order_status']) || 'PENDING',
    },
  });

  return (
    <Stack component="form" direction={{ xs: 'column', sm: 'row' }} spacing={1.5} onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name="order_status"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            label="Order Status"
            select
            size="small"
            sx={{ minWidth: 220 }}
          >
            {['PENDING', 'CONFIRMED', 'PARTIALLY_FULFILLED', 'COMPLETED', 'CANCELLED'].map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Button disabled={loading} type="submit" variant="contained">
        Update Status
      </Button>
    </Stack>
  );
}
