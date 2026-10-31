import { Alert, Box, Card, CardContent, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { PageHeader } from '../../components/page/PageHeader';
import { normalizeApiError } from '../../utils/apiError';
import { HEALTH, type PushWindow, useGetPushStatusQuery } from './pushApi';

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : 'Never');
const rate = (w: PushWindow) => {
  const tried = w.sent + w.failed;
  return tried ? `${Math.round((w.sent / tried) * 100)}%` : '-';
};

/** Admin → Push notifications: is Firebase set up (configuration), and are pushes reaching phones (delivery)? */
export function PushStatusPage() {
  const { data, isLoading, error, refetch } = useGetPushStatusQuery(undefined, { pollingInterval: 60_000 });
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />;
  const s = data.stats;
  const health = HEALTH[data.health] ?? HEALTH.NOT_CONFIGURED;
  return (
    <Box>
      <PageHeader title="Push notifications" description="Phone notifications through Firebase Cloud Messaging. Configuration and delivery are shown separately." />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" fontSize={13}>Configuration</Typography>
            <Stack direction="row" spacing={1} alignItems="center" my={1}>
              <Chip color={data.configured ? 'success' : 'default'} label={data.configured ? 'Firebase service account loaded' : 'No service account'} />
            </Stack>
            <Typography fontSize={13}>
              {data.configured
                ? `Firebase project: ${data.project_id || 'unknown'}`
                : 'Set FCM_SERVICE_ACCOUNT_JSON on the API server and restart it. The app\'s own Firebase file (google-services.json) is not enough: the server needs the service account to send.'}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" fontSize={13}>Delivery health (last 24 h)</Typography>
            <Stack direction="row" spacing={1} alignItems="center" my={1}>
              <Chip color={health.color} label={health.label} />
            </Stack>
            <Typography fontSize={13}>{health.detail}</Typography>
            <Typography fontSize={13} color="text.secondary" mt={1}>Last delivered: {when(s.last_sent_at)} · Last failure: {when(s.last_failed_at)}</Typography>
          </CardContent>
        </Card>
      </Stack>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography fontWeight={700} mb={1}>Registered phones</Typography>
          <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
            <Box><Typography variant="h5">{s.active_devices}</Typography><Typography fontSize={13} color="text.secondary">active devices</Typography></Box>
            <Box><Typography variant="h5">{s.users_with_active_device}</Typography><Typography fontSize={13} color="text.secondary">people with a device</Typography></Box>
            {Object.entries(s.active_devices_by_platform).map(([os, n]) => (
              <Box key={os}><Typography variant="h5">{n}</Typography><Typography fontSize={13} color="text.secondary">{os}</Typography></Box>
            ))}
            <Box><Typography variant="h5">{s.retired_devices}</Typography><Typography fontSize={13} color="text.secondary">retired (signed out or dead token)</Typography></Box>
          </Stack>
          <Typography fontSize={13} color="text.secondary" mt={1}>Last device seen: {when(s.last_device_seen_at)}</Typography>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography fontWeight={700} mb={1}>Delivery</Typography>
          <Table size="small">
            <TableHead>
              <TableRow><TableCell>Window</TableCell><TableCell align="right">Delivered</TableCell><TableCell align="right">Failed</TableCell><TableCell align="right">No phone signed in</TableCell><TableCell align="right">Success rate</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {([['Last 24 hours', s.last_24h], ['Last 7 days', s.last_7d]] as const).map(([label, w]) => (
                <TableRow key={label}>
                  <TableCell>{label}</TableCell>
                  <TableCell align="right">{w.sent}</TableCell>
                  <TableCell align="right">{w.failed}</TableCell>
                  <TableCell align="right">{w.no_device}</TableCell>
                  <TableCell align="right">{rate(w)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Alert severity="info">{data.note} “No phone signed in” is not a delivery failure.</Alert>
    </Box>
  );
}
