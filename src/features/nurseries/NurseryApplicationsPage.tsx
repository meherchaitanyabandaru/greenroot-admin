import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
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
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import {
  useGetNurseryQuery,
  useListNurseryAddressesQuery,
  useListNurseryUsersQuery,
  useListResourceQuery,
  useUpdateNurseryStatusMutation,
} from '../../api/adminResources';
import { TableSkeleton } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { PageHeader } from '../../components/page/PageHeader';
import { SearchInput } from '../../components/forms/SearchInput';
import { StatusChip } from '../../components/status/StatusChip';
import { useToast } from '../../components/feedback/ToastProvider';
import { normalizeApiError } from '../../utils/apiError';
import { formatDate } from '../../utils/labels';

// ─── Status chip colours ──────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:  { label: 'Pending',   color: '#B45309', bg: '#FEF3C7' },
  APPROVED: { label: 'Approved',  color: '#15803D', bg: '#DCFCE7' },
  ACTIVE:   { label: 'Active',    color: '#15803D', bg: '#DCFCE7' },
  REJECTED: { label: 'Rejected',  color: '#DC2626', bg: '#FEE2E2' },
  SUSPENDED:{ label: 'Suspended', color: '#7C3AED', bg: '#EDE9FE' },
  INACTIVE: { label: 'Inactive',  color: '#667085', bg: '#F2F4F7' },
};

