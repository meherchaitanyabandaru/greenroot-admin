import CloseIcon from '@mui/icons-material/Close';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import {
  Box,
  Chip,
  Divider,
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

type AuditRow = {
  id: number;
  module: string | null;
  entity_type: string | null;
  record_id: number | null;
  action_type: string | null;
  description: string | null;
  old_data: string | null;
  new_data: string | null;
  user_id: number | null;
  request_id: string | null;
  nursery_id: number | null;
  source_ip: string | null;
  user_agent: string | null;
  changed_at: string | null;
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
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

const ACTION_COLORS: Record<string, 'success' | 'primary' | 'error' | 'warning' | 'default'> = {
  CREATE: 'success',
  UPDATE: 'primary',
  DELETE: 'error',
  CANCEL: 'warning',
  APPROVE: 'success',
  REJECT: 'error',
  ASSIGN: 'primary',
  DISPATCH: 'primary',
  DELIVER: 'success',
  SUSPEND: 'warning',
  ACTIVATE: 'success',
  BLOCK: 'error',
  UNBLOCK: 'success',
};

// ─── Filter constants ─────────────────────────────────────────────────────────

const MODULE_OPTS = [
  'AUTH', 'USERS', 'NURSERIES', 'ORDERS', 'DISPATCHES', 'QUOTATIONS',
  'LOCAL_MARKET', 'REQUESTS', 'PLANTS', 'INVENTORY', 'PAYMENTS',
  'SUBSCRIPTIONS', 'SOURCING', 'DRIVERS', 'VEHICLES', 'INVITES', 'NOTIFICATIONS',
];

const ACTION_OPTS = [
  'CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'APPROVE', 'REJECT', 'CANCEL',
  'COMPLETE', 'DISPATCH', 'DELIVER', 'SUSPEND', 'ACTIVATE', 'BLOCK', 'UNBLOCK',
  'LOGIN', 'LOGOUT',
];

// ─── Diff drawer ─────────────────────────────────────────────────────────────

function DiffDrawer({
  row,
  open,
  onClose,
}: {
  row: AuditRow | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!row) return null;

  const oldJSON = prettyJSON(row.old_data);
  const newJSON = prettyJSON(row.new_data);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 560 }, p: 0 } }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between"
        sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box>
          <Typography fontWeight={600} fontSize={15}>
            {row.description || `${row.action_type ?? '—'} on ${row.entity_type ?? '—'} #${row.record_id ?? '—'}`}
          </Typography>
          <Typography fontSize={12} color="text.secondary" mt={0.25}>
            {formatDateTime(row.changed_at)}
            {row.user_id ? ` · User #${row.user_id}` : ''}
            {row.module ? ` · ${row.module}` : ''}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Box sx={{ px: 3, py: 2.5, overflowY: 'auto', flex: 1 }}>
        {/* Action badge */}
        <Stack direction="row" spacing={1} mb={2.5} flexWrap="wrap">
          {row.action_type && (
            <Chip
              label={row.action_type}
              size="small"
              color={ACTION_COLORS[row.action_type] ?? 'default'}
              variant="outlined"
            />
          )}
          {row.entity_type && (
            <Chip label={row.entity_type} size="small" variant="outlined" />
          )}
          {row.record_id != null && (
            <Chip label={`#${row.record_id}`} size="small" variant="outlined" />
          )}
        </Stack>

        {/* Before / After */}
        {(oldJSON || newJSON) && (
          <Stack spacing={2} mb={3}>
            {oldJSON && (
              <Box>
                <Typography fontSize={11} fontWeight={600} color="error.main" mb={0.75} letterSpacing={0.5}>
                  BEFORE
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0, p: 1.5, borderRadius: 1.5, fontSize: 12,
                    fontFamily: 'monospace', lineHeight: 1.6, overflowX: 'auto',
                    bgcolor: (t) => t.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                    border: '1px solid', borderColor: 'divider',
                    color: 'error.dark',
                  }}
                >
                  {oldJSON}
                </Box>
              </Box>
            )}
            {newJSON && (
              <Box>
                <Typography fontSize={11} fontWeight={600} color="success.main" mb={0.75} letterSpacing={0.5}>
                  AFTER
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0, p: 1.5, borderRadius: 1.5, fontSize: 12,
                    fontFamily: 'monospace', lineHeight: 1.6, overflowX: 'auto',
                    bgcolor: (t) => t.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                    border: '1px solid', borderColor: 'divider',
                    color: 'success.dark',
                  }}
                >
                  {newJSON}
                </Box>
              </Box>
            )}
            {!oldJSON && !newJSON && (
              <Typography fontSize={13} color="text.secondary">No change data recorded.</Typography>
            )}
          </Stack>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Metadata */}
        <Typography fontSize={11} fontWeight={600} color="text.secondary" mb={1.5} letterSpacing={0.5}>
          METADATA
        </Typography>
        <Stack spacing={0.75}>
          {[
            { label: 'Request ID', value: row.request_id },
            { label: 'Nursery ID', value: row.nursery_id != null ? `#${row.nursery_id}` : null },
            { label: 'Source IP', value: row.source_ip },
            { label: 'User Agent', value: row.user_agent },
          ].map(({ label, value }) =>
            value ? (
              <Stack key={label} direction="row" spacing={1} alignItems="flex-start">
                <Typography fontSize={12} color="text.secondary" sx={{ minWidth: 90, flexShrink: 0 }}>
                  {label}
                </Typography>
                <Typography
                  fontSize={12}
                  fontFamily={label === 'Request ID' || label === 'Source IP' ? 'monospace' : undefined}
                  sx={{ wordBreak: 'break-all' }}
                >
                  {value}
                </Typography>
              </Stack>
            ) : null,
          )}
        </Stack>
      </Box>
    </Drawer>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AuditLogsPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [module, setModule] = useState('');
  const [actionType, setActionType] = useState('');
  const [selectedRow, setSelectedRow] = useState<AuditRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isFetching, error, refetch } = useListResourceQuery({
    resource: 'audit',
    params: {
      page: page + 1,
      per_page: rowsPerPage,
      module: module || undefined,
      action_type: actionType || undefined,
    },
  });

  const rows = useMemo(() => (data?.rows ?? []) as unknown as AuditRow[], [data?.rows]);

  const columns = useMemo<ColumnDef<AuditRow>[]>(
    () => [
      {
        id: 'changed_at',
        header: 'When',
        cell: ({ row }) => (
          <Typography fontSize={12.5} color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            {formatDateTime(row.original.changed_at)}
          </Typography>
        ),
      },
      {
        id: 'user_id',
        header: 'By',
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
        id: 'module',
        header: 'Module',
        cell: ({ row }) =>
          row.original.module ? (
            <Typography fontSize={12} fontWeight={600} color="text.secondary">
              {row.original.module}
            </Typography>
          ) : (
            <Typography color="text.disabled" fontSize={13}>—</Typography>
          ),
      },
      {
        id: 'entity_type',
        header: 'Entity',
        cell: ({ row }) =>
          row.original.entity_type ? (
            <Typography fontSize={13}>{row.original.entity_type}</Typography>
          ) : (
            <Typography color="text.disabled" fontSize={13}>—</Typography>
          ),
      },
      {
        id: 'record_id',
        header: 'Record',
        cell: ({ row }) =>
          row.original.record_id != null ? (
            <Typography fontSize={12.5} fontFamily="monospace" color="text.secondary">
              #{row.original.record_id}
            </Typography>
          ) : (
            <Typography color="text.disabled" fontSize={13}>—</Typography>
          ),
      },
      {
        id: 'action_type',
        header: 'Action',
        cell: ({ row }) => {
          const action = row.original.action_type;
          if (!action) return <Typography color="text.disabled" fontSize={13}>—</Typography>;
          return (
            <Chip
              label={action}
              size="small"
              color={ACTION_COLORS[action] ?? 'default'}
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
            <Typography fontSize={13} sx={{ maxWidth: 300 }}>
              {row.original.description}
            </Typography>
          ) : (
            <Typography color="text.disabled" fontSize={13}>—</Typography>
          ),
      },
      {
        id: '_changes',
        header: '',
        cell: ({ row }) => {
          const hasData = row.original.old_data || row.original.new_data;
          return (
            <Tooltip title={hasData ? 'View changes' : 'No change data'}>
              <span>
                <IconButton
                  size="small"
                  disabled={!hasData && !row.original.description}
                  onClick={() => {
                    setSelectedRow(row.original);
                    setDrawerOpen(true);
                  }}
                >
                  <ManageSearchIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </span>
            </Tooltip>
          );
        },
      },
    ],
    [],
  );

  return (
    <Box>
      <PageHeader
        title="Audit Logs"
        description="Read-only platform activity. Every create, update, and delete across all modules."
      />

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
        <TextField
          select
          label="Module"
          value={module}
          size="small"
          sx={{ minWidth: 180 }}
          onChange={(e) => { setModule(e.target.value); setPage(0); }}
        >
          <MenuItem value="">All modules</MenuItem>
          {MODULE_OPTS.map((m) => (
            <MenuItem key={m} value={m}>{m}</MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Action"
          value={actionType}
          size="small"
          sx={{ minWidth: 160 }}
          onChange={(e) => { setActionType(e.target.value); setPage(0); }}
        >
          <MenuItem value="">All actions</MenuItem>
          {ACTION_OPTS.map((a) => (
            <MenuItem key={a} value={a}>{toLabel(a)}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {/* Table */}
      {isFetching && <TableSkeleton rows={10} cols={8} />}
      {error && <ErrorState message="Failed to load audit logs." onRetry={refetch} />}
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

      <DiffDrawer
        row={selectedRow}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedRow(null); }}
      />
    </Box>
  );
}
