import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import type { ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import {
  type AdminMarketAd,
  type MarketReport,
  useListMarketAdminAdsQuery,
  useListMarketReportsQuery,
  useModerateMarketAdMutation,
  useReviewMarketReportMutation,
  useUnblockMarketNurseryMutation,
} from '../../api/adminResources';
import { AppDataTable } from '../../components/data-table/AppDataTable';
import { ErrorState } from '../../components/feedback/ErrorState';
import { TableSkeleton } from '../../components/feedback/LoadingState';
import { useToast } from '../../components/feedback/toastContext';
import { FormDrawer } from '../../components/forms/FormDrawer';
import { SearchInput } from '../../components/forms/SearchInput';
import { PageHeader } from '../../components/page/PageHeader';
import { StatusChip } from '../../components/status/StatusChip';
import { normalizeApiError } from '../../utils/apiError';
import { formatCurrency, toLabel } from '../../utils/labels';

const REPORT_FILTERS = [
  { value: 'PENDING', label: 'Waiting for review' },
  { value: 'REVIEWED', label: 'Ad removed' },
  { value: 'DISMISSED', label: 'Dismissed' },
  { value: '', label: 'All' },
];

const AD_FILTERS = [
  { value: '', label: 'All' },
  { value: 'PUBLISHED', label: 'Live' },
  { value: 'SUSPENDED', label: 'Under review' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'REMOVED', label: 'Removed' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'DRAFT', label: 'Draft' },
];

/** Market wording for ad statuses (the shared chip says "Suspended", "Published"). */
const AD_STATUS: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' | 'info' }> = {
  PUBLISHED: { label: 'Live', color: 'success' },
  SUSPENDED: { label: 'Under review', color: 'warning' },
  REMOVED: { label: 'Removed by GreenRoot', color: 'error' },
  PAUSED: { label: 'Paused', color: 'info' },
  EXPIRED: { label: 'Expired', color: 'default' },
  ARCHIVED: { label: 'Archived', color: 'default' },
  DRAFT: { label: 'Draft', color: 'default' },
};

function AdStatusChip({ status }: { status: string }) {
  const cfg = AD_STATUS[status] ?? { label: toLabel(status), color: 'default' as const };
  return <Chip size="small" color={cfg.color} label={cfg.label} sx={{ height: 22, fontSize: 11 }} />;
}

/** Report status in market words: REVIEWED only happens when the ad is removed. */
function ReportStatusChip({ status }: { status: string }) {
  if (status === 'REVIEWED') return <Chip size="small" color="error" variant="outlined" label="Ad removed" sx={{ height: 22, fontSize: 11 }} />;
  return <StatusChip value={status} />;
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** What one more removed ad does to the seller (mirrors the API's blockDays). */
function penaltyFor(strikesAfter: number) {
  if (strikesAfter >= 3) return `Strike ${strikesAfter}: posting blocked for 90 days. Consider suspending the nursery from Nurseries.`;
  if (strikesAfter === 2) return 'Strike 2: posting blocked for 30 days.';
  return 'Strike 1: a warning. The nursery can keep posting.';
}

function StrikesChip({ strikes, blockedUntil }: { strikes: number; blockedUntil?: string }) {
  return (
    <Box>
      <Chip
        size="small"
        color={strikes >= 2 ? 'error' : strikes === 1 ? 'warning' : 'default'}
        label={`${strikes} strike${strikes === 1 ? '' : 's'}`}
        sx={{ height: 22, fontSize: 11 }}
      />
      {blockedUntil && (
        <Typography fontSize={11.5} color="error.main" mt={0.5}>Blocked until {formatDate(blockedUntil)}</Typography>
      )}
    </Box>
  );
}

function PhotoStrip({ photos }: { photos: string[] }) {
  if (photos.length === 0) return <Typography fontSize={13} color="text.secondary">No photos on this ad.</Typography>;
  return (
    <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
      {photos.map((url) => (
        <Box key={url} component="a" href={url} target="_blank" rel="noreferrer" sx={{ flex: '0 0 auto' }}>
          <Box component="img" src={url} alt="" sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 1, border: 1, borderColor: 'divider' }} />
        </Box>
      ))}
    </Stack>
  );
}

/**
 * Admin → Local Market. Reports: the queue nurseries fill; ads reported for
 * explicit images or banned items are already hidden. All ads: every ad in
 * any status, where an admin can hide, restore or remove one directly and
 * lift a nursery's posting block.
 */
