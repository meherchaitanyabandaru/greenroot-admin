import AddIcon from '@mui/icons-material/Add';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Button,
  Chip,
  Drawer,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useListResourceQuery } from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { SearchInput } from '../../components/forms/SearchInput';
import { PageHeader } from '../../components/page/PageHeader';
import { StatusChip } from '../../components/status/StatusChip';
import { SubscriptionCreateDrawer } from './SubscriptionCreateDrawer';
import { SubscriptionDetailPanel } from './SubscriptionDetailPanel';

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED'] as const;

function daysUntil(dateStr: unknown): number | null {
  if (!dateStr) return null;
  const ms = new Date(String(dateStr)).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 86400000));
}

function fmtDate(dateStr: unknown): string {
  if (!dateStr) return '—';
  return new Date(String(dateStr)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function DaysChip({ endDate }: { endDate: unknown }) {
  const days = daysUntil(endDate);
  if (days === null) return <Typography variant="body2" color="text.secondary">—</Typography>;
  if (days === 0) return <Chip size="small" label="Expired" sx={{ bgcolor: '#FEE2E2', color: '#C2410C', fontWeight: 700, fontSize: 11, height: 22 }} />;
  if (days <= 14) return <Chip size="small" label={`${days}d`} sx={{ bgcolor: '#FEF3C7', color: '#B7791F', fontWeight: 700, fontSize: 11, height: 22 }} />;
  if (days <= 30) return <Chip size="small" label={`${days}d`} sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 600, fontSize: 11, height: 22 }} />;
  return <Typography variant="body2" color="text.secondary">{days}d</Typography>;
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 140, borderRadius: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box sx={{ color, display: 'flex', p: 0.75, bgcolor: `${color}18`, borderRadius: 1.5 }}>{icon}</Box>
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export function SubscriptionsPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, error, refetch } = useListResourceQuery({
    resource: 'subscriptions',
    params: {
      page: page + 1,
      per_page: rowsPerPage,
      ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      ...(search ? { search } : {}),
    },
  });

  const rows = (data?.rows ?? []) as Record<string, unknown>[];
  const total = data?.pagination?.total ?? 0;

  const stats = {
    total: total as number,
    active: rows.filter((r) => r.subscription_status === 'ACTIVE').length,
    trial: rows.filter((r) => r.plan_code === 'TRIAL').length,
    expiring: rows.filter((r) => {
      const d = daysUntil(r.end_date);
      return d !== null && d <= 30 && r.subscription_status === 'ACTIVE';
    }).length,
    expired: rows.filter((r) => r.subscription_status === 'EXPIRED' || daysUntil(r.end_date) === 0).length,
  };

  if (error) return <ErrorState message="Failed to load subscriptions" onRetry={refetch} />;

  return (
    <Box>
      <PageHeader
        title="Subscriptions"
        description="Manage nursery subscription plans and billing"
        action={
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            New Subscription
          </Button>
        }
      />

      {/* Stats */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <StatCard icon={<AutorenewIcon fontSize="small" />} label="Total" value={isLoading ? 0 : stats.total} color="#6366F1" />
        <StatCard icon={<CheckCircleOutlineIcon fontSize="small" />} label="Active" value={isLoading ? 0 : stats.active} color="#16A34A" />
        <StatCard icon={<CalendarTodayIcon fontSize="small" />} label="Trial" value={isLoading ? 0 : stats.trial} color="#0891B2" />
        <StatCard icon={<WarningAmberIcon fontSize="small" />} label="Expiring ≤30d" value={isLoading ? 0 : stats.expiring} color="#D97706" />
        <StatCard icon={<ScheduleIcon fontSize="small" />} label="Expired" value={isLoading ? 0 : stats.expired} color="#DC2626" />
      </Stack>

      {/* Filters */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
        <Stack direction="row" spacing={0.75}>
          {STATUS_FILTERS.map((s) => (
            <Chip
              key={s}
              label={s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              size="small"
              onClick={() => { setStatusFilter(s); setPage(0); }}
              variant={statusFilter === s ? 'filled' : 'outlined'}
              color={statusFilter === s ? 'primary' : 'default'}
              sx={{ fontWeight: statusFilter === s ? 700 : 400, cursor: 'pointer' }}
            />
          ))}
        </Stack>
        <Box sx={{ ml: 'auto', minWidth: 220 }}>
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(0); }}
            placeholder="Search by code or user…"
          />
        </Box>
      </Stack>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              {['Code', 'User ID', 'Plan', 'Status', 'Days Left', 'End Date', 'Auto Renew', 'Created'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: 'text.secondary', py: 1.25 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><Skeleton variant="text" width={80} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : rows.length === 0
              ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary" variant="body2">No subscriptions found.</Typography>
                    </TableCell>
                  </TableRow>
                )
              : rows.map((row) => (
                  <TableRow
                    key={String(row.id)}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setSelectedId(Number(row.id))}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary.main" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {String(row.subscription_code ?? '—')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{String(row.user_id ?? '—')}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Typography variant="body2" fontWeight={500}>{String(row.plan_name ?? '—')}</Typography>
                        {row.plan_code === 'TRIAL' && (
                          <Chip size="small" label="Trial" sx={{ bgcolor: '#CFFAFE', color: '#0E7490', fontWeight: 700, fontSize: 10, height: 18 }} />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell><StatusChip value={row.subscription_status} /></TableCell>
                    <TableCell><DaysChip endDate={row.end_date} /></TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>{fmtDate(row.end_date)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color={row.auto_renew ? 'success.main' : 'text.disabled'} fontSize={12}>
                        {row.auto_renew ? 'Yes' : 'No'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>{fmtDate(row.created_at)}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={isLoading ? 0 : total as number}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </TableContainer>

      {/* Detail drawer */}
      <Drawer
        anchor="right"
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 560 }, p: 3, overflow: 'auto' } }}
      >
        {selectedId !== null && (
          <SubscriptionDetailPanel
            subscriptionId={selectedId}
            onClose={() => setSelectedId(null)}
            onMutated={refetch}
          />
        )}
      </Drawer>

      {/* Create drawer */}
      <SubscriptionCreateDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { refetch(); setCreateOpen(false); }}
      />
    </Box>
  );
}
