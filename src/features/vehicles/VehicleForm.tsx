import { zodResolver } from '@hookform/resolvers/zod';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { type OwnerOption, OwnerPicker } from './VehicleOwners';
import { LORRY_TYPES } from './vehiclesApi';

const schema = z.object({
  vehicle_number: z.string().min(3, 'Vehicle number is required'),
  vehicle_type: z.string().optional(),
  capacity_kg: z.string().optional(),
  owner: z.object({ id: z.number(), name: z.string(), mobile: z.string().nullish() }).nullable(),
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
  const currentType = String(initial?.vehicle_type ?? '');
  // Older lorries may carry a type outside today's list; keep it selectable.
  const types = currentType && !LORRY_TYPES.includes(currentType as (typeof LORRY_TYPES)[number]) ? [...LORRY_TYPES, currentType] : LORRY_TYPES;
  const { control, handleSubmit } = useForm<VehicleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicle_number: String(initial?.vehicle_number ?? ''),
      vehicle_type: currentType,
      capacity_kg: initial?.capacity_kg ? String(initial.capacity_kg) : '',
      owner: initial?.owner_id ? { id: Number(initial.owner_id), name: String(initial.owner_name ?? ''), mobile: (initial.mobile as string) ?? null } : null,
      status: (String(initial?.status ?? 'ACTIVE') as VehicleFormValues['status']) || 'ACTIVE',
    },
  });

  function submit({ owner, ...values }: VehicleFormValues) {
    onSubmit({
      ...values,
      vehicle_type: values.vehicle_type || null,
      capacity_kg: values.capacity_kg ? Number(values.capacity_kg) : null,
      owner_id: owner?.id ?? null,
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
          <TextField {...field} error={!!fieldState.error} fullWidth helperText={fieldState.error?.message} label="Vehicle type" select>
            <MenuItem value="">—</MenuItem>
            {types.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
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
        name="owner"
        render={({ field }) => <OwnerPicker value={field.value as OwnerOption | null} onChange={field.onChange} />}
      />
      <Controller
        control={control}
        name="status"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            error={!!fieldState.error}
            fullWidth
            helperText={fieldState.error?.message ?? 'A lorry on a trip stays ACTIVE until the trip ends.'}
            label="Status"
            select
          >
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
