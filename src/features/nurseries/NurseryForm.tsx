import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Stack, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'Nursery name is required'),
  mobile: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  status: z.string().optional(),
});

type NurseryFormValues = z.infer<typeof schema>;

function str(v: unknown) {
  return v === null || v === undefined ? '' : String(v);
}

export function NurseryForm({
  initial,
  onSubmit,
  loading,
  onDelete,
}: {
  initial?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void;
  loading?: boolean;
  onDelete?: () => void;
}) {
  const { control, handleSubmit } = useForm<NurseryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: str(initial?.code),
      name: str(initial?.name),
      mobile: str(initial?.mobile),
      email: str(initial?.email),
      status: str(initial?.status) || 'ACTIVE',
    },
  });

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2}>
      {(['code', 'name', 'mobile', 'email', 'status'] as const).map((name) => (
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
              label={name.replaceAll('_', ' ')}
            />
          )}
        />
      ))}
      <Stack direction="row" spacing={1}>
        <Button disabled={loading} type="submit" variant="contained">
          Save nursery
        </Button>
        {onDelete ? (
          <Button color="error" disabled={loading} onClick={onDelete} variant="outlined">
            Delete
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
}
