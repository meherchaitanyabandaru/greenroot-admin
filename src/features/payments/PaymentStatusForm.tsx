import { zodResolver } from '@hookform/resolvers/zod';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  payment_status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED']),
  transaction_reference: z.string().optional(),
  notes: z.string().optional(),
  provider: z.string().optional(),
  provider_payment_id: z.string().optional(),
  provider_order_id: z.string().optional(),
});

type PaymentStatusValues = z.infer<typeof schema>;

export function PaymentStatusForm({
  initial,
  loading,
  onSubmit,
}: {
  initial?: Record<string, unknown>;
  loading?: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const { control, handleSubmit } = useForm<PaymentStatusValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      payment_status: (String(initial?.payment_status ?? 'PENDING') as PaymentStatusValues['payment_status']) || 'PENDING',
      transaction_reference: String(initial?.transaction_reference ?? ''),
      notes: String(initial?.notes ?? ''),
      provider: String(initial?.provider ?? ''),
      provider_payment_id: String(initial?.provider_payment_id ?? ''),
      provider_order_id: String(initial?.provider_order_id ?? ''),
    },
  });

  function submit(values: PaymentStatusValues) {
    onSubmit({
      payment_status: values.payment_status,
      transaction_reference: values.transaction_reference || null,
      notes: values.notes || null,
      provider: values.provider || null,
      provider_payment_id: values.provider_payment_id || null,
      provider_order_id: values.provider_order_id || null,
      raw_response: {},
    });
  }

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit(submit)}>
      <Controller
        control={control}
        name="payment_status"
        render={({ field, fieldState }) => (
          <TextField {...field} error={!!fieldState.error} helperText={fieldState.error?.message} label="Status" select>
            {['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED'].map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      {[
        ['transaction_reference', 'Transaction Reference'],
        ['notes', 'Notes'],
        ['provider', 'Provider'],
        ['provider_payment_id', 'Provider Payment ID'],
        ['provider_order_id', 'Provider Order ID'],
      ].map(([name, label]) => (
        <Controller
          control={control}
          key={name}
          name={name as keyof PaymentStatusValues}
          render={({ field, fieldState }) => (
            <TextField {...field} error={!!fieldState.error} helperText={fieldState.error?.message} label={label} />
          )}
        />
      ))}
      <Button disabled={loading} type="submit" variant="contained">
        Update Payment
      </Button>
    </Stack>
  );
}
