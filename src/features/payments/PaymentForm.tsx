import { zodResolver } from '@hookform/resolvers/zod';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

const schema = z
  .object({
    payment_for: z.enum(['ORDER', 'SUBSCRIPTION']),
    order_id: z.string().optional(),
    user_subscription_id: z.string().optional(),
    payer_user_id: z.string().optional(),
    amount: z.string().min(1, 'Amount is required'),
    payment_method: z.enum(['UPI', 'CARD', 'CASH', 'BANK_TRANSFER', 'NET_BANKING', 'WALLET', 'COD', 'CHEQUE', 'OTHER']),
    transaction_reference: z.string().optional(),
    payment_status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED']),
    notes: z.string().optional(),
    provider: z.string().optional(),
    provider_payment_id: z.string().optional(),
    provider_order_id: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.payment_for === 'ORDER' && !value.order_id) {
      ctx.addIssue({ code: 'custom', path: ['order_id'], message: 'Order ID is required' });
    }
    if (value.payment_for === 'SUBSCRIPTION' && !value.user_subscription_id) {
      ctx.addIssue({ code: 'custom', path: ['user_subscription_id'], message: 'Subscription ID is required' });
    }
  });

type PaymentFormValues = z.infer<typeof schema>;

const methods = ['UPI', 'CARD', 'CASH', 'BANK_TRANSFER', 'NET_BANKING', 'WALLET', 'COD', 'CHEQUE', 'OTHER'];
const statuses = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED'];

export function PaymentForm({
  loading,
  onSubmit,
}: {
  loading?: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const { control, handleSubmit } = useForm<PaymentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      payment_for: 'ORDER',
      payment_method: 'UPI',
      payment_status: 'SUCCESS',
    },
  });
  const paymentFor = useWatch({ control, name: 'payment_for' });

  function submit(values: PaymentFormValues) {
    onSubmit({
      payment_for: values.payment_for,
      order_id: values.payment_for === 'ORDER' ? Number(values.order_id) : null,
      user_subscription_id:
        values.payment_for === 'SUBSCRIPTION' ? Number(values.user_subscription_id) : null,
      payer_user_id: values.payer_user_id ? Number(values.payer_user_id) : null,
      amount: Number(values.amount),
      payment_method: values.payment_method,
      transaction_reference: values.transaction_reference || null,
      payment_status: values.payment_status,
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
        name="payment_for"
        render={({ field, fieldState }) => (
          <TextField {...field} error={!!fieldState.error} helperText={fieldState.error?.message} label="Payment For" select>
            {['ORDER', 'SUBSCRIPTION'].map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      {paymentFor === 'ORDER' ? (
        <Controller
          control={control}
          name="order_id"
          render={({ field, fieldState }) => (
            <TextField {...field} error={!!fieldState.error} helperText={fieldState.error?.message} label="Order ID" />
          )}
        />
      ) : (
        <Controller
          control={control}
          name="user_subscription_id"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              label="User Subscription ID"
            />
          )}
        />
      )}
      {[
        ['payer_user_id', 'Payer User ID'],
        ['amount', 'Amount'],
        ['transaction_reference', 'Transaction Reference'],
        ['notes', 'Notes'],
        ['provider', 'Provider'],
        ['provider_payment_id', 'Provider Payment ID'],
        ['provider_order_id', 'Provider Order ID'],
      ].map(([name, label]) => (
        <Controller
          control={control}
          key={name}
          name={name as keyof PaymentFormValues}
          render={({ field, fieldState }) => (
            <TextField {...field} error={!!fieldState.error} helperText={fieldState.error?.message} label={label} />
          )}
        />
      ))}
      <Controller
        control={control}
        name="payment_method"
        render={({ field, fieldState }) => (
          <TextField {...field} error={!!fieldState.error} helperText={fieldState.error?.message} label="Method" select>
            {methods.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        control={control}
        name="payment_status"
        render={({ field, fieldState }) => (
          <TextField {...field} error={!!fieldState.error} helperText={fieldState.error?.message} label="Status" select>
            {statuses.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Button disabled={loading} type="submit" variant="contained">
        Record Payment
      </Button>
    </Stack>
  );
}
