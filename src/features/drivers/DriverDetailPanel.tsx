import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useGetDriverQuery,
  useUpdateDriverMutation,
  useUpdateDriverLocationMutation,
  useGetDriverLatestTrackingQuery,
} from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { StatusChip } from '../../components/status/StatusChip';
import { normalizeApiError } from '../../utils/apiError';
import { DriverForm } from './DriverForm';

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

function isExpiryWarning(dateStr: unknown): boolean {
  if (!dateStr) return false;
  const diff = new Date(String(dateStr)).getTime() - Date.now();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
}

function LocationUpdateForm({ driverId }: { driverId: number }) {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [updateLocation, state] = useUpdateDriverLocationMutation();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const la = parseFloat(lat);
    const lo = parseFloat(lng);
    if (isNaN(la) || isNaN(lo)) { setError('Enter valid lat/lng'); return; }
    try {
      setError('');
      setSuccess(false);
      await updateLocation({ id: driverId, body: { latitude: la, longitude: lo } }).unwrap();
      setSuccess(true);
      setLat('');
      setLng('');
    } catch (e) {
      setError(normalizeApiError(e).message);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 1 }}>Location updated.</Alert>}
      <Stack direction="row" spacing={1} alignItems="flex-end">
        <TextField size="small" label="Latitude" type="number" value={lat} onChange={(e) => setLat(e.target.value)} sx={{ width: 120 }} inputProps={{ step: 'any' }} />
        <TextField size="small" label="Longitude" type="number" value={lng} onChange={(e) => setLng(e.target.value)} sx={{ width: 120 }} inputProps={{ step: 'any' }} />
        <Button type="submit" variant="contained" size="small" disabled={state.isLoading}>
          {state.isLoading ? <CircularProgress size={14} /> : 'Update'}
        </Button>
      </Stack>
    </Box>
  );
}

export function DriverDetailPanel({ driverId }: { driverId: number }) {
  const driverQuery = useGetDriverQuery(driverId);
  const latestQuery = useGetDriverLatestTrackingQuery(driverId);
  const [updateDriver, updateState] = useUpdateDriverMutation();
  const [tab, setTab] = useState(0);

  if (driverQuery.isLoading) return <LoadingState />;
  if (driverQuery.error)
    return <ErrorState message={normalizeApiError(driverQuery.error).message} onRetry={driverQuery.refetch} />;

  const driver = driverQuery.data?.driver ?? {};
  const latest = latestQuery.data?.tracking ?? null;
  const expiry = driver.license_expiry_date;

  const detailItems: Array<[string, unknown, boolean?]> = [
    ['Code', driver.driver_code],
    ['Name', driver.driver_name],
    ['Mobile', driver.mobile],
    ['License No.', driver.license_number],
    ['License Expiry', expiry, isExpiryWarning(expiry)],
    ['Emergency Contact', driver.emergency_contact],
    ['User ID', driver.user_id],
    ['Created', driver.created_at],
  ];

  async function handleUpdate(values: Record<string, unknown>) {
    try {
      await updateDriver({ id: driverId, body: values }).unwrap();
      driverQuery.refetch();
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
              <Typography color="text.secondary" variant="body2">Driver</Typography>
              <Typography variant="h6">{text(driver.driver_name ?? driver.driver_code)}</Typography>
              <Typography color="text.secondary" variant="body2">{text(driver.driver_code)}</Typography>
            </Box>
            <StatusChip value={driver.status} />
          </Stack>
          <Grid container spacing={1.5}>
            {detailItems.map(([label, value, warn]) => (
              <Grid key={String(label)} size={{ xs: 12, sm: 6 }}>
                <Typography color="text.secondary" variant="caption">{label}</Typography>
                <Typography variant="body2" color={warn ? 'warning.main' : undefined}>
                  {text(value)}{warn ? ' ⚠️ expiring soon' : ''}
                </Typography>
              </Grid>
            ))}
          </Grid>
          <Divider />
          <DriverForm
            initial={driver}
            loading={updateState.isLoading}
            onSubmit={handleUpdate}
          />
        </Stack>
      </Paper>

      <Box>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tab label="Location" />
        </Tabs>

        {tab === 0 && (
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Current Location</Typography>
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
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Update Location (Manual)</Typography>
              <LocationUpdateForm driverId={driverId} />
            </Paper>
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
