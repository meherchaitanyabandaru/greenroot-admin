import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Box,
  Chip,
  Drawer,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useListResourceQuery } from '../../api/adminResources';
import { AppDataTable } from '../../components/data-table/AppDataTable';
import { ErrorState } from '../../components/feedback/ErrorState';
import { TableSkeleton } from '../../components/feedback/LoadingState';
import { PageHeader } from '../../components/page/PageHeader';
import { toLabel } from '../../utils/labels';

// ─── Types ────────────────────────────────────────────────────────────────────

type SecurityLogRow = {
  id: number;
  event_type: string | null;
  description: string | null;
  user_id: number | null;
  nursery_id: number | null;
  request_id: string | null;
  ip_address: string | null;
  device_info: string | null;
  metadata: string | null;
  created_at: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

function prettyJSON(raw: string | null | undefined): string {
  if (!raw) return '';
  try { return JSON.stringify(JSON.parse(raw), null, 2); }
  catch { return raw; }
}

const EVENT_COLORS: Record<string, 'success' | 'error' | 'warning' | 'default' | 'primary'> = {
  LOGIN: 'success',
  LOGOUT: 'default',
  LOGIN_FAILED: 'error',
  TOKEN_REVOKED: 'warning',
  PERMISSION_DENIED: 'error',
  ACCOUNT_SUSPENDED: 'error',
  NURSERY_SUSPENDED: 'warning',
  SUBSCRIPTION_BLOCKED: 'warning',
  JWT_VALIDATION_FAILURE: 'error',
  ADMIN_OVERRIDE: 'primary',
};

const EVENT_TYPE_OPTS = [
  'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'TOKEN_REVOKED',
  'PERMISSION_DENIED', 'ACCOUNT_SUSPENDED', 'NURSERY_SUSPENDED',
  'SUBSCRIPTION_BLOCKED', 'JWT_VALIDATION_FAILURE', 'ADMIN_OVERRIDE',
];

// ─── Detail drawer ────────────────────────────────────────────────────────────

function DetailDrawer({
  row,
  open,
  onClose,
}: {
  row: SecurityLogRow | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!row) return null;

  const metaJSON = prettyJSON(row.metadata);
  const deviceJSON = prettyJSON(row.device_info);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 0 } }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between"
        sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={row.event_type ?? '—'}
              size="small"
              color={EVENT_COLORS[row.event_type ?? ''] ?? 'default'}
              sx={{ fontWeight: 700, fontSize: 11 }}
            />
          </Stack>
          <Typography fontSize={12} color="text.secondary" mt={0.5}>
            {formatDateTime(row.created_at)}
            {row.user_id ? ` · User #${row.user_id}` : ''}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Box sx={{ px: 3, py: 2.5, overflowY: 'auto' }}>
        {/* Description */}
        {row.description && (
          <Typography fontSize={14} mb={2.5}>{row.description}</Typography>
        )}

        {/* Key fields */}
        <Stack spacing={0.75} mb={3}>
          {[
            { label: 'User ID',    value: row.user_id != null ? `#${row.user_id}` : null },
            { label: 'Nursery ID', value: row.nursery_id != null ? `#${row.nursery_id}` : null },
            { label: 'Source IP',  value: row.ip_address },
            { label: 'Request ID', value: row.request_id },
          ].map(({ label, value }) =>
            value ? (
              <Stack key={label} direction="row" spacing={1} alignItems="flex-start">
                <Typography fontSize={12} color="text.secondary" sx={{ minWidth: 90, flexShrink: 0 }}>
                  {label}
                </Typography>
                <Typography
                  fontSize={12}
                  fontFamily="monospace"
                  sx={{ wordBreak: 'break-all' }}
                >
                  {value}
                </Typography>
              </Stack>
            ) : null,
          )}
        </Stack>

        {/* Device info */}
        {deviceJSON && (
          <Box mb={2.5}>
            <Typography fontSize={11} fontWeight={600} color="text.secondary" mb={0.75} letterSpacing={0.5}>
              DEVICE
            </Typography>
            <Box
              component="pre"
              sx={{
                m: 0, p: 1.5, borderRadius: 1.5, fontSize: 12,
                fontFamily: 'monospace', lineHeight: 1.6, overflowX: 'auto',
                bgcolor: (t) => t.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                border: '1px solid', borderColor: 'divider',
              }}
            >
              {deviceJSON}
            </Box>
          </Box>
        )}

        {/* Metadata */}
        {metaJSON && (
          <Box>
            <Typography fontSize={11} fontWeight={600} color="text.secondary" mb={0.75} letterSpacing={0.5}>
              METADATA
            </Typography>
            <Box
              component="pre"
              sx={{
                m: 0, p: 1.5, borderRadius: 1.5, fontSize: 12,
                fontFamily: 'monospace', lineHeight: 1.6, overflowX: 'auto',
                bgcolor: (t) => t.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                border: '1px solid', borderColor: 'divider',
              }}
            >
              {metaJSON}
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function SecurityLogsPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [eventType, setEventType] = useState('');
  const [selectedRow, setSelectedRow] = useState<SecurityLogRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isFetching, error, refetch } = useListResourceQuery({
    resource: 'securityLogs',
    params: {
      page: page + 1,
      per_page: rowsPerPage,
      event_type: eventType || undefined,
    },
  });

  const rows = useMemo(() => (data?.rows ?? []) as unknown as SecurityLogRow[], [data?.rows]);

  const columns = useMemo<ColumnDef<SecurityLogRow>[]>(
    () => [
      {
        id: 'created_at',
        header: 'When',
        cell: ({ row }) => (
          <Typography fontSize={12.5} color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            {formatDateTime(row.original.created_at)}
          </Typography>
        ),
      },
      {
        id: 'user_id',
        header: 'User',
        cell: ({ row }) =>
          row.original.user_id != null ? (
            <Typography
              fontSize={12}
              fontFamily="monospace"
              sx={{
                display: 'inline-block', bgcolor: 'background.default',
                px: 0.75, py: 0.25, borderRadius: 1,
                border: '1px solid', borderColor: 'divider',
              }}
            >
              #{row.original.user_id}
            </Typography>
          ) : (
            <Typography color="text.disabled" fontSize={13}>—</Typography>
          ),
      },
      {
        id: 'event_type',
        header: 'Event',
        cell: ({ row }) => {
          const ev = row.original.event_type;
          if (!ev) return <Typography color="text.disabled" fontSize={13}>—</Typography>;
          return (
            <Chip
              label={toLabel(ev)}
              size="small"
              color={EVENT_COLORS[ev] ?? 'default'}
              sx={{ height: 20, fontSize: 11, fontWeight: 700, '& .MuiChip-label': { px: 1 } }}
            />
          );
        },
      },
      {
        id: 'description',
        header: 'Description',
        cell: ({ row }) =>
          row.original.description ? (
            <Typography fontSize={13}>{row.original.description}</Typography>
          ) : (
            <Typography color="text.disabled" fontSize={13}>—</Typography>
          ),
      },
      {
        id: 'ip_address',
        header: 'Source IP',
        cell: ({ row }) =>
          row.original.ip_address ? (
            <Typography fontSize={12} fontFamily="monospace" color="text.secondary">
              {row.original.ip_address}
            </Typography>
          ) : (
            <Typography color="text.disabled" fontSize={13}>—</Typography>
          ),
      },
      {
        id: '_detail',
        header: '',
        cell: ({ row }) => (
          <Tooltip title="View details">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedRow(row.original);
                setDrawerOpen(true);
              }}
            >
              <InfoOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [],
  );

  return (
    <Box>
      <PageHeader
        title="Security Logs"
        description="Auth events: logins, failures, token revocations, permission denials."
      />

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
        <TextField
          select
          label="Event type"
          value={eventType}
          size="small"
          sx={{ minWidth: 220 }}
          onChange={(e) => { setEventType(e.target.value); setPage(0); }}
        >
          <MenuItem value="">All events</MenuItem>
          {EVENT_TYPE_OPTS.map((e) => (
            <MenuItem key={e} value={e}>{toLabel(e)}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {/* Table */}
      {isFetching && <TableSkeleton rows={10} cols={6} />}
      {error && <ErrorState message="Failed to load security logs." onRetry={refetch} />}
      {!isFetching && !error && (
        <AppDataTable
          columns={columns as ColumnDef<Record<string, unknown>>[]}
          data={rows as unknown as Record<string, unknown>[]}
          count={data?.pagination?.total ?? rows.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(0); }}
        />
      )}

      <DetailDrawer
        row={selectedRow}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedRow(null); }}
      />
    </Box>
  );
}
