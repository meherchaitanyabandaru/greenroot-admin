import { Box, Stack, Typography } from '@mui/material';
import { createElement, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { navigationGroups } from '../navigation/navigationGroups';

/** The sidebar icon for the current page, so titles match the menu. */
function usePageIcon() {
  const { pathname } = useLocation();
  for (const group of navigationGroups) {
    const item = group.items.find((i) => i.path === pathname);
    if (item) return item.icon;
  }
  return null;
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const Icon = usePageIcon();
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={2}
      sx={{ mb: 2.5 }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        {Icon && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              color: 'primary.main',
              background: '#ecfdf3',
              flexShrink: 0,
            }}
          >
            {createElement(Icon, { sx: { fontSize: 22 } })}
          </Box>
        )}
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
      </Stack>
      {action}
    </Stack>
  );
}
