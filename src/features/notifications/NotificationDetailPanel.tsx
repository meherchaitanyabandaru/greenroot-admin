import DoneAllIcon from '@mui/icons-material/DoneAll';
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
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useGetNotificationQuery,
  useMarkNotificationReadMutation,
  useDeleteNotificationMutation,
} from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { StatusChip } from '../../components/status/StatusChip';
import { normalizeApiError } from '../../utils/apiError';

function text(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function formatTs(value: unknown) {
  if (!value) return '—';
  try { return new Date(String(value)).toLocaleString(); } catch { return String(value); }
}

function ChannelChip({ channel }: { channel: unknown }) {
  const c = String(channel ?? '').toUpperCase();
  const color: Record<string, 'primary' | 'secondary' | 'default'> = {
    PUSH: 'primary', SMS: 'secondary', EMAIL: 'default',
  };
  return <Chip size="small" label={c || '—'} color={color[c] ?? 'default'} variant="outlined" />;
}

export function NotificationDetailPanel({
  notificationId,
  onDeleted,
}: {
  notificationId: number;
  onDeleted?: () => void;
}) {
  const { data, isLoading, error, refetch } = useGetNotificationQuery(notificationId);
  const [markRead, markReadState] = useMarkNotificationReadMutation();
  const [deleteNotif, deleteState] = useDeleteNotificationMutation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState('');

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />;

  const n = data?.notification ?? {};
  const isRead = String(n.notification_status ?? '').toUpperCase() === 'READ';

  async function handleMarkRead() {
    try {
      setActionError('');
      await markRead(notificationId).unwrap();
      refetch();
    } catch (e) {
      setActionError(normalizeApiError(e).message);
    }
  }

  async function handleDelete() {
    try {
      setActionError('');
      await deleteNotif(notificationId).unwrap();
      setConfirmDelete(false);
      onDeleted?.();
    } catch (e) {
      setActionError(normalizeApiError(e).message);
    }
  }

  const detailItems: Array<[string, unknown]> = [
    ['Code', n.notification_code],
    ['Type', n.notification_type],
    ['User ID', n.user_id],
    ['Template ID', n.template_id],
    ['Channel', null],
    ['Sent At', formatTs(n.sent_at)],
    ['Read At', formatTs(n.read_at)],
    ['Created At', formatTs(n.created_at)],
  ];

  return (
    <Stack spacing={2}>
      {actionError && <Alert severity="error">{actionError}</Alert>}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography color="text.secondary" variant="body2">Notification</Typography>
              <Typography variant="h6">{text(n.title ?? n.notification_type)}</Typography>
              <Typography color="text.secondary" variant="body2" fontFamily="monospace" fontSize={11.5}>
                {text(n.notification_code)}
              </Typography>
            </Box>
            <Stack spacing={0.75} alignItems="flex-end">
              <StatusChip value={n.notification_status} />
              <ChannelChip channel={n.channel} />
            </Stack>
          </Stack>

          {/* Message body */}
          {n.message && (
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                Message
              </Typography>
              <Typography variant="body2">{String(n.message)}</Typography>
            </Paper>
          )}

          {/* Detail fields */}
          <Grid container spacing={1.5}>
            {detailItems.map(([label, value]) => (
              <Grid key={String(label)} size={{ xs: 12, sm: 6 }}>
                <Typography color="text.secondary" variant="caption">{label}</Typography>
                {label === 'Channel' ? (
                  <Box mt={0.25}><ChannelChip channel={n.channel} /></Box>
                ) : (
                  <Typography variant="body2">{text(value)}</Typography>
                )}
              </Grid>
            ))}
          </Grid>

          {/* Data payload */}
          {n.data && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Data payload</Typography>
              <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'background.default' }}>
                <Typography variant="body2" fontFamily="monospace" fontSize={11.5} sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {typeof n.data === 'string' ? n.data : JSON.stringify(n.data, null, 2)}
                </Typography>
              </Paper>
            </Box>
          )}

          <Divider />

          {/* Actions */}
          <Stack direction="row" spacing={1}>
            {!isRead && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<DoneAllIcon fontSize="small" />}
                onClick={handleMarkRead}
                disabled={markReadState.isLoading}
              >
                Mark as Read
              </Button>
            )}
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Delete confirm */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Notification</DialogTitle>
        <DialogContent>
          {actionError && <Alert severity="error" sx={{ mb: 1 }}>{actionError}</Alert>}
          <Typography variant="body2">
            Permanently delete notification <strong>{text(n.notification_code)}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteState.isLoading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
