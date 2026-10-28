import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
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
  Tooltip,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import MapIcon from '@mui/icons-material/Map';
import { useState } from 'react';
import {
  useGetDispatchQuery,
  useUpdateDispatchStatusMutation,
  useAddDispatchItemMutation,
  useListDispatchTrackingQuery,
  useGetLiveDriverLocationQuery,
} from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { StatusChip } from '../../components/status/StatusChip';
import { useToast } from '../../components/feedback/toastContext';
import { normalizeApiError } from '../../utils/apiError';
import { formatDateTime } from '../../utils/labels';

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

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed !== 0 ? parsed : null;
}

function formatAgo(value: unknown) {
  if (!value) return '—';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  const diff = Date.now() - date.getTime();
  if (diff < 10_000) return 'just now';
  if (diff < 60_000) return `${Math.max(1, Math.floor(diff / 1000))} sec ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  return formatDateTime(date.toISOString());
}

function osmEmbedUrl(lat: number, lng: number) {
  const pad = 0.015;
  const bbox = [
    lng - pad,
    lat - pad,
    lng + pad,
    lat + pad,
  ].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

// Mirrors CanTransition in the API (dispatches/policy.go). DELIVERED is never
// a status change: it needs the customer's code or the nursery's reason.
const STATUS_FLOW: Record<string, string[]> = {
  PENDING: ['DISPATCHED', 'CANCELLED'],
  ACCEPTED: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['IN_TRANSIT'],
  IN_TRANSIT: [],
  DELIVERED: [],
  CANCELLED: [],
};

const CONFIRMATION_LABEL: Record<string, string> = {
  CUSTOMER_CODE: "Confirmed with the customer's code",
  CUSTOMER_APP: 'Confirmed by the customer in the app',
  UNCONFIRMED: 'Not confirmed by the customer (nursery override)',
};

function AddItemForm({ dispatchId }: { dispatchId: number }) {
  const [plantName, setPlantName] = useState('');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [addItem, state] = useAddDispatchItemMutation();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!plantName || !qty) { setError('Plant name and quantity are required.'); return; }
    try {
      setError('');
      setSuccess(false);
      await addItem({
        dispatchId,
        body: { plant_name: plantName, quantity: Number(qty), notes: notes || undefined },
      }).unwrap();
      setPlantName('');
      setQty('');
      setNotes('');
      setSuccess(true);
    } catch (e) {
      setError(normalizeApiError(e).message);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 1 }}>Item added.</Alert>}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <TextField size="small" label="Plant Name" value={plantName} onChange={(e) => setPlantName(e.target.value)} sx={{ minWidth: 160 }} required />
        <TextField size="small" label="Qty" type="number" value={qty} onChange={(e) => setQty(e.target.value)} sx={{ width: 80 }} required inputProps={{ min: 0.01, step: 0.01 }} />
        <TextField size="small" label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ minWidth: 140 }} />
        <Button type="submit" variant="contained" size="small" disabled={state.isLoading}>
          {state.isLoading ? <CircularProgress size={14} /> : 'Add Item'}
        </Button>
      </Stack>
    </Box>
  );
}

function DispatchLiveMapDialog({
  open,
  onClose,
  dispatch,
  trackingPoints,
}: {
  open: boolean;
  onClose: () => void;
  dispatch: Record<string, unknown>;
  trackingPoints: Record<string, unknown>[];
}) {
  const driverUserId = numberValue(dispatch.driver_user_id);
  const isInTransit = String(dispatch.dispatch_status) === 'IN_TRANSIT';
  const liveQuery = useGetLiveDriverLocationQuery(driverUserId ?? 0, {
    skip: !open || !isInTransit || !driverUserId,
    pollingInterval: open && isInTransit ? 10000 : 0,
  });

  const live = liveQuery.data?.location ?? null;
  const latestPersisted = trackingPoints[0] ?? null;
  const lat =
    numberValue(live?.latitude) ?? numberValue(latestPersisted?.latitude);
  const lng =
    numberValue(live?.longitude) ?? numberValue(latestPersisted?.longitude);
  const lastSeen = live?.last_seen ?? latestPersisted?.tracked_at;
  const source = live ? 'Live location' : latestPersisted ? 'Last known location' : 'No location yet';
  const mapUrl = lat && lng ? osmEmbedUrl(lat, lng) : null;
  const googleLink = lat && lng ? mapsLink(lat, lng) : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MapIcon color="primary" />
        Live Dispatch Map
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={`Dispatch ${text(dispatch.dispatch_code)}`} size="small" />
            <Chip label={`Status ${text(dispatch.dispatch_status)}`} size="small" color={isInTransit ? 'success' : 'default'} />
            <Chip label={`Driver ${text(dispatch.driver_name ?? dispatch.driver_user_id)}`} size="small" variant="outlined" />
            <Chip label={source} size="small" color={live ? 'success' : 'warning'} variant="outlined" />
          </Stack>

          {!isInTransit && (
            <Alert severity="info">Live location shows only while the trip is on the way.</Alert>
          )}

          {liveQuery.error && (
            <Alert severity="warning">Could not load the live location. Showing the last known location.</Alert>
          )}

          {mapUrl ? (
            <Box>
              <Box
                component="iframe"
                title="Dispatch live OpenStreetMap"
                src={mapUrl}
                sx={{
                  width: '100%',
                  height: 420,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1.5 }} alignItems={{ sm: 'center' }}>
                <Typography variant="body2">
                  <strong>Current location:</strong> {lat!.toFixed(6)}, {lng!.toFixed(6)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Updated {formatAgo(lastSeen)}
                </Typography>
                {googleLink && (
                  <Link href={googleLink} target="_blank" rel="noopener" variant="body2">
                    Open in Google Maps
                  </Link>
                )}
              </Stack>
            </Box>
          ) : (
            <Alert severity="warning">
              No live or persisted location is available for this dispatch yet. Ask the driver app to refresh location while the trip is IN_TRANSIT.
            </Alert>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export function DispatchDetailPanel({ dispatchId }: { dispatchId: number }) {
  const { showToast } = useToast();
  const dispatchQuery = useGetDispatchQuery(dispatchId);
  const trackingQuery = useListDispatchTrackingQuery(dispatchId, { pollingInterval: 30000 });
  const [updateStatus, updateState] = useUpdateDispatchStatusMutation();
  const [tab, setTab] = useState(0);
  const [statusError, setStatusError] = useState('');
  const [mapOpen, setMapOpen] = useState(false);

  if (dispatchQuery.isLoading) return <LoadingState />;
  if (dispatchQuery.error)
    return <ErrorState message={normalizeApiError(dispatchQuery.error).message} onRetry={dispatchQuery.refetch} />;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dispatch: any = dispatchQuery.data?.dispatch ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trackingPoints: any[] = trackingQuery.data?.tracking ?? [];
  const nextStatuses: string[] = STATUS_FLOW[String(dispatch.dispatch_status)] ?? [];

  const canAddItems = dispatch.capabilities?.can_add_items === true;

  const infoItems: Array<[string, unknown]> = [
    ['Order', dispatch.order_number],
    ['Dispatch No.', dispatch.dispatch_number],
    ['Vehicle', dispatch.vehicle_number],
    ['Driver', [dispatch.driver_name, dispatch.driver_mobile].filter(Boolean).join(' · ') || null],
    // When each step happened (recorded since 2026-10-28; older trips have no accept/start time).
    ['Trip created', formatDateTime(dispatch.created_at)],
    ['Driver accepted', dispatch.driver_accepted_at ? formatDateTime(dispatch.driver_accepted_at) : null],
    ['Left the nursery', dispatch.dispatch_date ? formatDateTime(dispatch.dispatch_date) : null],
    ['Trip started', dispatch.trip_started_at ? formatDateTime(dispatch.trip_started_at) : null],
    ['Delivered', dispatch.delivery_date ? formatDateTime(dispatch.delivery_date) : null],
    ['Destination', dispatch.destination_address],
    ['Notes', dispatch.notes],
    // Delivery details, only when the trip has them.
    ...([
      ['Outside lorry', dispatch.is_outside_transport
        ? [dispatch.outside_vehicle_number, dispatch.outside_driver_name, dispatch.outside_driver_mobile].filter(Boolean).join(' · ')
        : null],
      ['Delivery confirmation', CONFIRMATION_LABEL[String(dispatch.delivery_confirmation)] ?? null],
      ['Override reason', dispatch.delivery_override_reason],
      ['Customer reported a problem', dispatch.delivery_issue],
    ] as Array<[string, unknown]>).filter(([, value]) => value != null && value !== ''),
  ];

  async function handleStatus(newStatus: string) {
    try {
      setStatusError('');
      await updateStatus({ id: dispatchId, body: { dispatch_status: newStatus } }).unwrap();
      dispatchQuery.refetch();
    } catch (e) {
      setStatusError(normalizeApiError(e).message);
    }
  }

  async function copyToClipboard(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      showToast(`${label} copied`, 'success');
    } catch {
      showToast(`Could not copy ${label.toLowerCase()}`, 'error');
    }
  }

  return (
    <Stack spacing={2}>
      {statusError && <Alert severity="error">{statusError}</Alert>}
      {updateState.isError && <Alert severity="error">{normalizeApiError(updateState.error).message}</Alert>}

      <Paper sx={{ p: 2 }} variant="outlined">
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography color="text.secondary" variant="body2">Dispatch</Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="h6">{text(dispatch.dispatch_code)}</Typography>
                <Tooltip title="Copy dispatch code">
                  <IconButton size="small" onClick={() => copyToClipboard(dispatch.dispatch_code, 'Dispatch code')}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
            <StatusChip value={dispatch.dispatch_status} />
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              startIcon={<MapIcon />}
              variant={dispatch.dispatch_status === 'IN_TRANSIT' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setMapOpen(true)}
            >
              View Live Map
            </Button>
            {trackingQuery.isFetching && (
              <Chip label="Refreshing tracking…" size="small" variant="outlined" />
            )}
          </Stack>

          {/* Tracking UUID row */}
          {dispatch.trip_uuid && (
            <Box sx={{ bgcolor: 'grey.50', borderRadius: 1, px: 1.5, py: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <QrCode2Icon fontSize="small" color="action" />
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">Trip Tracking UUID</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
                    {dispatch.trip_uuid}
                  </Typography>
                </Box>
                <Tooltip title="Copy tracking UUID">
                  <IconButton size="small" onClick={() => copyToClipboard(String(dispatch.trip_uuid), 'Tracking UUID')}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          )}

          {!dispatch.trip_uuid && (
            <Chip
              label="No tracking UUID linked yet"
              size="small"
              variant="outlined"
              color="default"
              icon={<QrCode2Icon />}
              sx={{ alignSelf: 'flex-start', opacity: 0.6 }}
            />
          )}

          <Grid container spacing={1.5}>
            {infoItems.map(([label, value]) => (
              <Grid key={String(label)} size={{ xs: 12, sm: 6 }}>
                <Typography color="text.secondary" variant="caption">{label}</Typography>
                <Typography variant="body2">{text(value)}</Typography>
              </Grid>
            ))}
          </Grid>

          {nextStatuses.length > 0 && (
            <>
              <Divider />
              <Stack direction="row" spacing={1}>
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    variant={s === 'CANCELLED' ? 'outlined' : 'contained'}
                    color={s === 'CANCELLED' ? 'error' : 'primary'}
                    size="small"
                    disabled={updateState.isLoading}
                    onClick={() => handleStatus(s)}
                  >
                    {updateState.isLoading ? <CircularProgress size={14} /> : `Mark ${s.replace('_', ' ')}`}
                  </Button>
                ))}
              </Stack>
            </>
          )}
        </Stack>
      </Paper>

      <Box>
        {/* Items can be added only while the trip is open. */}
        <Tabs value={canAddItems ? tab : 1} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          {canAddItems && <Tab label="Add Items" value={0} />}
          <Tab label="Tracking" value={1} />
        </Tabs>

        {canAddItems && tab === 0 && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Add Item to Dispatch</Typography>
            <AddItemForm dispatchId={dispatchId} />
          </Paper>
        )}

        {(tab === 1 || !canAddItems) && (
          <Stack spacing={1.5}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
                <Box>
                  <Typography variant="subtitle2">Dispatch Tracking</Typography>
                  <Typography color="text.secondary" variant="body2">
                    See where the lorry is while the trip is on the way.
                  </Typography>
                </Box>
                <Button startIcon={<MapIcon />} variant="contained" size="small" onClick={() => setMapOpen(true)}>
                  View Live Map
                </Button>
              </Stack>
            </Paper>

            <Paper variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Time', 'Latitude', 'Longitude', 'Notes', 'Map'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trackingPoints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography color="text.secondary" variant="body2">No tracking points.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    trackingPoints.map((pt, i) => {
                      const link = mapsLink(pt.latitude, pt.longitude);
                      return (
                        <TableRow key={i}>
                          <TableCell>{formatAgo(pt.tracked_at)}</TableCell>
                          <TableCell>{text(pt.latitude)}</TableCell>
                          <TableCell>{text(pt.longitude)}</TableCell>
                          <TableCell>{text(pt.notes)}</TableCell>
                          <TableCell>
                            {link ? (
                              <Button size="small" variant="text" onClick={() => setMapOpen(true)}>
                                View Map
                              </Button>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Stack>
        )}
      </Box>

      <DispatchLiveMapDialog
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        dispatch={dispatch}
        trackingPoints={trackingPoints}
      />
    </Stack>
  );
}
