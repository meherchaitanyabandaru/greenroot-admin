import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
          {title}
        </Typography>
        {description && (
          <Typography color="text.secondary" variant="body2" mt={0.4}>
            {description}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
}
