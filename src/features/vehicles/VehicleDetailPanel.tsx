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
import { useToast } from '../../components/feedback/toastContext';
import { LoadingState } from '../../components/feedback/LoadingState';
import { StatusChip } from '../../components/status/StatusChip';
import { normalizeApiError } from '../../utils/apiError';
import { VehicleForm } from './VehicleForm';
import { DecisionDialog, VehicleLinksTable } from './VehicleLinks';
import { useSetVehicleApprovalMutation } from './vehiclesApi';

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
  const { showToast } = useToast();
  const vehicleQuery = useGetVehicleQuery(vehicleId);
  const trackingQuery = useListVehicleTrackingQuery(vehicleId);
  const latestQuery = useGetVehicleLatestTrackingQuery(vehicleId);
  const [updateVehicle, updateState] = useUpdateVehicleMutation();
  const [setApproval, approvalState] = useSetVehicleApprovalMutation();
  const [deciding, setDeciding] = useState<{ status: string; label: string; needsNote: boolean } | null>(null);
  const [approvalErr, setApprovalErr] = useState('');
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
    ['Owner', vehicle.owner_name ? `${vehicle.owner_name}${vehicle.owner_has_account ? '' : ' (no app account)'}` : null],
    ["Owner's mobile", vehicle.mobile],
    ['Approved drivers', vehicle.driver_count],
    ['On a trip now', vehicle.is_on_active_trip ? 'Yes' : 'No'],
    ['Approval note', vehicle.approval_note],
    ['Created', vehicle.created_at],
  ];

  const approval = String(vehicle.approval_status ?? 'PENDING');
  const approvalActions = [
    { status: 'APPROVED', label: approval === 'SUSPENDED' ? 'Reinstate' : 'Approve', needsNote: false },
    { status: 'REJECTED', label: 'Reject', needsNote: true },
    { status: 'SUSPENDED', label: 'Suspend', needsNote: true },
  ].filter((a) => a.status !== approval && !(approval === 'REJECTED' && a.status === 'SUSPENDED'));

  async function decide(note: string) {
    if (!deciding) return;
    setApprovalErr('');
    try {
      await setApproval({ id: vehicleId, status: deciding.status, note: note || undefined }).unwrap();
      showToast(`Lorry marked ${deciding.status.toLowerCase()} — its drivers were notified`, 'success');
      setDeciding(null);
    } catch (e) {
      setApprovalErr(normalizeApiError(e).message);
    }
  }

  async function handleUpdate(values: Record<string, unknown>) {
    try {
      await updateVehicle({ id: vehicleId, body: values }).unwrap();
      vehicleQuery.refetch();
    } catch (err) {
      showToast(normalizeApiError(err).message, 'error');
    }
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
            <Stack direction="row" spacing={1}>
              <StatusChip value={approval} />
              <StatusChip value={vehicle.status} />
            </Stack>
          </Stack>
          {canEdit && (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="body2" color="text.secondary">GreenRoot check:</Typography>
              {approvalActions.map((a) => (
                <Button key={a.status} size="small" variant={a.status === 'APPROVED' ? 'contained' : 'outlined'}
                  onClick={() => { setApprovalErr(''); setDeciding(a); }}>
                  {a.label}
                </Button>
              ))}
              <Typography variant="caption" color="text.secondary">Only approved lorries can take trips.</Typography>
            </Stack>
          )}
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

      <Paper sx={{ p: 2 }} variant="outlined">
        <Typography variant="subtitle1" fontWeight={700} mb={1}>Drivers of this lorry</Typography>
        <VehicleLinksTable vehicleId={vehicleId} />
      </Paper>

      {deciding && (
        <DecisionDialog
          open
          title={`${deciding.label} lorry ${text(vehicle.vehicle_number)}`}
          needsNote={deciding.needsNote}
          busy={approvalState.isLoading}
          error={approvalErr}
          onCancel={() => setDeciding(null)}
          onConfirm={(note) => void decide(note)}
        />
      )}

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