export function MarketPage() {
  const [tab, setTab] = useState<'reports' | 'ads'>('reports');
  const { data: pending } = useListMarketReportsQuery({ status: 'PENDING', page: 1, per_page: 1 });
  const open = pending?.pagination?.total ?? 0;
  return (
    <Box>
      <PageHeader
        title="Local Market"
        description="Nursery-to-nursery ads. Reports of explicit images or banned items hide the ad at once; check the photos, then restore or remove. Removed ads are strikes: the 2nd blocks posting for 30 days, the 3rd for 90."
      />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab
          value="reports"
          label={
            <Badge color="error" badgeContent={open} max={99} sx={{ '& .MuiBadge-badge': { right: -14 } }}>
              Reports
            </Badge>
          }
        />
        <Tab value="ads" label="All ads" />
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
      cell: ({ row }) => <StrikesChip strikes={row.original.ad_nursery_strikes} blockedUntil={row.original.ad_nursery_blocked_until} />,
    },
    { id: '_ad_status', header: 'Ad status', cell: ({ row }) => <AdStatusChip status={row.original.ad_status} /> },
    {
      id: '_status',
      header: 'Report',
      cell: ({ row }) => (
        <Box>
          <ReportStatusChip status={row.original.status} />
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
              <PhotoStrip photos={report.ad_photos} />
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

type AdAction = 'HIDE' | 'RESTORE' | 'REMOVE';

function AdsTab() {
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [openId, setOpenId] = useState<number | null>(null);
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);
  const { data, isFetching, error, refetch } = useListMarketAdminAdsQuery({ status: status || undefined, search: search || undefined, page: page + 1, per_page: rowsPerPage });
  // The drawer reads the row from the list, so it refreshes after every action.
  const open = data?.ads.find((a) => a.id === openId) ?? null;

  const columns: ColumnDef<AdminMarketAd>[] = [
    {
      id: '_ad',
      header: 'Ad',
      cell: ({ row }) => (
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => setOpenId(row.original.id)}>
          <Avatar variant="rounded" src={row.original.photos[0]} sx={{ width: 44, height: 44 }}>{row.original.title[0]}</Avatar>
          <Box>
            <Typography fontSize={13.5} fontWeight={600}>{row.original.title}</Typography>
            <Typography fontSize={12} color="text.secondary">{row.original.code} · {row.original.plant_name}</Typography>
          </Box>
        </Stack>
      ),
    },
    {
      id: '_seller',
      header: 'Seller',
      cell: ({ row }) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar src={row.original.posted_by_photo} sx={{ width: 28, height: 28, fontSize: 13 }}>
            {(row.original.posted_by_name ?? row.original.nursery_name)[0]}
          </Avatar>
          <Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography fontSize={13}>{row.original.nursery_name}</Typography>
              {row.original.nursery_verified && <Chip size="small" color="success" variant="outlined" label="Verified" sx={{ height: 18, fontSize: 10 }} />}
            </Stack>
            <Typography fontSize={12} color="text.secondary">{row.original.posted_by_name ?? 'Unknown poster'}</Typography>
          </Box>
        </Stack>
      ),
    },
    {
      id: '_history',
      header: 'Strikes',
      cell: ({ row }) => <StrikesChip strikes={row.original.nursery_strikes} blockedUntil={row.original.nursery_blocked_until} />,
    },
    {
      id: '_price',
      header: 'Qty · price',
      cell: ({ row }) =>
        `${row.original.quantity?.toLocaleString('en-IN') ?? '—'} · ${row.original.price_per_unit != null ? formatCurrency(row.original.price_per_unit) : '—'}`,
    },
    {
      id: '_activity',
      header: 'Views · chats',
      cell: ({ row }) => (
        <Box>
          <Typography fontSize={13}>{row.original.view_count} · {row.original.enquiry_count}</Typography>
          {row.original.pending_reports > 0 && (
            <Chip size="small" color="warning" label={`${row.original.pending_reports} open report${row.original.pending_reports > 1 ? 's' : ''}`} sx={{ height: 20, fontSize: 10.5, mt: 0.5 }} />
          )}
        </Box>
      ),
    },
    { id: '_status', header: 'Status', cell: ({ row }) => <AdStatusChip status={row.original.status} /> },
    { id: '_expires', header: 'Expires', cell: ({ row }) => formatDate(row.original.expires_at) },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <Button size="small" onClick={() => setOpenId(row.original.id)}>Open</Button>,
    },
  ];

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack spacing={1.5}>
          <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search by title, plant, ad code or nursery" />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {AD_FILTERS.map((f) => (
              <Chip
                key={f.value || 'all'}
                label={f.label}
                onClick={() => { setStatus(f.value); setPage(0); }}
                color={status === f.value ? 'primary' : 'default'}
                variant={status === f.value ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>
      {isFetching && !data && <TableSkeleton rows={5} cols={columns.length} />}
      {error && <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />}
      {data && !error && (
        <AppDataTable
          columns={columns}
          data={data.ads}
          count={data.pagination?.total ?? 0}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(0); }}
        />
      )}
      <FormDrawer open={open !== null} title={open ? `${open.code} · ${open.title}` : 'Ad'} onClose={() => setOpenId(null)} width={{ xs: '100%', sm: 560 }}>
        {open && <AdReview ad={open} />}
      </FormDrawer>
    </>
  );
}

