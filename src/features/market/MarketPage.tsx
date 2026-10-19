import {
  Alert,
  Avatar,
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
  { value: 'REVIEWED', label: 'Removed' },
  { value: 'DISMISSED', label: 'Dismissed' },
  { value: '', label: 'All' },
];

/** What removing one more ad does to the seller (mirrors the API's blockDays). */
function penaltyFor(strikesAfter: number) {
  if (strikesAfter >= 3) return `Strike ${strikesAfter}: posting blocked for 90 days. Consider suspending the nursery from Nurseries.`;
  if (strikesAfter === 2) return 'Strike 2: posting blocked for 30 days.';
  return 'Strike 1: a warning. The nursery can keep posting.';
}

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
      <PageHeader title="Local Market" description="Nursery-to-nursery surplus ads. Ads reported for explicit images or banned items are hidden at once; check the photos, then restore or remove." />
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
  const [confirm, setConfirm] = useState<{ report: MarketReport; remove: boolean } | null>(null);
  const { data, isFetching, error, refetch } = useListMarketReportsQuery({ status: status || undefined, page: page + 1, per_page: rowsPerPage });
  const [review, reviewState] = useReviewMarketReportMutation();

  async function submit() {
    if (!confirm) return;
    const res = await review({ id: confirm.report.id, decision: confirm.remove ? 'REMOVE' : 'DISMISS' }).unwrap();
    if (confirm.remove) {
      const blocked = res.outcome.blocked_until ? `, posting blocked until ${formatDate(res.outcome.blocked_until)}` : '';
      showToast(`Ad removed. ${confirm.report.ad_nursery_name} has ${res.outcome.strikes} strike${res.outcome.strikes === 1 ? '' : 's'}${blocked}`);
    } else {
      showToast(confirm.report.ad_status === 'SUSPENDED' ? 'Report dismissed and ad restored' : 'Report dismissed');
    }
    setConfirm(null);
  }

  const columns: ColumnDef<MarketReport>[] = [
    {
      id: '_ad',
      header: 'Ad',
      cell: ({ row }) => (
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Avatar variant="rounded" src={row.original.ad_photos[0]} sx={{ width: 44, height: 44 }}>
            {row.original.ad_title[0]}
          </Avatar>
          <Box>
            <Typography fontSize={13.5} fontWeight={600}>{row.original.ad_title}</Typography>
            <Typography fontSize={12} color="text.secondary">
              {row.original.ad_code} · {row.original.ad_nursery_name}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      id: '_reason',
      header: 'Reason',
      cell: ({ row }) => (
        <Box>
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            <Chip size="small" label={toLabel(row.original.reason)} sx={{ height: 22, fontSize: 11 }} />
            {row.original.serious && <Chip size="small" color="error" label="Hidden until reviewed" sx={{ height: 22, fontSize: 11 }} />}
          </Stack>
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
    {
      id: '_history',
      header: 'Seller history',
      cell: ({ row }) => (
        <Box>
          <Chip
            size="small"
            color={row.original.ad_nursery_strikes >= 2 ? 'error' : row.original.ad_nursery_strikes === 1 ? 'warning' : 'default'}
            label={`${row.original.ad_nursery_strikes} strike${row.original.ad_nursery_strikes === 1 ? '' : 's'}`}
            sx={{ height: 22, fontSize: 11 }}
          />
          {row.original.ad_nursery_blocked_until && (
            <Typography fontSize={11.5} color="error.main" mt={0.5}>Blocked until {formatDate(row.original.ad_nursery_blocked_until)}</Typography>
          )}
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
            <Button size="small" onClick={() => setConfirm({ report: row.original, remove: false })}>
              {row.original.ad_status === 'SUSPENDED' ? 'Restore ad' : 'Dismiss'}
            </Button>
            <Button size="small" color="error" variant="outlined" onClick={() => setConfirm({ report: row.original, remove: true })}>
              Remove ad
            </Button>
          </Stack>
        ) : null,
    },
  ];

  const report = confirm?.report;
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

      <Dialog open={confirm !== null} onClose={() => setConfirm(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{confirm?.remove ? 'Remove this ad?' : report?.ad_status === 'SUSPENDED' ? 'Restore this ad?' : 'Dismiss this report?'}</DialogTitle>
        <DialogContent>
          {reviewState.error && <Alert severity="error" sx={{ mb: 1.5 }}>{normalizeApiError(reviewState.error).message}</Alert>}
          {report && (
            <Stack spacing={1.5}>
              <Box>
                <Typography fontWeight={700}>{report.ad_title}</Typography>
                <Typography fontSize={13} color="text.secondary">
                  {report.ad_nursery_name} · reported for {toLabel(report.reason).toLowerCase()}
                  {report.notes ? ` — “${report.notes}”` : ''}
                </Typography>
              </Box>
              {report.ad_photos.length > 0 ? (
                <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                  {report.ad_photos.map((url) => (
                    <Box key={url} component="a" href={url} target="_blank" rel="noreferrer" sx={{ flex: '0 0 auto' }}>
                      <Box component="img" src={url} alt="" sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 1, border: 1, borderColor: 'divider' }} />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography fontSize={13} color="text.secondary">No photos on this ad.</Typography>
              )}
              {report.ad_description && <Typography fontSize={13.5}>{report.ad_description}</Typography>}
              <Alert severity={confirm?.remove ? 'warning' : 'info'}>
                {confirm?.remove
                  ? `The ad is removed for good and every open report on it closes. ${penaltyFor(report.ad_nursery_strikes + 1)}`
                  : report.ad_status === 'SUSPENDED'
                    ? 'The report was wrong: the ad goes live again (unless another serious report is still open).'
                    : `The ad stays as it is. The report from ${report.reported_by_nursery_name} is closed as dismissed.`}
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="contained" color={confirm?.remove ? 'error' : 'primary'} disabled={reviewState.isLoading} onClick={submit}>
            {confirm?.remove ? 'Remove ad' : report?.ad_status === 'SUSPENDED' ? 'Restore ad' : 'Dismiss'}
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
