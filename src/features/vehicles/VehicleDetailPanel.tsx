import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  Link,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useGetVehicleQuery,
  useUpdateVehicleMutation,
  useListVehicleTrackingQuery,
  useGetVehicleLatestTrackingQuery,
} from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { StatusChip } from '../../components/status/StatusChip';
import { normalizeApiError } from '../../utils/apiError';
import { VehicleForm } from './VehicleForm';

function text(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function mapsLink(lat: unknown, lng: unknown) {
  const la = Number(lat);
  const lo = Number(lng);
  if (!la || !lo) return null;
  return `https://maps.google.com/?q=${la},${lo}`;
}

function capability(record: Record<string, unknown>, key: string): boolean | undefined {
  const caps = record.capabilities;
  if (!caps || typeof caps !== 'object') return undefined;
  const value = (caps as Record<string, unknown>)[key];
  return typeof value === 'boolean' ? value : undefined;
}

export function VehicleDetailPanel({ vehicleId }: { vehicleId: number }) {
  const vehicleQuery = useGetVehicleQuery(vehicleId);
  const trackingQuery = useListVehicleTrackingQuery(vehicleId);
  const latestQuery = useGetVehicleLatestTrackingQuery(vehicleId);
  const [updateVehicle, updateState] = useUpdateVehicleMutation();
  const [tab, setTab] = useState(0);

  if (vehicleQuery.isLoading) return <LoadingState />;
  if (vehicleQuery.error)
    return <ErrorState message={normalizeApiError(vehicleQuery.error).message} onRetry={vehicleQuery.refetch} />;

  const vehicle = vehicleQuery.data?.vehicle ?? {};
  const latest = latestQuery.data?.tracking ?? null;
  const trackingPoints = trackingQuery.data?.tracking ?? [];
  const canEdit = capability(vehicle, 'can_edit') ?? true;
  const canTrack = capability(vehicle, 'can_track') ?? true;

  const detailItems: Array<[string, unknown]> = [
    ['Code', vehicle.vehicle_code],
    ['Number', vehicle.vehicle_number],
    ['Type', vehicle.vehicle_type],
    ['Capacity (kg)', vehicle.capacity_kg],
    ['Owner', vehicle.owner_name],
    ['Mobile', vehicle.mobile],
    ['Assigned Driver', vehicle.driver_name],
    ['Driver Mobile', vehicle.driver_mobile],
    ['Driver Approval', vehicle.driver_approval_status],
    ['Created', vehicle.created_at],
  ];

  async function handleUpdate(values: Record<string, unknown>) {
    try {
      await updateVehicle({ id: vehicleId, body: values }).unwrap();
      vehicleQuery.refetch();
    } catch (_) {}
  }

  return (
    <Stack spacing={2}>
      {updateState.isError && (
        <Alert severity="error">{normalizeApiError(updateState.error).message}</Alert>
      )}

      <Paper sx={{ p: 2 }} variant="outlined">
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography color="text.secondary" variant="body2">Vehicle</Typography>
              <Typography variant="h6">{text(vehicle.vehicle_number)}</Typography>
              <Typography color="text.secondary" variant="body2">{text(vehicle.vehicle_code)}</Typography>
            </Box>
            <StatusChip value={vehicle.status} />
          </Stack>
          <Grid container spacing={1.5}>
            {detailItems.map(([label, value]) => (
              <Grid key={String(label)} size={{ xs: 12, sm: 6 }}>
                <Typography color="text.secondary" variant="caption">{label}</Typography>
                <Typography variant="body2">{text(value)}</Typography>
              </Grid>
            ))}
          </Grid>
          {canEdit && (
            <>
              <Divider />
              <VehicleForm
                initial={vehicle}
                loading={updateState.isLoading}
                onSubmit={handleUpdate}
              />
            </>
          )}
        </Stack>
      </Paper>

      {canTrack && (
      <Box>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tab label="Location" />
          <Tab label="Tracking History" />
        </Tabs>

        {tab === 0 && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            {latest ? (
              <Stack spacing={1}>
                <Typography variant="body2">
                  Lat: <strong>{String(latest.latitude)}</strong> / Lng: <strong>{String(latest.longitude)}</strong>
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  Recorded: {text(latest.tracked_at)}
                </Typography>
                {mapsLink(latest.latitude, latest.longitude) && (
                  <Link href={mapsLink(latest.latitude, latest.longitude)!} target="_blank" rel="noopener">
                    View on Google Maps
                  </Link>
                )}
              </Stack>
            ) : (
              <Typography color="text.secondary" variant="body2">No location recorded.</Typography>
            )}
          </Paper>
        )}

        {tab === 1 && (
          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Time', 'Latitude', 'Longitude', 'Map'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {trackingPoints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography color="text.secondary" variant="body2">No tracking points.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  trackingPoints.map((pt, i) => {
                    const link = mapsLink(pt.latitude, pt.longitude);
                    return (
                      <TableRow key={i}>
                        <TableCell>{text(pt.tracked_at)}</TableCell>
                        <TableCell>{text(pt.latitude)}</TableCell>
                        <TableCell>{text(pt.longitude)}</TableCell>
                        <TableCell>
                          {link ? <Link href={link} target="_blank" rel="noopener">Map</Link> : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>
      )}
    </Stack>
  );
}
