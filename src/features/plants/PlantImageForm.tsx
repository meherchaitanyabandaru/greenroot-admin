import { zodResolver } from '@hookform/resolvers/zod';
import { Button, FormControlLabel, Stack, Switch, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  image_url: z.string().url('Valid image URL is required'),
  alt_text: z.string().optional(),
  display_order: z.string().optional(),
  is_primary: z.boolean(),
});

type PlantImageFormValues = z.infer<typeof schema>;

export function PlantImageForm({
  loading,
  onSubmit,
}: {
  loading?: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const { control, handleSubmit, reset } = useForm<PlantImageFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      image_url: '',
      alt_text: '',
      display_order: '0',
      is_primary: false,
    },
  });

  async function submit(values: PlantImageFormValues) {
    await onSubmit({
      image_url: values.image_url,
      alt_text: values.alt_text || null,
      display_order: values.display_order ? Number(values.display_order) : 0,
      is_primary: values.is_primary,
    });
    reset();
  }

  return (
    <Stack component="form" spacing={1.5} onSubmit={handleSubmit(submit)}>
      <Controller
        control={control}
        name="image_url"
        render={({ field, fieldState }) => (
          <TextField {...field} error={!!fieldState.error} helperText={fieldState.error?.message} label="Image URL" size="small" />
        )}
      />
      <Controller
        control={control}
        name="alt_text"
        render={({ field, fieldState }) => (
          <TextField {...field} error={!!fieldState.error} helperText={fieldState.error?.message} label="Alt Text" size="small" />
        )}
      />
      <Controller
        control={control}
        name="display_order"
        render={({ field, fieldState }) => (
          <TextField {...field} error={!!fieldState.error} helperText={fieldState.error?.message} label="Display Order" size="small" />
        )}
      />
      <Controller
        control={control}
        name="is_primary"
        render={({ field }) => (
          <FormControlLabel
            control={<Switch checked={field.value} onChange={(event) => field.onChange(event.target.checked)} />}
            label="Primary image"
          />
        )}
      />
      <Button disabled={loading} type="submit" variant="outlined">
        Add Image
      </Button>
    </Stack>
  );
}
