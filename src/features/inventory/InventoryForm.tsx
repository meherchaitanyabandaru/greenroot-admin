import { zodResolver } from '@hookform/resolvers/zod';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  nursery_id: z.string().min(1, 'Nursery ID is required'),
  plant_id: z.string().min(1, 'Plant ID is required'),
  size_id: z.string().min(1, 'Size ID is required'),
  available_quantity: z.string().min(1, 'Quantity is required'),
  inventory_status: z.enum(['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK', 'RESERVED', 'DISCONTINUED']),
});

type InventoryFormValues = z.infer<typeof schema>;

export function InventoryForm({
  initial,
  loading,
  onSubmit,
}: {
  initial?: Record<string, unknown>;
  loading?: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const { control, handleSubmit } = useForm<InventoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nursery_id: String(initial?.nursery_id ?? ''),
      plant_id: String(initial?.plant_id ?? ''),
      size_id: String(initial?.size_id ?? ''),
      available_quantity: String(initial?.available_quantity ?? ''),
      inventory_status: (String(initial?.inventory_status ?? 'AVAILABLE') as InventoryFormValues['inventory_status']) || 'AVAILABLE',
    },
  });

  function submit(values: InventoryFormValues) {
    onSubmit({
      nursery_id: Number(values.nursery_id),
      plant_id: Number(values.plant_id),
      size_id: Number(values.size_id),
      available_quantity: Number(values.available_quantity),
      inventory_status: values.inventory_status,
    });
  }

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit(submit)}>
      {[
        ['nursery_id', 'Nursery ID'],
        ['plant_id', 'Plant ID'],
        ['size_id', 'Size ID'],
        ['available_quantity', 'Available Quantity'],
      ].map(([name, label]) => (
        <Controller
          control={control}
          key={name}
          name={name as keyof InventoryFormValues}
          render={({ field, fieldState }) => (
            <TextField {...field} error={!!fieldState.error} helperText={fieldState.error?.message} label={label} />
          )}
        />
      ))}
      <Controller
        control={control}
        name="inventory_status"
        render={({ field, fieldState }) => (
          <TextField {...field} error={!!fieldState.error} helperText={fieldState.error?.message} label="Status" select>
            {['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK', 'RESERVED', 'DISCONTINUED'].map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Button disabled={loading} type="submit" variant="contained">
        Save Inventory
      </Button>
    </Stack>
  );
}
