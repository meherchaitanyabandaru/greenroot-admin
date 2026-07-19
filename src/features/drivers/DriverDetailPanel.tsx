import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useGetDriverQuery,
  useUpdateDriverMutation,
  useGetDriverLatestTrackingQuery,
  useApproveDriverMutation,
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

function capability(record: Record<string, unknown>, key: string): boolean | undefined {
  const caps = record.capabilities;
  if (!caps || typeof caps !== 'object') return undefined;
  const value = (caps as Record<string, unknown>)[key];
  return typeof value === 'boolean' ? value : undefined;
}

function ApprovalStatusBadge({ status }: { status: unknown }) {
  const s = String(status ?? '').toUpperCase();
  const cfg: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
    APPROVED:  { label: 'Approved',  color: 'success' },
    PENDING:   { label: 'Pending',   color: 'warning' },
    REJECTED:  { label: 'Rejected',  color: 'error'   },
  };
  const c = cfg[s] ?? { label: s || 'Unknown', color: 'default' };
  return <Chip size="small" label={c.label} color={c.color} variant="outlined" />;
}

export function DriverDetailPanel({ driverId }: { driverId: number }) {
  const driverQuery = useGetDriverQuery(driverId);
  const latestQuery = useGetDriverLatestTrackingQuery(driverId);
  const [updateDriver, updateState] = useUpdateDriverMutation();
  const [approveDriver, approveState] = useApproveDriverMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approveError, setApproveError] = useState('');

  if (driverQuery.isLoading) return <LoadingState />;
  if (driverQuery.error)
    return <ErrorState message={normalizeApiError(driverQuery.error).message} onRetry={driverQuery.refetch} />;

  const driver = driverQuery.data?.driver ?? {};
  const latest = latestQuery.data?.tracking ?? null;
  const expiry = driver.license_expiry_date;

  const approvalStatus = String(driver.approval_status ?? '').toUpperCase();
  const canApprove = capability(driver, 'can_approve') ?? approvalStatus !== 'APPROVED';
  const canEdit = capability(driver, 'can_edit') ?? true;

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

  async function handleApprove() {
    try {
      setApproveError('');
      await approveDriver(driverId).unwrap();
      setConfirmOpen(false);
      driverQuery.refetch();
    } catch (e) {
      setApproveError(normalizeApiError(e).message);
    }
  }

  return (
    <Stack spacing={2}>
      {updateState.isError && (
        <Alert severity="error">{normalizeApiError(updateState.error).message}</Alert>
      )}

      <Paper sx={{ p: 2 }} variant="outlined">
        <Stack spacing={2}>
          {/* Header row */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography color="text.secondary" variant="body2">Driver</Typography>
              <Typography variant="h6">{text(driver.driver_name ?? driver.driver_code)}</Typography>
              <Typography color="text.secondary" variant="body2">{text(driver.driver_code)}</Typography>
            </Box>
            <Stack spacing={0.75} alignItems="flex-end">
              <StatusChip value={driver.status} />
            </Stack>
          </Stack>

          {/* Approval & Profile status row */}
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              bgcolor: approvalStatus === 'PENDING' ? '#FFFBEB' : approvalStatus === 'APPROVED' ? '#F0FDF4' : 'background.paper',
            }}
          >
            <Stack direction="row" spacing={3} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                    Approval Status
                  </Typography>
                  <ApprovalStatusBadge status={driver.approval_status} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                    Profile Status
                  </Typography>
                  <Chip
                    size="small"
                    label={text(driver.profile_status)}
                    variant="outlined"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
              </Stack>
              {canApprove && (
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<CheckCircleIcon fontSize="small" />}
                  onClick={() => setConfirmOpen(true)}
                  disabled={approveState.isLoading}
                >
                  Approve Driver
                </Button>
              )}
            </Stack>
          </Paper>

          {/* Detail fields */}
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

          {canEdit && (
            <>
              <Divider />
              <DriverForm
                initial={driver}
                loading={updateState.isLoading}
                onSubmit={handleUpdate}
              />
            </>
          )}
        </Stack>
      </Paper>

      {/* Location view (read-only) */}
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

      {/* Approve confirmation dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Approve Driver</DialogTitle>
        <DialogContent>
          {approveError && <Alert severity="error" sx={{ mb: 1 }}>{approveError}</Alert>}
          <Typography variant="body2">
            Approve <strong>{text(driver.driver_name ?? driver.driver_code)}</strong>? They will be able to accept dispatches on the platform.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} size="small">Cancel</Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            size="small"
            disabled={approveState.isLoading}
          >
            Confirm Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