function StatusBadge({ status }: { status: unknown }) {
  const s = String(status ?? '').toUpperCase();
  const cfg = STATUS_COLORS[s] ?? { label: s || '—', color: '#667085', bg: '#F2F4F7' };
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{
        fontSize: 11,
        fontWeight: 700,
        height: 22,
        bgcolor: cfg.bg,
        color: cfg.color,
        border: 'none',
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}

// ─── Action dialog (approve / reject / suspend / reactivate) ─────────────────
type ActionType = 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'ACTIVE';

const ACTION_CONFIG: Record<
  ActionType,
  { title: string; verb: string; color: 'success' | 'error' | 'warning' | 'primary'; requiresReason: boolean; hint: string }
> = {
  APPROVED:  { title: 'Approve Nursery',   verb: 'Approve',    color: 'success', requiresReason: false, hint: 'Optional: add an internal note' },
  REJECTED:  { title: 'Reject Application',verb: 'Reject',     color: 'error',   requiresReason: true,  hint: 'Rejection reason is required (visible to owner)' },
  SUSPENDED: { title: 'Suspend Nursery',   verb: 'Suspend',    color: 'warning', requiresReason: true,  hint: 'Suspension reason is required' },
  ACTIVE:    { title: 'Reactivate Nursery',verb: 'Reactivate', color: 'primary', requiresReason: true,  hint: 'Reactivation reason is required' },
};

function ActionDialog({
  open,
  action,
  nurseryName,
  onConfirm,
  onClose,
  loading,
  error,
}: {
  open: boolean;
  action: ActionType;
  nurseryName: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  loading: boolean;
  error: string;
}) {
  const [reason, setReason] = useState('');
  const cfg = ACTION_CONFIG[action];

  function handleConfirm() {
    if (cfg.requiresReason && !reason.trim()) return;
    onConfirm(reason.trim());
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{cfg.title}</DialogTitle>
      <DialogContent>
        <Typography fontSize={14} mb={2} color="text.secondary">
          You are about to <strong>{cfg.verb.toLowerCase()}</strong>{' '}
          <strong>{nurseryName}</strong>.
          {action === 'APPROVED' &&
            " Approving will activate the owner's operational access and notify them."}
          {action === 'REJECTED' &&
            ' The owner will be notified and may correct and resubmit.'}
          {action === 'SUSPENDED' &&
            ' All nursery operations will be blocked. Historical records are preserved.'}
          {action === 'ACTIVE' &&
            ' Previous suspension history will remain in the audit log.'}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
        <TextField
          label={cfg.requiresReason ? 'Reason (required)' : 'Internal note (optional)'}
          multiline
          rows={3}
          fullWidth
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          helperText={cfg.hint}
          error={cfg.requiresReason && reason.trim() === '' && loading}
          size="small"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} size="small">Cancel</Button>
        <Button
          variant="contained"
          color={cfg.color}
          onClick={handleConfirm}
          disabled={loading || (cfg.requiresReason && !reason.trim())}
          size="small"
        >
          {loading ? 'Saving…' : cfg.verb}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Nursery detail drawer ────────────────────────────────────────────────────
function NurseryReviewDrawer({
  nurseryId,
  open,
  onClose,
  onStatusChange,
}: {
  nurseryId: number | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: () => void;
}) {
  const [tab, setTab] = useState(0);
  const [dialog, setDialog] = useState<ActionType | null>(null);
  const [updateStatus, updateState] = useUpdateNurseryStatusMutation();
  const [dialogError, setDialogError] = useState('');
  const { showToast } = useToast();

  const nurseryQuery = useGetNurseryQuery(nurseryId ?? 0, { skip: !nurseryId });
  const addressesQuery = useListNurseryAddressesQuery(nurseryId ?? 0, { skip: !nurseryId });
  const usersQuery = useListNurseryUsersQuery(nurseryId ?? 0, { skip: !nurseryId });

  const nursery = nurseryQuery.data?.nursery ?? {};
  const addresses: Record<string, unknown>[] = Array.isArray(addressesQuery.data?.addresses)
    ? (addressesQuery.data!.addresses as Record<string, unknown>[])
    : [];
  const members: Record<string, unknown>[] = Array.isArray(usersQuery.data?.users)
    ? (usersQuery.data!.users as Record<string, unknown>[])
    : [];

  const status = String(nursery.status ?? '').toUpperCase();
  const canApprove   = status === 'PENDING';
  const canReject    = status === 'PENDING';
  const canSuspend   = status === 'APPROVED' || status === 'ACTIVE';
  const canReactivate = status === 'SUSPENDED';

  function txt(v: unknown) {
    return v === null || v === undefined || v === '' ? '—' : String(v);
  }

  async function handleAction(action: ActionType, reason: string) {
    if (!nurseryId) return;
    try {
      setDialogError('');
      await updateStatus({ id: nurseryId, status: action, reason }).unwrap();
      showToast(`Nursery ${ACTION_CONFIG[action].verb.toLowerCase()}d successfully`, 'success');
      setDialog(null);
      nurseryQuery.refetch();
      onStatusChange();
    } catch (e) {
      setDialogError(normalizeApiError(e).message);
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 560 }, p: 0 } }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700} fontSize={16}>
            Nursery Review
          </Typography>
          {!!nursery.name && (
            <Typography fontSize={12} color="text.secondary">{txt(nursery.name)}</Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {!!nursery.status && <StatusBadge status={nursery.status as string} />}
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      {nurseryQuery.isLoading ? (
        <Box sx={{ p: 3 }}><TableSkeleton rows={4} /></Box>
      ) : nurseryQuery.error ? (
        <Box sx={{ p: 3 }}>
          <ErrorState message={normalizeApiError(nurseryQuery.error).message} onRetry={nurseryQuery.refetch} />
        </Box>
      ) : (
        <>
          {/* Action buttons */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ px: 3, py: 1.5, borderBottom: 1, borderColor: 'divider', flexWrap: 'wrap' }}
          >
            {canApprove && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={() => setDialog('APPROVED')}
                disabled={updateState.isLoading}
              >
                Approve
              </Button>
            )}
            {canReject && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<CloseIcon />}
                onClick={() => setDialog('REJECTED')}
                disabled={updateState.isLoading}
              >
                Reject
              </Button>
            )}
            {canSuspend && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<PauseCircleOutlineIcon />}
                onClick={() => setDialog('SUSPENDED')}
                disabled={updateState.isLoading}
              >
                Suspend
              </Button>
            )}
            {canReactivate && (
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<PlayCircleOutlineIcon />}
                onClick={() => setDialog('ACTIVE')}
                disabled={updateState.isLoading}
              >
                Reactivate
              </Button>
            )}
          </Stack>

          {/* Tabs */}
          <Box sx={{ px: 3, pt: 1.5 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 36, mb: 2 }}
              TabIndicatorProps={{ style: { height: 2 } }}
            >
              {['Details', 'Address', 'Members'].map((t) => (
                <Tab
                  key={t}
                  label={t}
                  sx={{ minHeight: 36, fontSize: 13, textTransform: 'none', fontWeight: 600 }}
                />
              ))}
            </Tabs>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 3 }}>
            {tab === 0 && (
              <Stack spacing={2}>
                {/* Nursery info */}
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography fontSize={11} fontWeight={700} textTransform="uppercase" letterSpacing="0.06em" color="text.secondary" mb={1.5}>
                    Nursery Details
                  </Typography>
                  <Grid container spacing={1.5}>
                    {([
                      ['Code', nursery.nursery_code],
                      ['Name', nursery.name],
                      ['Mobile', nursery.mobile],
                      ['Email', nursery.email],
                      ['GST No.', nursery.gst_number],
                      ['Website', nursery.website],
                      ['Registered', formatDate(nursery.created_at)],
                    ] as [string, unknown][]).map(([label, value]) => (
                      <Grid key={label} size={{ xs: 12, sm: 6 }}>
                        <Typography fontSize={11} fontWeight={600} color="text.secondary" textTransform="uppercase" letterSpacing="0.04em">
                          {label}
                        </Typography>
                        <Typography fontSize={13.5} mt={0.25}>{txt(value)}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                  {!!nursery.description && (
                    <>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography fontSize={11} fontWeight={600} color="text.secondary" textTransform="uppercase" letterSpacing="0.04em" mb={0.5}>
                        Description
                      </Typography>
                      <Typography fontSize={13.5} color="text.secondary">{txt(nursery.description)}</Typography>
                    </>
                  )}
                </Paper>
              </Stack>
            )}

            {tab === 1 && (
              <Stack spacing={1.5}>
                {addresses.length === 0 ? (
                  <Typography color="text.secondary" fontSize={13}>No addresses recorded.</Typography>
                ) : (
                  addresses.map((addr, i) => (
                    <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Chip label={txt(addr.address_type)} size="small" sx={{ fontSize: 11, height: 20 }} />
                        {!!addr.is_primary && <Chip label="Primary" size="small" color="success" sx={{ fontSize: 11, height: 20 }} />}
                      </Stack>
                      <Typography fontSize={13.5}>{txt(addr.address_line1)}</Typography>
                      {!!addr.address_line2 && <Typography fontSize={13.5}>{txt(addr.address_line2)}</Typography>}
                      <Typography fontSize={13} color="text.secondary" mt={0.25}>
                        {[addr.city, addr.state, addr.postal_code].filter(Boolean).join(', ')}
                      </Typography>
                      {!!(addr.latitude || addr.longitude) && (
                        <Typography fontSize={12} color="text.secondary" fontFamily="monospace" mt={0.5}>
                          {txt(addr.latitude)}, {txt(addr.longitude)}
                        </Typography>
                      )}
                    </Paper>
                  ))
                )}
              </Stack>
            )}

            {tab === 2 && (
              <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Mobile</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography color="text.secondary" fontSize={13}>No members yet.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      members.map((m, i) => (
                        <TableRow key={i}>
                          <TableCell>{txt(m.first_name)}</TableCell>
                          <TableCell>{txt(m.mobile)}</TableCell>
                          <TableCell>
                            <Chip label={txt(m.role ?? m.role_name)} size="small" sx={{ fontSize: 11, height: 20 }} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>
        </>
      )}

      {/* Action dialogs */}
      {dialog && (
        <ActionDialog
          open={!!dialog}
          action={dialog}
          nurseryName={txt(nursery.name)}
          onConfirm={(reason) => handleAction(dialog, reason)}
          onClose={() => { setDialog(null); setDialogError(''); }}
          loading={updateState.isLoading}
          error={dialogError}
        />
      )}
    </Drawer>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const;
type StatusFilter = typeof STATUS_TABS[number];

export function NurseryApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const params = useMemo(() => ({
    page,
    per_page: 20,
    search: search || undefined,
    ...(statusFilter !== 'ALL' ? { status: statusFilter.toLowerCase() } : {}),
  }), [page, search, statusFilter]);

  const { data, isLoading, isFetching, error, refetch } = useListResourceQuery({
    resource: 'nurseries',
    params,
  });

  const rows = (data?.rows ?? []) as Record<string, unknown>[];
  const pagination = data?.pagination;

  function openDrawer(id: number) {
    setSelectedId(id);
    setDrawerOpen(true);
  }

  function txt(v: unknown) {
    return v === null || v === undefined || v === '' ? '—' : String(v);
  }

  return (
    <Box>
      <PageHeader
        title="Nursery Applications"
        description="Review, approve, reject, suspend, or reactivate nursery registrations"
      />

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <Box sx={{ maxWidth: 320 }}>
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by name, code, mobile…"
          />
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
          >
            {STATUS_TABS.map((s) => (
              <MenuItem key={s} value={s}>
                {s === 'ALL' ? 'All Statuses' : s.charAt(0) + s.slice(1).toLowerCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Status tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={statusFilter}
          onChange={(_, v) => { setStatusFilter(v); setPage(1); }}
          sx={{ minHeight: 38 }}
          TabIndicatorProps={{ style: { height: 2 } }}
        >
          {STATUS_TABS.map((s) => (
            <Tab
              key={s}
              value={s}
              label={s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              sx={{ minHeight: 38, fontSize: 13, textTransform: 'none', fontWeight: 600 }}
            />
          ))}
        </Tabs>
      </Box>

      {error && <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />}

      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Code', 'Nursery Name', 'Owner ID', 'Mobile', 'Status', 'Registered', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading || isFetching ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <TableSkeleton rows={6} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography fontSize={13} color="text.secondary">
                      {statusFilter === 'PENDING'
                        ? 'No pending applications — all caught up!'
                        : `No nurseries with status ${statusFilter.toLowerCase()}.`}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const id = Number(row.nursery_id ?? row.id ?? 0);
                const status = String(row.status ?? '').toUpperCase();
                return (
                  <TableRow key={id} hover>
                    <TableCell>
                      <Typography fontSize={12} fontFamily="monospace" color="text.secondary">
                        {txt(row.nursery_code)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={13.5} fontWeight={600}>{txt(row.name)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={12} color="text.secondary">{txt(row.owner_user_id)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={13}>{txt(row.mobile)}</Typography>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={12} color="text.secondary">{formatDate(row.created_at)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Review">
                        <IconButton size="small" onClick={() => openDrawer(id)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <Stack
            direction="row"
            justifyContent="flex-end"
            alignItems="center"
            spacing={1}
            sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider' }}
          >
            <Typography fontSize={12} color="text.secondary">
              Page {pagination.page} of {pagination.total_pages} ({pagination.total} total)
            </Typography>
            <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button size="small" disabled={page >= pagination.total_pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </Stack>
        )}
      </Paper>

      {/* Review drawer */}
      <NurseryReviewDrawer
        nurseryId={selectedId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStatusChange={refetch}
      />
    </Box>
  );
}
