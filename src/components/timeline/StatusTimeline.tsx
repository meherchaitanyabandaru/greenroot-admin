import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Stack, Typography } from '@mui/material';

type Step = { label: string; value: string };

function stepIndex(steps: Step[], status: string): number {
  return steps.findIndex((s) => s.value === status);
}

export function StatusTimeline({
  steps,
  currentStatus,
  cancelledStatus,
}: {
  steps: Step[];
  currentStatus: string;
  cancelledStatus?: string;
}) {
  const isCancelled = currentStatus === cancelledStatus;
  const current = stepIndex(steps, currentStatus);

  return (
    <Stack direction="row" alignItems="flex-start" sx={{ width: '100%', overflowX: 'auto', pb: 0.5 }}>
      {steps.map((step, i) => {
        const isDone = !isCancelled && i < current;
        const isActive = !isCancelled && i === current;
        const isFuture = !isCancelled && i > current;

        const dotColor = isCancelled
          ? '#98A2B3'
          : isDone
          ? '#17803D'
          : isActive
          ? '#1F7A3A'
          : '#DFE7E2';

        const textColor = isCancelled
          ? 'text.disabled'
          : isActive
          ? 'text.primary'
          : isDone
          ? 'text.secondary'
          : 'text.disabled';

        return (
          <Stack key={step.value} direction="row" alignItems="flex-start" sx={{ flex: 1, minWidth: 80 }}>
            <Stack alignItems="center" sx={{ flex: 1 }}>
              {/* Dot */}
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: dotColor,
                  border: isActive ? '2px solid #0B3D1C' : '2px solid transparent',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  zIndex: 1,
                  boxShadow: isActive ? '0 0 0 3px rgba(31,122,58,0.15)' : 'none',
                }}
              >
                {isDone && <CheckIcon sx={{ fontSize: 14, color: '#fff' }} />}
                {isActive && (
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#fff' }} />
                )}
                {isCancelled && i === current && (
                  <CloseIcon sx={{ fontSize: 14, color: '#fff' }} />
                )}
              </Box>

              {/* Label */}
              <Typography
                fontSize={11}
                fontWeight={isActive ? 700 : 500}
                color={textColor}
                textAlign="center"
                mt={0.75}
                sx={{ lineHeight: 1.3 }}
              >
                {step.label}
              </Typography>
            </Stack>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  height: 2,
                  bgcolor: isDone && !isCancelled ? '#17803D' : '#DFE7E2',
                  mt: '13px',
                  mx: 0.5,
                }}
              />
            )}
          </Stack>
        );
      })}

      {isCancelled && (
        <Stack alignItems="center" sx={{ minWidth: 80 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: '#C2410C',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <CloseIcon sx={{ fontSize: 14, color: '#fff' }} />
          </Box>
          <Typography fontSize={11} fontWeight={700} color="error.main" mt={0.75}>
            Cancelled
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}
