import { Chip, Paper, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

// Shared building blocks for messaging channel pages (SMS, Email).

const STATUS_COLOR: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  APPROVED: 'success',
  SUBMITTED: 'info',
  DRAFT: 'default',
  NOT_REGISTERED: 'default',
  REJECTED: 'error',
  INACTIVE: 'warning',
  ACTIVE: 'success',
  SENT: 'success',
  DELIVERED: 'success',
  MOCKED: 'info',
  BLOCKED: 'warning',
  FAILED: 'error',
  BOUNCED: 'error',
};

export function StatusChip({ status }: { status: string }) {
  return (
    <Chip
      label={status}
      size="small"
      color={STATUS_COLOR[status] ?? 'default'}
      variant={status === 'DRAFT' ? 'outlined' : 'filled'}
    />
  );
}

export type ReadinessCheck = { key: string; label: string; ok: boolean; detail?: string };

/** Go-live checklist; the provider check is shown in the page banner instead. */
export function ReadinessCard({ checks, ready, readyText }: { checks: ReadinessCheck[]; ready: boolean; readyText: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} mb={1}>
        Go-live checklist {ready ? `— ${readyText}` : ''}
      </Typography>
      <Stack spacing={1}>
        {checks
          .filter((c) => c.key !== 'provider')
          .map((c) => (
            <Stack key={c.key} direction="row" spacing={1} alignItems="center">
              {c.ok ? <CheckCircleIcon color="success" fontSize="small" /> : <RadioButtonUncheckedIcon color="disabled" fontSize="small" />}
              <Typography variant="body2">{c.label}</Typography>
              {c.detail && !c.ok && (
                <Typography variant="caption" color="text.secondary">
                  ({c.detail})
                </Typography>
              )}
            </Stack>
          ))}
      </Stack>
    </Paper>
  );
}
