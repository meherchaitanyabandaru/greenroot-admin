import { Box, Paper, Stack, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(420px, 520px) 1fr' },
        bgcolor: 'background.default',
      }}
    >
      <Stack alignItems="center" justifyContent="center" sx={{ p: { xs: 2, sm: 4 } }}>
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 420,
            p: { xs: 3, sm: 4 },
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Outlet />
        </Paper>
      </Stack>
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'flex-end',
          p: 6,
          color: '#fff',
          bgcolor: 'primary.dark',
          background:
            'linear-gradient(150deg, rgba(11,61,28,0.98), rgba(31,122,58,0.82)), radial-gradient(circle at top right, rgba(163,214,92,0.5), transparent 30%)',
        }}
      >
        <Box>
          <Typography variant="h3">Nurturing plants, growing futures.</Typography>
          <Typography sx={{ mt: 2, maxWidth: 560 }}>
            GreenRoot Admin gives platform operators clear control over catalog, nurseries,
            inventory, orders, dispatches, and audit activity.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
