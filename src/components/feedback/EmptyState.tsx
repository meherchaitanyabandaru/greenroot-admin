import { Box, Typography } from '@mui/material';

export function EmptyState({
  title = 'No records found',
  description = 'Try adjusting your search or filters.',
  icon = '🌱',
}: {
  title?: string;
  description?: string;
  icon?: string;
}) {
  return (
    <Box sx={{ py: 7, textAlign: 'center' }}>
      <Typography fontSize={36} mb={1.5} lineHeight={1}>
        {icon}
      </Typography>
      <Typography fontWeight={600} color="text.primary" fontSize={14} mb={0.5}>
        {title}
      </Typography>
      <Typography color="text.secondary" variant="body2">
        {description}
      </Typography>
    </Box>
  );
}
