import { zodResolver } from '@hookform/resolvers/zod';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  license_number: z.string().min(3, 'License number is required'),
  license_expiry_date: z.string().optional(),
  emergency_contact: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']),
});

type DriverFormValues = z.infer<typeof schema>;

export function DriverForm({
  initial,
  loading,
  onSubmit,
}: {
  initial?: Record<string, unknown>;
  loading?: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const { control, handleSubmit } = useForm<DriverFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      user_id: initial?.user_id ? String(initial.user_id) : '',
      license_number: String(initial?.license_number ?? ''),
      license_expiry_date: String(initial?.license_expiry_date ?? '').slice(0, 10),
      emergency_contact: String(initial?.emergency_contact ?? ''),
      status: (String(initial?.status ?? 'ACTIVE') as DriverFormValues['status']) || 'ACTIVE',
    },
  });

  function submit(values: DriverFormValues) {
    onSubmit({
      ...values,
      user_id: Number(values.user_id),
      license_expiry_date: values.license_expiry_date || null,
      emergency_contact: values.emergency_contact || null,
    });
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(submit)} spacing={2}>
      <Controller
        control={control}
        name="user_id"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            error={!!fieldState.error}
            fullWidth
            helperText={fieldState.error?.message}
            label="User ID"
            type="number"
          />
        )}
      />
      <Controller
        control={control}
        name="license_number"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            error={!!fieldState.error}
            fullWidth
            helperText={fieldState.error?.message}
            label="License number"
          />
        )}
      />
      <Controller
        control={control}
        name="license_expiry_date"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            error={!!fieldState.error}
            fullWidth
            helperText={fieldState.error?.message}
            InputLabelProps={{ shrink: true }}
            label="License expiry date"
            type="date"
          />
        )}
      />
      <Controller
        control={control}
        name="emergency_contact"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            error={!!fieldState.error}
            fullWidth
            helperText={fieldState.error?.message}
            label="Emergency contact"
          />
        )}
      />
      <Controller
        control={control}
        name="status"
        render={({ field, fieldState }) => (
          <TextField {...field} error={!!fieldState.error} fullWidth helperText={fieldState.error?.message} label="Status" select>
            {['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'].map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Button disabled={loading} type="submit" variant="contained">
        Save driver
      </Button>
    </Stack>
  );
}
