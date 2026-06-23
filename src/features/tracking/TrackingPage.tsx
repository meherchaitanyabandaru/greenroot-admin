import {
  Alert,
  Box,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect } from 'react';
import { useListResourceQuery, useGetVehicleLatestTrackingQuery } from '../../api/adminResources';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { PageHeader } from '../../components/page/PageHeader';
import { normalizeApiError } from '../../utils/apiError';

function text(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function LatestLocation({ vehicleId }: { vehicleId: number }) {
  const q = useGetVehicleLatestTrackingQuery(vehicleId, { pollingInterval: 30000 });
  const pt = q.data?.tracking ?? null;
  if (!pt) return <Typography color="text.secondary" variant="body2">—</Typography>;
  const link = `https://maps.google.com/?q=${String(pt.latitude)},${String(pt.longitude)}`;
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="body2">{String(pt.latitude)}, {String(pt.longitude)}</Typography>
      <Link href={link} target="_blank" rel="noopener" variant="body2">Map</Link>
    </Stack>
  );
}

export function TrackingPage() {
  const { data, error, isFetching, refetch } = useListResourceQuery(
    { resource: 'dispatches', params: { page: 1, per_page: 50, dispatch_status: 'IN_TRANSIT' } },
    { pollingInterval: 30000 },
  );

  useEffect(() => {
    const id = setInterval(() => refetch(), 30000);
    return () => clearInterval(id);
  }, [refetch]);

  const dispatches: Record<string, unknown>[] = data?.rows ?? [];

  return (
    <Box>
      <PageHeader
        title="Live Tracking"
        description="IN_TRANSIT dispatches — auto-refreshes every 30 seconds."
      />
      {isFetching && <LoadingState />}
      {error && <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />}
      {!error && (
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Dispatch', 'Order', 'Vehicle', 'Driver', 'Destination', 'Latest Location'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {dispatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Alert severity="info">No dispatches currently IN_TRANSIT.</Alert>
                  </TableCell>
                </TableRow>
              ) : (
                dispatches.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell>{text(d.dispatch_code)}</TableCell>
                    <TableCell>{text(d.order_number)}</TableCell>
                    <TableCell>{text(d.vehicle_number)}</TableCell>
                    <TableCell>{text(d.driver_name ?? d.driver_id)}</TableCell>
                    <TableCell>{text(d.destination_address)}</TableCell>
                    <TableCell>
                      {d.vehicle_id ? (
                        <LatestLocation vehicleId={Number(d.vehicle_id)} />
                      ) : (
                        <Typography color="text.secondary" variant="body2">—</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
