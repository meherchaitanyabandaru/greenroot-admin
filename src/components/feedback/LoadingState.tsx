import { Box, LinearProgress, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

export function LoadingState({ label: _label }: { label?: string } = {}) {
  return (
    <Box sx={{ py: 4 }}>
      <LinearProgress
        sx={{
          borderRadius: 2,
          height: 3,
          bgcolor: 'primary.50',
          '& .MuiLinearProgress-bar': { borderRadius: 2 },
        }}
      />
    </Box>
  );
}

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {[...Array(cols)].map((_, i) => (
            <TableCell key={i}>
              <Skeleton variant="text" width={i === 0 ? 120 : 80} height={14} />
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {[...Array(rows)].map((_, r) => (
          <TableRow key={r}>
            {[...Array(cols)].map((_, c) => (
              <TableCell key={c}>
                {c === 0 ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Skeleton variant="circular" width={28} height={28} />
                    <Skeleton variant="text" width={100} height={14} />
                  </Stack>
                ) : (
                  <Skeleton variant="text" width={c === cols - 1 ? 60 : 90} height={14} />
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function DetailSkeleton() {
  return (
    <Stack spacing={2.5}>
      <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Stack direction="row" spacing={2} mb={2}>
          <Skeleton variant="rounded" width={112} height={112} />
          <Stack spacing={1} flex={1}>
            <Skeleton variant="text" width="30%" height={12} />
            <Skeleton variant="text" width="55%" height={28} />
            <Skeleton variant="text" width="40%" height={14} />
            <Stack direction="row" spacing={1}>
              <Skeleton variant="rounded" width={70} height={22} />
              <Skeleton variant="rounded" width={90} height={22} />
            </Stack>
          </Stack>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          {[...Array(4)].map((_, i) => (
            <Box key={i}>
              <Skeleton variant="text" width="35%" height={12} />
              <Skeleton variant="text" width="65%" height={16} />
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} variant="text" width={70} height={20} />
        ))}
      </Box>
      <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {[...Array(6)].map((_, i) => (
            <Box key={i}>
              <Skeleton variant="text" width="35%" height={12} />
              <Skeleton variant="text" width="75%" height={16} />
            </Box>
          ))}
        </Box>
      </Box>
    </Stack>
  );
}
