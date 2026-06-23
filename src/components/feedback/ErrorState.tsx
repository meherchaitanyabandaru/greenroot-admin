import { Alert, Button, Stack } from '@mui/material';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Stack spacing={2}>
      <Alert severity="error">{message}</Alert>
      {onRetry ? (
        <Button onClick={onRetry} variant="outlined">
          Retry
        </Button>
      ) : null}
    </Stack>
  );
}
