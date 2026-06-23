import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Stack, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  scientific_name: z.string().min(1, 'Scientific name is required'),
  common_name: z.string().optional(),
  english_description: z.string().optional(),
  plant_type: z.string().optional(),
  light_requirement: z.string().optional(),
  water_requirement: z.string().optional(),
  category_ids: z.string().optional(),
  sunlight: z.string().optional(),
  watering: z.string().optional(),
  soil: z.string().optional(),
  temperature: z.string().optional(),
  fertilizer: z.string().optional(),
  pruning: z.string().optional(),
  care_notes: z.string().optional(),
});

type PlantFormValues = z.infer<typeof schema>;

export function PlantForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Partial<PlantFormValues> & { categories?: Array<{ id?: unknown }> };
  onSubmit: (values: Record<string, unknown>) => void;
  loading?: boolean;
}) {
  const { control, handleSubmit } = useForm<PlantFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      scientific_name: initial?.scientific_name ?? '',
      common_name: initial?.common_name ?? '',
      english_description: initial?.english_description ?? '',
      plant_type: initial?.plant_type ?? 'TREE',
      light_requirement: initial?.light_requirement ?? 'FULL_SUN',
      water_requirement: initial?.water_requirement ?? 'MEDIUM',
      category_ids:
        initial?.category_ids ??
        initial?.categories
          ?.map((category) => category.id)
          .filter(Boolean)
          .join(',') ??
        '',
      sunlight: initial?.sunlight ?? '',
      watering: initial?.watering ?? '',
      soil: initial?.soil ?? '',
      temperature: initial?.temperature ?? '',
      fertilizer: initial?.fertilizer ?? '',
      pruning: initial?.pruning ?? '',
      care_notes: initial?.care_notes ?? '',
    },
  });

  function submit(values: PlantFormValues) {
    const categoryIDs = String(values.category_ids ?? '')
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);
    onSubmit({
      scientific_name: values.scientific_name,
      common_name: values.common_name || null,
      english_description: values.english_description || null,
      plant_type: values.plant_type || null,
      light_requirement: values.light_requirement || null,
      water_requirement: values.water_requirement || null,
      category_ids: categoryIDs,
      care_guide: {
        sunlight: values.sunlight || null,
        watering: values.watering || null,
        soil: values.soil || null,
        temperature: values.temperature || null,
        fertilizer: values.fertilizer || null,
        pruning: values.pruning || null,
        notes: values.care_notes || null,
      },
    });
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(submit)} spacing={2}>
      {(
        [
          'scientific_name',
          'common_name',
          'english_description',
          'plant_type',
          'light_requirement',
          'water_requirement',
          'category_ids',
          'sunlight',
          'watering',
          'soil',
          'temperature',
          'fertilizer',
          'pruning',
          'care_notes',
        ] as const
      ).map((name) => (
        <Controller
          control={control}
          key={name}
          name={name}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              error={!!fieldState.error}
              fullWidth
              helperText={fieldState.error?.message}
              label={name === 'category_ids' ? 'category ids, comma separated' : name.replaceAll('_', ' ')}
              multiline={['english_description', 'care_notes'].includes(name)}
              minRows={['english_description', 'care_notes'].includes(name) ? 3 : undefined}
            />
          )}
        />
      ))}
      <Button disabled={loading} type="submit" variant="contained">
        Save plant
      </Button>
    </Stack>
  );
}
