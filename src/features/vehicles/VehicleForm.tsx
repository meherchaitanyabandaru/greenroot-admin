import { zodResolver } from '@hookform/resolvers/zod';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  vehicle_number: z.string().min(3, 'Vehicle number is required'),
  vehicle_type: z.string().optional(),
  capacity_kg: z.string().optional(),
  owner_name: z.string().optional(),
  mobile: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED']),
});

type VehicleFormValues = z.infer<typeof schema>;

export function VehicleForm({
  initial,
  loading,
  onSubmit,
}: {
  initial?: Record<string, unknown>;
  loading?: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const { control, handleSubmit } = useForm<VehicleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicle_number: String(initial?.vehicle_number ?? ''),
      vehicle_type: String(initial?.vehicle_type ?? ''),
      capacity_kg: initial?.capacity_kg ? String(initial.capacity_kg) : '',
      owner_name: String(initial?.owner_name ?? ''),
      mobile: String(initial?.mobile ?? ''),
      status: (String(initial?.status ?? 'ACTIVE') as VehicleFormValues['status']) || 'ACTIVE',
    },
  });

  function submit(values: VehicleFormValues) {
    onSubmit({
      ...values,
      vehicle_type: values.vehicle_type || null,
      capacity_kg: values.capacity_kg ? Number(values.capacity_kg) : null,
      owner_name: values.owner_name || null,
      mobile: values.mobile || null,
    });
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(submit)} spacing={2}>
      <Controller
        control={control}
        name="vehicle_number"
        render={({ field, fieldState }) => (
          <TextField {...field} error={!!fieldState.error} fullWidth helperText={fieldState.error?.message} label="Vehicle number" />
        )}
      />
      <Controller
        control={control}
        name="vehicle_type"
        render={({ field, fieldState }) => (
          <TextField {...field} error={!!fieldState.error} fullWidth helperText={fieldState.error?.message} label="Vehicle type" />
        )}
      />
      <Controller
        control={control}
        name="capacity_kg"
        render={({ field, fieldState }) => (
          <TextField {...field} error={!!fieldState.error} fullWidth helperText={fieldState.error?.message} label="Capacity KG" type="number" />
        )}
      />
      <Controller
        control={control}
        name="owner_name"
        render={({ field, fieldState }) => (
          <TextField {...field} error={!!fieldState.error} fullWidth helperText={fieldState.error?.message} label="Owner name" />
        )}
      />
      <Controller
        control={control}
        name="mobile"
        render={({ field, fieldState }) => (
          <TextField {...field} error={!!fieldState.error} fullWidth helperText={fieldState.error?.message} label="Mobile" />
        )}
      />
      <Controller
        control={control}
        name="status"
        render={({ field, fieldState }) => (
          <TextField {...field} error={!!fieldState.error} fullWidth helperText={fieldState.error?.message} label="Status" select>
            {['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED'].map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Button disabled={loading} type="submit" variant="contained">
        Save vehicle
      </Button>
    </Stack>
  );
}