/** One ad in full, with the admin actions its status allows. */
function AdReview({ ad }: { ad: AdminMarketAd }) {
  const { showToast } = useToast();
  const [action, setAction] = useState<AdAction | null>(null);
  const [note, setNote] = useState('');
  const [moderate, moderateState] = useModerateMarketAdMutation();
  const [unblock, unblockState] = useUnblockMarketNurseryMutation();

  const canHide = ad.status === 'PUBLISHED' || ad.status === 'PAUSED';
  const canRestore = ad.status === 'SUSPENDED';
  const canRemove = ad.status !== 'REMOVED';

  async function submit() {
    if (!action) return;
    const res = await moderate({ id: ad.id, action, note: note.trim() || undefined }).unwrap();
    if (action === 'REMOVE') {
      const blocked = res.outcome.blocked_until ? `, posting blocked until ${formatDate(res.outcome.blocked_until)}` : '';
      showToast(`Ad removed. ${ad.nursery_name} has ${res.outcome.strikes} strike${res.outcome.strikes === 1 ? '' : 's'}${blocked}`);
    } else {
      showToast(action === 'HIDE' ? 'Ad hidden for review' : 'Ad restored and its reports dismissed');
    }
    setAction(null);
    setNote('');
  }

  async function lift() {
    await unblock(ad.nursery_id).unwrap();
    showToast(`${ad.nursery_name} can post ads again`);
  }

  const needsNote = action === 'HIDE' || action === 'REMOVE';
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <AdStatusChip status={ad.status} />
        {ad.pending_reports > 0 && <Chip size="small" color="warning" label={`${ad.pending_reports} open report${ad.pending_reports > 1 ? 's' : ''}`} sx={{ height: 22, fontSize: 11 }} />}
      </Stack>
      {ad.moderation_note && <Alert severity={ad.status === 'REMOVED' ? 'error' : 'warning'}>{ad.moderation_note}</Alert>}
      <PhotoStrip photos={ad.photos} />
      <Box>
        <Typography fontWeight={700}>{ad.title}</Typography>
        <Typography fontSize={13} color="text.secondary">
          {ad.plant_name} · {ad.quantity?.toLocaleString('en-IN') ?? '—'} available · {ad.price_per_unit != null ? formatCurrency(ad.price_per_unit) : 'no price'}
          {ad.price_unit ? ` ${toLabel(ad.price_unit).toLowerCase()}` : ''}
        </Typography>
        {ad.description && <Typography fontSize={13.5} mt={1}>{ad.description}</Typography>}
      </Box>
      <Divider />
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar src={ad.posted_by_photo} sx={{ width: 48, height: 48 }}>{(ad.posted_by_name ?? ad.nursery_name)[0]}</Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={600}>{ad.nursery_name}</Typography>
          <Typography fontSize={12.5} color="text.secondary">Posted by {ad.posted_by_name ?? 'unknown'} · {formatDate(ad.created_at)}</Typography>
        </Box>
        <StrikesChip strikes={ad.nursery_strikes} blockedUntil={ad.nursery_blocked_until} />
      </Stack>
      <Typography fontSize={12.5} color="text.secondary">
        {ad.view_count} view{ad.view_count === 1 ? '' : 's'} · {ad.enquiry_count} chat{ad.enquiry_count === 1 ? '' : 's'} · published {formatDate(ad.published_at)} · expires {formatDate(ad.expires_at)}
      </Typography>
      <Divider />
      {moderateState.error && <Alert severity="error">{normalizeApiError(moderateState.error).message}</Alert>}
      {unblockState.error && <Alert severity="error">{normalizeApiError(unblockState.error).message}</Alert>}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {canHide && <Button variant="outlined" color="warning" onClick={() => setAction('HIDE')}>Hide for review</Button>}
        {canRestore && <Button variant="contained" onClick={() => setAction('RESTORE')}>Restore ad</Button>}
        {canRemove && <Button variant="outlined" color="error" onClick={() => setAction('REMOVE')}>Remove ad</Button>}
        {ad.nursery_blocked_until && (
          <Button onClick={lift} disabled={unblockState.isLoading}>Unblock nursery</Button>
        )}
      </Stack>

      <Dialog open={action !== null} onClose={() => setAction(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{action === 'HIDE' ? 'Hide this ad for review?' : action === 'RESTORE' ? 'Restore this ad?' : 'Remove this ad?'}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} mt={0.5}>
            <Typography fontSize={14}>
              {action === 'HIDE' && 'The ad leaves the market and its chats turn read-only. The seller sees your note and cannot edit it. Restore or remove it later.'}
              {action === 'RESTORE' && 'The ad goes live again and any open reports on it are dismissed.'}
              {action === 'REMOVE' && `The ad is removed for good and its open reports close. ${penaltyFor(ad.nursery_strikes + 1)}`}
            </Typography>
            {needsNote && (
              <TextField
                autoFocus
                multiline
                minRows={2}
                label="Note to the seller (required)"
                placeholder={action === 'HIDE' ? 'e.g. Photos look copied from the internet' : 'e.g. Sells a banned plant'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                inputProps={{ maxLength: 500 }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAction(null)}>Cancel</Button>
          <Button
            variant="contained"
            color={action === 'REMOVE' ? 'error' : action === 'HIDE' ? 'warning' : 'primary'}
            disabled={moderateState.isLoading || (needsNote && !note.trim())}
            onClick={submit}
          >
            {action === 'HIDE' ? 'Hide ad' : action === 'RESTORE' ? 'Restore ad' : 'Remove ad'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
