import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Skeleton,
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
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import {
  useGetNurseryQuery,
  useListNurseryAddressesQuery,
  useListNurseryInventoryQuery,
  useListNurseryUsersQuery,
  useUpdateNurseryMutation,
  useUpdateNurseryStatusMutation,
  useCreateNurseryAddressMutation,
  useUpdateNurseryAddressMutation,
  useDeleteNurseryAddressMutation,
} from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { DetailSkeleton, LoadingState } from '../../components/feedback/LoadingState';
import { StatusChip } from '../../components/status/StatusChip';
import { normalizeApiError } from '../../utils/apiError';
import { formatDate, toLabel } from '../../utils/labels';
import { TableAvatar } from '../../components/data-table/TableAvatar';
import { NurseryForm } from './NurseryForm';

function text(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

const ADDRESS_TYPES = ['REGISTERED', 'OPERATIONAL', 'BILLING'];

const EMPTY_ADDRESS = {
  address_type: 'OPERATIONAL',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  country: 'India',
  postal_code: '',
  latitude: '',
  longitude: '',
  is_primary: false,
};

function AddressForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial: Record<string, unknown>;
  onSave: (v: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<Record<string, unknown>>({ ...initial });
  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave(form);
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Type"
            value={String(form.address_type ?? '')}
            onChange={(e) => set('address_type', e.target.value)}
            SelectProps={{ native: true }}
          >
            {ADDRESS_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth size="small" label="Line 1" value={String(form.address_line1 ?? '')} onChange={(e) => set('address_line1', e.target.value)} required />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth size="small" label="Line 2" value={String(form.address_line2 ?? '')} onChange={(e) => set('address_line2', e.target.value)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth size="small" label="City" value={String(form.city ?? '')} onChange={(e) => set('city', e.target.value)} required />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth size="small" label="State" value={String(form.state ?? '')} onChange={(e) => set('state', e.target.value)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth size="small" label="PIN" value={String(form.postal_code ?? '')} onChange={(e) => set('postal_code', e.target.value)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth size="small" label="Latitude" value={String(form.latitude ?? '')} onChange={(e) => set('latitude', e.target.value)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth size="small" label="Longitude" value={String(form.longitude ?? '')} onChange={(e) => set('longitude', e.target.value)} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={<Checkbox checked={Boolean(form.is_primary)} onChange={(e) => set('is_primary', e.target.checked)} size="small" />}
            label="Primary address"
          />
        </Grid>
      </Grid>
      <Stack direction="row" spacing={1}>
        <Button type="submit" variant="contained" size="small" disabled={loading}>Save</Button>
        <Button size="small" onClick={onCancel}>Cancel</Button>
      </Stack>
    </Box>
  );
}

function AddressesTab({ nurseryId }: { nurseryId: number }) {
  const addressesQuery = useListNurseryAddressesQuery(nurseryId);
  const [createAddress, createState] = useCreateNurseryAddressMutation();
  const [updateAddress, updateState] = useUpdateNurseryAddressMutation();
  const [deleteAddress] = useDeleteNurseryAddressMutation();
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [error, setError] = useState('');

  const addresses: Record<string, unknown>[] = Array.isArray(addressesQuery.data?.addresses)
    ? (addressesQuery.data!.addresses as Record<string, unknown>[])
    : [];

  const isMutating = createState.isLoading || updateState.isLoading;

  function sanitizeAddress(values: Record<string, unknown>) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (k === 'latitude' || k === 'longitude') {
        const n = parseFloat(String(v));
        if (!isNaN(n)) out[k] = n;
      } else if (v !== '') {
        out[k] = v;
      }
    }
    return out;
  }

  async function handleSaveNew(values: Record<string, unknown>) {
    try {
      setError('');
      await createAddress({ nurseryId, body: sanitizeAddress(values) }).unwrap();
      setEditingId(null);
    } catch (e) {
      setError(normalizeApiError(e).message);
    }
  }

  async function handleSaveEdit(addressId: number, values: Record<string, unknown>) {
    try {
      setError('');
      await updateAddress({ addressId, body: sanitizeAddress(values) }).unwrap();
      setEditingId(null);
    } catch (e) {
      setError(normalizeApiError(e).message);
    }
  }

  async function handleDelete(addressId: number, type: unknown) {
    if (!window.confirm(`Delete ${text(type)} address?`)) return;
    try {
      setError('');
      await deleteAddress(addressId).unwrap();
    } catch (e) {
      setError(normalizeApiError(e).message);
    }
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
        <Button size="small" variant="outlined" onClick={() => setEditingId('new')} disabled={editingId !== null}>
          + Add Address
        </Button>
      </Stack>

      {editingId === 'new' && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>New Address</Typography>
          <AddressForm
            initial={EMPTY_ADDRESS}
            onSave={handleSaveNew}
            onCancel={() => setEditingId(null)}
            loading={isMutating}
          />
        </Paper>
      )}

      {addressesQuery.isLoading ? (
        <LoadingState />
      ) : (
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Line 1</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>City</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>State</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>PIN</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Primary</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {addresses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography color="text.secondary" variant="body2">No addresses.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                addresses.map((addr) => {
                  const id = addr.address_id as number ?? addr.id as number;
                  if (editingId === id) {
                    return (
                      <TableRow key={id}>
                        <TableCell colSpan={7}>
                          <AddressForm
                            initial={addr}
                            onSave={(v) => handleSaveEdit(id, v)}
                            onCancel={() => setEditingId(null)}
                            loading={isMutating}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return (
                    <TableRow key={id}>
                      <TableCell>{text(addr.address_type)}</TableCell>
                      <TableCell>{text(addr.address_line1)}</TableCell>
                      <TableCell>{text(addr.city)}</TableCell>
                      <TableCell>{text(addr.state)}</TableCell>
                      <TableCell>{text(addr.postal_code)}</TableCell>
                      <TableCell>{addr.is_primary ? <Chip label="Yes" size="small" color="success" /> : '-'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => setEditingId(id)} disabled={editingId !== null}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDelete(id, addr.address_type)} disabled={editingId !== null}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}

function StockBadge({ status, qty }: { status: unknown; qty: unknown }) {
  const q = Number(qty ?? 0);
  const s = String(status ?? '').toUpperCase();
  const config: Record<string, { label: string; color: string; bg: string }> = {
    AVAILABLE:    { label: `In Stock (${q})`,    color: '#17803D', bg: '#D1FAE5' },
    LOW_STOCK:    { label: `Low Stock (${q})`,   color: '#B7791F', bg: '#FEF3C7' },
    OUT_OF_STOCK: { label: 'Out of Stock',        color: '#C2410C', bg: '#FEE2E2' },
    RESERVED:     { label: `Reserved (${q})`,     color: '#2563EB', bg: '#DBEAFE' },
    DISCONTINUED: { label: 'Discontinued',        color: '#667085', bg: '#F2F4F7' },
  };
  const cfg = config[s] ?? { label: s || '—', color: '#667085', bg: '#F2F4F7' };
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{ fontSize: 11, fontWeight: 600, height: 22, bgcolor: cfg.bg, color: cfg.color, border: 'none', '& .MuiChip-label': { px: 1 } }}
    />
  );
}

function InventoryTab({ nurseryId }: { nurseryId: number }) {
  const inventoryQuery = useListNurseryInventoryQuery(nurseryId);
  const inventory: Record<string, unknown>[] = Array.isArray(inventoryQuery.data?.inventory)
    ? (inventoryQuery.data!.inventory as Record<string, unknown>[])
    : [];

  if (inventoryQuery.isLoading) return <LoadingState />;
  if (inventoryQuery.error) return <ErrorState message={normalizeApiError(inventoryQuery.error).message} onRetry={inventoryQuery.refetch} />;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Plant</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>Stock</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {inventory.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} sx={{ border: 0 }}>
                <Typography color="text.secondary" fontSize={13} py={2}>No inventory items.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            inventory.map((item, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Typography fontSize={13.5} fontWeight={500}>
                    {text(item.common_name ?? item.plant_name ?? item.plant_id)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography fontSize={13.5} color="text.secondary">
                    {text(item.size_name ?? item.size_code ?? item.size_id)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <StockBadge status={item.inventory_status} qty={item.available_quantity} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}

type StatusAction = 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'ACTIVE';
const STATUS_ACTION_CFG: Record<StatusAction, { title: string; verb: string; requiresReason: boolean }> = {
  APPROVED:  { title: 'Approve Nursery',   verb: 'Approve',    requiresReason: false },
  REJECTED:  { title: 'Reject Application',verb: 'Reject',     requiresReason: true  },
  SUSPENDED: { title: 'Suspend Nursery',   verb: 'Suspend',    requiresReason: true  },
  ACTIVE:    { title: 'Reactivate Nursery',verb: 'Reactivate', requiresReason: true  },
};

export function NurseryDetailPanel({ nurseryId, onDeleted }: { nurseryId: number; onDeleted?: () => void }) {
  const nurseryQuery = useGetNurseryQuery(nurseryId);
  const usersQuery = useListNurseryUsersQuery(nurseryId);
  const inventoryQuery = useListNurseryInventoryQuery(nurseryId);
  const [updateNursery, updateState] = useUpdateNurseryMutation();
  const [updateStatus, statusState] = useUpdateNurseryStatusMutation();
  const [tab, setTab] = useState(0);
  const [actionDialog, setActionDialog] = useState<StatusAction | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionError, setActionError] = useState('');

  if (nurseryQuery.isLoading) return <DetailSkeleton />;
  if (nurseryQuery.error) return <ErrorState message={normalizeApiError(nurseryQuery.error).message} onRetry={nurseryQuery.refetch} />;

  const nursery = nurseryQuery.data?.nursery ?? {};
  const users: Record<string, unknown>[] = Array.isArray(usersQuery.data?.users)
    ? (usersQuery.data!.users as Record<string, unknown>[])
    : [];

  const status = String(nursery.status ?? '').toUpperCase();
  const canApprove    = status === 'PENDING';
  const canReject     = status === 'PENDING';
  const canSuspend    = status === 'APPROVED' || status === 'ACTIVE';
  const canReactivate = status === 'SUSPENDED';

  const detailItems: Array<[string, unknown]> = [
    ['Code', nursery.nursery_code ?? nursery.code],
    ['Owner ID', nursery.owner_user_id],
    ['Mobile', nursery.mobile],
    ['Email', nursery.email],
    ['Website', nursery.website],
    ['GST No.', nursery.gst_number],
    ['Registered', formatDate(nursery.created_at)],
  ];

  async function handleUpdate(values: Record<string, unknown>) {
    await updateNursery({ id: nurseryId, body: values }).unwrap();
    nurseryQuery.refetch();
  }

  async function handleStatusAction() {
    if (!actionDialog) return;
    const cfg = STATUS_ACTION_CFG[actionDialog];
    if (cfg.requiresReason && !actionReason.trim()) return;
    try {
      setActionError('');
      await updateStatus({ id: nurseryId, status: actionDialog, reason: actionReason.trim() }).unwrap();
      setActionDialog(null);
      setActionReason('');
      nurseryQuery.refetch();
    } catch (e) {
      setActionError(normalizeApiError(e).message);
    }
  }

  return (
    <Stack spacing={2.5}>
      {(updateState.isError || statusState.isError) && (
        <Alert severity="error">
          {normalizeApiError(updateState.error || statusState.error).message}
        </Alert>
      )}

      {/* Status action dialog */}
      {actionDialog && (
        <Dialog open onClose={() => { setActionDialog(null); setActionReason(''); setActionError(''); }} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>{STATUS_ACTION_CFG[actionDialog].title}</DialogTitle>
          <DialogContent>
            <Typography fontSize={14} color="text.secondary" mb={1.5}>
              You are about to <strong>{STATUS_ACTION_CFG[actionDialog].verb.toLowerCase()}</strong>{' '}
              <strong>{text(nursery.nursery_name ?? nursery.name)}</strong>.
            </Typography>
            {actionError && <Alert severity="error" sx={{ mb: 1.5 }}>{actionError}</Alert>}
            <TextField
              label={STATUS_ACTION_CFG[actionDialog].requiresReason ? 'Reason (required)' : 'Internal note (optional)'}
              multiline
              rows={3}
              fullWidth
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button onClick={() => { setActionDialog(null); setActionReason(''); setActionError(''); }} size="small">Cancel</Button>
            <Button
              variant="contained"
              color={actionDialog === 'APPROVED' ? 'success' : actionDialog === 'REJECTED' ? 'error' : actionDialog === 'SUSPENDED' ? 'warning' : 'primary'}
              onClick={handleStatusAction}
              disabled={statusState.isLoading || (STATUS_ACTION_CFG[actionDialog].requiresReason && !actionReason.trim())}
              size="small"
            >
              {statusState.isLoading ? 'Saving…' : STATUS_ACTION_CFG[actionDialog].verb}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* ── Header card ── */}
      <Paper sx={{ p: 2.5, borderRadius: 2 }} variant="outlined">
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography fontSize={11} fontWeight={700} textTransform="uppercase" letterSpacing="0.06em" color="text.secondary" mb={0.25}>
                Nursery
              </Typography>
              <Typography variant="h6" fontWeight={700}>{text(nursery.nursery_name ?? nursery.name)}</Typography>
              <Typography fontSize={12} color="text.secondary" fontFamily="monospace">
                {text(nursery.nursery_code)}
              </Typography>
            </Box>
            <StatusChip value={nursery.status} />
          </Stack>

          <Grid container spacing={1.5}>
            {detailItems.map(([label, value]) => (
              <Grid key={String(label)} size={{ xs: 12, sm: 6 }}>
                <Typography fontSize={11} fontWeight={600} textTransform="uppercase" letterSpacing="0.05em" color="text.secondary">
                  {label}
                </Typography>
                <Typography fontSize={13.5} mt={0.2}>{text(value)}</Typography>
              </Grid>
            ))}
          </Grid>

          {Boolean(nursery.description) && (
            <>
              <Divider />
              <Box>
                <Typography fontSize={11} fontWeight={600} textTransform="uppercase" letterSpacing="0.05em" color="text.secondary" mb={0.5}>
                  About
                </Typography>
                <Typography fontSize={13.5} color="text.secondary">{text(nursery.description)}</Typography>
              </Box>
            </>
          )}

          <Divider />
          {/* Status actions — no hard delete */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {canApprove && (
              <Button size="small" variant="contained" color="success" startIcon={<CheckIcon />}
                onClick={() => setActionDialog('APPROVED')} disabled={statusState.isLoading}>
                Approve
              </Button>
            )}
            {canReject && (
              <Button size="small" variant="outlined" color="error" startIcon={<CloseIcon />}
                onClick={() => setActionDialog('REJECTED')} disabled={statusState.isLoading}>
                Reject
              </Button>
            )}
            {canSuspend && (
              <Button size="small" variant="outlined" color="warning" startIcon={<PauseCircleOutlineIcon />}
                onClick={() => setActionDialog('SUSPENDED')} disabled={statusState.isLoading}>
                Suspend
              </Button>
            )}
            {canReactivate && (
              <Button size="small" variant="outlined" color="primary" startIcon={<PlayCircleOutlineIcon />}
                onClick={() => setActionDialog('ACTIVE')} disabled={statusState.isLoading}>
                Reactivate
              </Button>
            )}
          </Stack>
          <NurseryForm
            initial={nursery}
            loading={updateState.isLoading}
            onSubmit={handleUpdate}
          />
        </Stack>
      </Paper>

      {/* ── Stats cards ── */}
      <Grid container spacing={1.5}>
        {[
          {
            label: 'Inventory Items',
            value: inventoryQuery.isLoading
              ? null
              : Array.isArray(inventoryQuery.data?.inventory)
                ? inventoryQuery.data!.inventory.length
                : 0,
            color: '#17803D',
            bg: '#D1FAE5',
          },
          {
            label: 'In Stock',
            value: inventoryQuery.isLoading
              ? null
              : Array.isArray(inventoryQuery.data?.inventory)
                ? (inventoryQuery.data!.inventory as Record<string, unknown>[]).filter(
                    (i) => String(i.inventory_status) === 'AVAILABLE',
                  ).length
                : 0,
            color: '#2563EB',
            bg: '#DBEAFE',
          },
          {
            label: 'Low / Out of Stock',
            value: inventoryQuery.isLoading
              ? null
              : Array.isArray(inventoryQuery.data?.inventory)
                ? (inventoryQuery.data!.inventory as Record<string, unknown>[]).filter((i) =>
                    ['LOW_STOCK', 'OUT_OF_STOCK'].includes(String(i.inventory_status)),
                  ).length
                : 0,
            color: '#B7791F',
            bg: '#FEF3C7',
          },
          {
            label: 'Team Members',
            value: usersQuery.isLoading ? null : users.length,
            color: '#7C3AED',
            bg: '#EDE9FE',
          },
        ].map(({ label, value, color, bg }) => (
          <Grid key={label} size={{ xs: 6, md: 3 }}>
            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 2, borderColor: 'divider' }}
            >
              {value === null ? (
                <>
                  <Skeleton variant="text" width={40} height={32} />
                  <Skeleton variant="text" width={80} height={14} />
                </>
              ) : (
                <>
                  <Typography fontSize={24} fontWeight={800} lineHeight={1.1} color={color}>
                    {value}
                  </Typography>
                  <Typography fontSize={11} fontWeight={600} textTransform="uppercase" letterSpacing="0.05em" color="text.secondary" mt={0.5}>
                    {label}
                  </Typography>
                </>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ── Tabs ── */}
      <Box>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, minHeight: 40 }}
          TabIndicatorProps={{ style: { height: 2 } }}
        >
          <Tab label="Addresses" sx={{ minHeight: 40, fontSize: 13, textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Inventory" sx={{ minHeight: 40, fontSize: 13, textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Team" sx={{ minHeight: 40, fontSize: 13, textTransform: 'none', fontWeight: 600 }} />
        </Tabs>

        {tab === 0 && <AddressesTab nurseryId={nurseryId} />}

        {tab === 1 && <InventoryTab nurseryId={nurseryId} />}

        {tab === 2 && (
          <Paper variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Member', 'Mobile', 'Role'].map((h) => (
                    <TableCell key={h}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} sx={{ border: 0 }}>
                      <Typography color="text.secondary" fontSize={13} py={2}>No team members.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <TableAvatar name={text(u.first_name)} size={26} />
                          <Box>
                            <Typography fontSize={13.5} fontWeight={500}>{text(u.first_name)}</Typography>
                            <Typography fontSize={11} color="text.secondary">{text(u.user_code)}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={13.5}>{text(u.mobile)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={toLabel(text(u.role_name))}
                          size="small"
                          sx={{ fontSize: 11, height: 20, '& .MuiChip-label': { px: 1 } }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>
    </Stack>
  );
}
