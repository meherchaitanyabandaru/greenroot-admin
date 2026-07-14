import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
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
import MapIcon from '@mui/icons-material/Map';
import { useEffect, useState } from 'react';
import {
  useGetLiveDriverLocationQuery,
  useListDispatchTrackingQuery,
  useListResourceQuery,
} from '../../api/adminResources';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { PageHeader } from '../../components/page/PageHeader';
import { normalizeApiError } from '../../utils/apiError';

function text(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
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
  return date.toLocaleString();
}

function osmEmbedUrl(lat: number, lng: number) {
  const pad = 0.015;
  const bbox = [lng - pad, lat - pad, lng + pad, lat + pad].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

function mapsLink(lat: unknown, lng: unknown) {
  const la = numberValue(lat);
  const lo = numberValue(lng);
  if (!la || !lo) return null;
  return `https://maps.google.com/?q=${la},${lo}`;
}

function LiveMapDialog({
  open,
  onClose,
  dispatch,
  lat,
  lng,
  lastSeen,
  source,
}: {
  open: boolean;
  onClose: () => void;
  dispatch: Record<string, unknown>;
  lat: number | null;
  lng: number | null;
  lastSeen: unknown;
  source: string;
}) {
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
            <Typography variant="body2"><strong>Dispatch:</strong> {text(dispatch.dispatch_code)}</Typography>
            <Typography variant="body2"><strong>Order:</strong> {text(dispatch.order_number)}</Typography>
            <Typography variant="body2"><strong>Source:</strong> {source}</Typography>
          </Stack>
          {mapUrl ? (
            <>
              <Box
                component="iframe"
                title="Admin dispatch live map"
                src={mapUrl}
                sx={{
                  width: '100%',
                  height: 420,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                <Typography variant="body2">{lat!.toFixed(6)}, {lng!.toFixed(6)}</Typography>
                <Typography variant="body2" color="text.secondary">Updated {formatAgo(lastSeen)}</Typography>
                {googleLink && (
                  <Link href={googleLink} target="_blank" rel="noopener" variant="body2">
                    Open in Google Maps
                  </Link>
                )}
              </Stack>
            </>
          ) : (
            <Alert severity="warning">No Redis GEO or persisted tracking location is available yet.</Alert>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function LatestLocation({ dispatch }: { dispatch: Record<string, unknown> }) {
  const driverUserId = numberValue(dispatch.driver_user_id);
  const dispatchId = numberValue(dispatch.id);
  const liveQuery = useGetLiveDriverLocationQuery(driverUserId ?? 0, {
    skip: !driverUserId,
    pollingInterval: 10000,
  });
  const trackingQuery = useListDispatchTrackingQuery(dispatchId ?? 0, {
    skip: !dispatchId,
    pollingInterval: 30000,
  });
  const [mapOpen, setMapOpen] = useState(false);

  const live = liveQuery.data?.location ?? null;
  const latestPersisted = trackingQuery.data?.tracking?.[0] ?? null;
  const lat = numberValue(live?.latitude) ?? numberValue(latestPersisted?.latitude);
  const lng = numberValue(live?.longitude) ?? numberValue(latestPersisted?.longitude);
  const lastSeen = live?.last_seen ?? latestPersisted?.tracked_at;
  const source = live ? 'Redis GEO' : latestPersisted ? 'Persisted tracking' : 'No location';

  if (!driverUserId) {
    return <Typography color="text.secondary" variant="body2">No driver user</Typography>;
  }

  if (!lat || !lng) {
    return <Typography color="text.secondary" variant="body2">Waiting for live location…</Typography>;
  }

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Typography variant="body2">{lat.toFixed(5)}, {lng.toFixed(5)}</Typography>
        <Typography color="text.secondary" variant="caption">{source} · {formatAgo(lastSeen)}</Typography>
        <Button size="small" variant="outlined" startIcon={<MapIcon />} onClick={() => setMapOpen(true)}>
          View Map
        </Button>
      </Stack>
      <LiveMapDialog
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        dispatch={dispatch}
        lat={lat}
        lng={lng}
        lastSeen={lastSeen}
        source={source}
      />
    </>
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
                      <LatestLocation dispatch={d} />
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
