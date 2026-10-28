import { Button, Divider, Stack, Typography } from '@mui/material';

// The only moves PUT /orders/:id/status accepts (orders policy.go CanTransition);
// loading and cancelling have their own actions. Finished orders have none.
const NEXT: Record<string, { status: string; label: string; hint: string }> = {
  PENDING: { status: 'CONFIRMED', label: 'Mark Confirmed', hint: 'Needs a delivery address on the order.' },
  LOADED: { status: 'COMPLETED', label: 'Mark Completed', hint: 'Only after its trip is delivered.' },
  PARTIALLY_FULFILLED: { status: 'COMPLETED', label: 'Mark Completed', hint: 'Only after its trip is delivered.' },
};

export function OrderStatusForm({
  initialStatus,
  loading,
  onSubmit,
}: {
  initialStatus?: unknown;
  loading?: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const next = NEXT[String(initialStatus ?? '')];
  if (!next) return null;
  return (
    <>
      <Divider />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
        <Button disabled={loading} variant="contained" onClick={() => onSubmit({ order_status: next.status })}>
          {next.label}
        </Button>
        <Typography fontSize={12.5} color="text.secondary">{next.hint}</Typography>
      </Stack>
    </>
  );
}
