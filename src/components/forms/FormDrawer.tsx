import CloseIcon from '@mui/icons-material/Close';
import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function FormDrawer({
  open,
  title,
  children,
  onClose,
  width,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  width?: { xs: string; sm: number };
}) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: width ?? { xs: '100%', sm: 460 } } }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Stack>
      <Box sx={{ px: 2, pb: 2 }}>{children}</Box>
    </Drawer>
  );
}
