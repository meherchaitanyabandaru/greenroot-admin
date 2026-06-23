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
  useGetDispatchQuery,
  useUpdateDispatchStatusMutation,
  useAddDispatchItemMutation,
  useListDispatchTrackingQuery,
} from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { StatusChip } from '../../components/status/StatusChip';
import { normalizeApiError } from '../../utils/apiError';

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

const STATUS_FLOW: Record<string, string[]> = {
  PENDING: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
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

export function DispatchDetailPanel({ dispatchId }: { dispatchId: number }) {
  const dispatchQuery = useGetDispatchQuery(dispatchId);
  const trackingQuery = useListDispatchTrackingQuery(dispatchId);
  const [updateStatus, updateState] = useUpdateDispatchStatusMutation();
  const [tab, setTab] = useState(0);
  const [statusError, setStatusError] = useState('');

  if (dispatchQuery.isLoading) return <LoadingState />;
  if (dispatchQuery.error)
    return <ErrorState message={normalizeApiError(dispatchQuery.error).message} onRetry={dispatchQuery.refetch} />;

  const dispatch = dispatchQuery.data?.dispatch ?? {};
  const trackingPoints = trackingQuery.data?.tracking ?? [];
  const nextStatuses = STATUS_FLOW[String(dispatch.dispatch_status)] ?? [];

  const infoItems: Array<[string, unknown]> = [
    ['Order', dispatch.order_number],
    ['Dispatch No.', dispatch.dispatch_number],
    ['Vehicle', dispatch.vehicle_number],
    ['Driver ID', dispatch.driver_id],
    ['Dispatch Date', dispatch.dispatch_date],
    ['Delivery Date', dispatch.delivery_date],
    ['Destination', dispatch.destination_address],
    ['Notes', dispatch.notes],
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

  return (
    <Stack spacing={2}>
      {statusError && <Alert severity="error">{statusError}</Alert>}
      {updateState.isError && <Alert severity="error">{normalizeApiError(updateState.error).message}</Alert>}

      <Paper sx={{ p: 2 }} variant="outlined">
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography color="text.secondary" variant="body2">Dispatch</Typography>
              <Typography variant="h6">{text(dispatch.dispatch_code)}</Typography>
            </Box>
            <StatusChip value={dispatch.dispatch_status} />
          </Stack>

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
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tab label="Add Items" />
          <Tab label="Tracking" />
        </Tabs>

        {tab === 0 && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Add Item to Dispatch</Typography>
            <AddItemForm dispatchId={dispatchId} />
          </Paper>
        )}

        {tab === 1 && (
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
                        <TableCell>{text(pt.tracked_at)}</TableCell>
                        <TableCell>{text(pt.latitude)}</TableCell>
                        <TableCell>{text(pt.longitude)}</TableCell>
                        <TableCell>{text(pt.notes)}</TableCell>
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
    </Stack>
  );
}
