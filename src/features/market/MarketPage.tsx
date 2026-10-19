import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import type { ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import {
  type MarketAd,
  type MarketReport,
  useListMarketAdsQuery,
  useListMarketReportsQuery,
  useReviewMarketReportMutation,
} from '../../api/adminResources';
import { AppDataTable } from '../../components/data-table/AppDataTable';
import { ErrorState } from '../../components/feedback/ErrorState';
import { TableSkeleton } from '../../components/feedback/LoadingState';
import { useToast } from '../../components/feedback/toastContext';
import { SearchInput } from '../../components/forms/SearchInput';
import { PageHeader } from '../../components/page/PageHeader';
import { StatusChip } from '../../components/status/StatusChip';
import { normalizeApiError } from '../../utils/apiError';
import { formatCurrency, toLabel } from '../../utils/labels';

const REPORT_FILTERS = [
  { value: 'PENDING', label: 'Waiting for review' },
  { value: 'REVIEWED', label: 'Action taken' },
  { value: 'DISMISSED', label: 'Dismissed' },
  { value: '', label: 'All' },
];

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * Admin → Local Market: the moderation queue for ads nurseries reported, and
 * the published ads themselves. Taking an ad down archives it; the reporting
 * nursery's report is closed either way.
 */
export function MarketPage() {
  const [tab, setTab] = useState<'reports' | 'ads'>('reports');
  return (
    <Box>
      <PageHeader title="Local Market" description="Nursery-to-nursery surplus ads. Review reported ads and take down the ones that break the rules." />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="reports" label="Reported ads" />
        <Tab value="ads" label="Published ads" />
      </Tabs>
      {tab === 'reports' ? <ReportsTab /> : <AdsTab />}
    </Box>
  );
}

function ReportsTab() {
  const { showToast } = useToast();
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [confirm, setConfirm] = useState<{ report: MarketReport; archive: boolean } | null>(null);
  const { data, isFetching, error, refetch } = useListMarketReportsQuery({ status: status || undefined, page: page + 1, per_page: rowsPerPage });
  const [review, reviewState] = useReviewMarketReportMutation();

  async function submit() {
    if (!confirm) return;
    await review({ id: confirm.report.id, status: confirm.archive ? 'REVIEWED' : 'DISMISSED', archive_ad: confirm.archive }).unwrap();
    showToast(confirm.archive ? 'Ad taken down and report closed' : 'Report dismissed');
    setConfirm(null);
  }

  const columns: ColumnDef<MarketReport>[] = [
    {
      id: '_ad',
      header: 'Ad',
      cell: ({ row }) => (
        <Box>
          <Typography fontSize={13.5} fontWeight={600}>{row.original.ad_title}</Typography>
          <Typography fontSize={12} color="text.secondary">
            {row.original.ad_code} · {row.original.ad_nursery_name}
          </Typography>
        </Box>
      ),
    },
    {
      id: '_reason',
      header: 'Reason',
      cell: ({ row }) => (
        <Box>
          <Chip size="small" label={toLabel(row.original.reason)} sx={{ height: 22, fontSize: 11 }} />
          {row.original.notes && <Typography fontSize={12} color="text.secondary" mt={0.5}>“{row.original.notes}”</Typography>}
        </Box>
      ),
    },
    {
      id: '_by',
      header: 'Reported by',
      cell: ({ row }) => (
        <Box>
          <Typography fontSize={13}>{row.original.reported_by_nursery_name}</Typography>
          <Typography fontSize={12} color="text.secondary">{row.original.reported_by_name ?? ''} · {formatDate(row.original.created_at)}</Typography>
        </Box>
      ),
    },
    { id: '_ad_status', header: 'Ad status', cell: ({ row }) => <StatusChip value={row.original.ad_status} /> },
    {
      id: '_status',
      header: 'Report',
      cell: ({ row }) => (
        <Box>
          <StatusChip value={row.original.status} />
          {row.original.reviewed_by_name && (
            <Typography fontSize={11.5} color="text.secondary" mt={0.5}>by {row.original.reviewed_by_name}</Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        row.original.status === 'PENDING' ? (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" onClick={() => setConfirm({ report: row.original, archive: false })}>Dismiss</Button>
            <Button size="small" color="error" variant="outlined" onClick={() => setConfirm({ report: row.original, archive: true })}>
              Take down ad
            </Button>
          </Stack>
        ) : null,
    },
  ];

  return (
    <>
      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
        {REPORT_FILTERS.map((f) => (
          <Chip
            key={f.value || 'all'}
            label={f.label}
            onClick={() => { setStatus(f.value); setPage(0); }}
            color={status === f.value ? 'primary' : 'default'}
            variant={status === f.value ? 'filled' : 'outlined'}
          />
        ))}
      </Stack>
      {isFetching && <TableSkeleton rows={5} cols={columns.length} />}
      {error && <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />}
      {!isFetching && !error && (
        <AppDataTable
          columns={columns}
          data={data?.reports ?? []}
          count={data?.pagination?.total ?? 0}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(0); }}
        />
      )}

      <Dialog open={confirm !== null} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{confirm?.archive ? 'Take down this ad?' : 'Dismiss this report?'}</DialogTitle>
        <DialogContent>
          {reviewState.error && <Alert severity="error" sx={{ mb: 1.5 }}>{normalizeApiError(reviewState.error).message}</Alert>}
          <Typography fontSize={14}>
            {confirm?.archive
              ? `“${confirm.report.ad_title}” by ${confirm.report.ad_nursery_name} will be archived and disappear from the market. The report is closed as action taken.`
              : `The ad stays published. The report from ${confirm?.report.reported_by_nursery_name} is closed as dismissed.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="contained" color={confirm?.archive ? 'error' : 'primary'} disabled={reviewState.isLoading} onClick={submit}>
            {confirm?.archive ? 'Take down' : 'Dismiss'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function AdsTab() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);
  const { data, isFetching, error, refetch } = useListMarketAdsQuery({ search: search || undefined, page: page + 1, per_page: rowsPerPage });

  const columns: ColumnDef<MarketAd>[] = [
    {
      id: '_title',
      header: 'Ad',
      cell: ({ row }) => (
        <Box>
          <Typography fontSize={13.5} fontWeight={600}>{row.original.title}</Typography>
          <Typography fontSize={12} color="text.secondary">{row.original.code} · {row.original.plant_name}</Typography>
        </Box>
      ),
    },
    {
      id: '_nursery',
      header: 'Nursery',
      cell: ({ row }) => (
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Typography fontSize={13}>{row.original.nursery_name}</Typography>
          {row.original.nursery_verified && <Chip size="small" color="success" variant="outlined" label="Verified" sx={{ height: 20, fontSize: 10.5 }} />}
        </Stack>
      ),
    },
    {
      id: '_price',
      header: 'Quantity · price',
      cell: ({ row }) =>
        `${row.original.quantity?.toLocaleString('en-IN') ?? '—'} · ${row.original.price_per_unit != null ? formatCurrency(row.original.price_per_unit) : '—'} ${row.original.price_unit ? toLabel(row.original.price_unit).toLowerCase() : ''}`,
    },
    { id: '_interest', header: 'Views · enquiries', cell: ({ row }) => `${row.original.view_count} · ${row.original.enquiry_count}` },
    { id: '_status', header: 'Status', cell: ({ row }) => <StatusChip value={row.original.status} /> },
    { id: '_expires', header: 'Expires', cell: ({ row }) => formatDate(row.original.expires_at) },
  ];

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search ads by title or plant" />
      </Paper>
      {isFetching && <TableSkeleton rows={5} cols={columns.length} />}
      {error && <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />}
      {!isFetching && !error && (
        <AppDataTable
          columns={columns}
          data={data?.ads ?? []}
          count={data?.total ?? 0}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(0); }}
        />
      )}
    </>
  );
}
