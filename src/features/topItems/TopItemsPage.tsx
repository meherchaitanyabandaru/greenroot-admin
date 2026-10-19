import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import type { ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import {
  type TopItem,
  type TopItemInput,
  useCreateTopItemMutation,
  useDeleteTopItemMutation,
  useListTopItemsQuery,
  useUpdateTopItemMutation,
} from '../../api/adminResources';
import { AppDataTable } from '../../components/data-table/AppDataTable';
import { ErrorState } from '../../components/feedback/ErrorState';
import { TableSkeleton } from '../../components/feedback/LoadingState';
import { useToast } from '../../components/feedback/toastContext';
import { FormDrawer } from '../../components/forms/FormDrawer';
import { SearchInput } from '../../components/forms/SearchInput';
import { PageHeader } from '../../components/page/PageHeader';
import { normalizeApiError } from '../../utils/apiError';
import { formatCurrency } from '../../utils/labels';
import { NurseryPicker, type Picked, PlantPicker } from './pickers';
import { TopItemForm } from './TopItemForm';

const MAX_PER_NURSERY = 20;

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Admin → Top Items: every nursery's showcase (up to 20 plants each), across
 * thousands of nurseries. Search, nursery and plant filters and paging all run
 * on the server; pick a nursery to see its list in display order.
 */
export function TopItemsPage() {
  const { showToast } = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [nursery, setNursery] = useState<Picked | null>(null);
  const [plant, setPlant] = useState<Picked | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [editing, setEditing] = useState<TopItem | 'new' | null>(null);
  const [removing, setRemoving] = useState<TopItem | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isFetching, error, refetch } = useListTopItemsQuery({
    search: search || undefined,
    nursery_id: nursery?.id,
    plant_id: plant?.id,
    page: page + 1,
    per_page: rowsPerPage,
  });
  const [createTopItem, createState] = useCreateTopItemMutation();
  const [updateTopItem, updateState] = useUpdateTopItemMutation();
  const [deleteTopItem, deleteState] = useDeleteTopItemMutation();
  const total = data?.pagination?.total ?? 0;
  const nurseryFull = !!nursery && !search && !plant && total >= MAX_PER_NURSERY;

  async function save(body: TopItemInput) {
    if (editing === 'new') {
      await createTopItem(body).unwrap();
      showToast('Top item added');
    } else if (editing) {
      await updateTopItem({ id: editing.id, body }).unwrap();
      showToast('Top item saved');
    }
    setEditing(null);
  }

  async function remove() {
    if (!removing) return;
    await deleteTopItem(removing.id).unwrap();
    showToast('Top item removed');
    setRemoving(null);
  }

  const allColumns: ColumnDef<TopItem>[] = [
    {
      id: '_nursery',
      header: 'Nursery',
      cell: ({ row }) => (
        <Box>
          <Typography
            fontSize={13.5}
            fontWeight={600}
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => { setNursery({ id: row.original.nursery_id, label: row.original.nursery_name }); setPage(0); }}
          >
            {row.original.nursery_name}
          </Typography>
          <Typography fontSize={12} color="text.secondary">{row.original.top_item_code}</Typography>
        </Box>
      ),
    },
    { id: '_order', header: '#', cell: ({ row }) => row.original.display_order + 1 },
    {
      id: '_plant',
      header: 'Plant',
      cell: ({ row }) => (
        <Box>
          <Typography fontSize={13.5}>{row.original.common_name || row.original.scientific_name}</Typography>
          {row.original.common_name && (
            <Typography fontSize={12} color="text.secondary" fontStyle="italic">{row.original.scientific_name}</Typography>
          )}
        </Box>
      ),
    },
    { id: '_size', header: 'Size', cell: ({ row }) => row.original.size_name },
    { id: '_price', header: 'Price', cell: ({ row }) => (row.original.unit_price != null ? formatCurrency(row.original.unit_price) : '—') },
    {
      id: '_notes',
      header: 'Notes',
      cell: ({ row }) => (
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Typography fontSize={12.5} color="text.secondary" sx={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.original.quality_notes || '—'}
          </Typography>
          {row.original.photos.length > 0 && (
            <Chip size="small" icon={<PhotoLibraryOutlinedIcon />} label={row.original.photos.length} sx={{ height: 22, fontSize: 11 }} />
          )}
        </Stack>
      ),
    },
    { id: '_updated', header: 'Updated', cell: ({ row }) => formatDate(row.original.updated_at) },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Stack direction="row" justifyContent="flex-end">
          <Tooltip title="Edit">
            <span>
              <IconButton size="small" disabled={row.original.capabilities?.can_edit === false} onClick={() => setEditing(row.original)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Remove">
            <span>
              <IconButton size="small" disabled={row.original.capabilities?.can_delete === false} onClick={() => setRemoving(row.original)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  // With one nursery chosen, its name would repeat on every row: show the code only.
  const columns = nursery
    ? allColumns.map((c) =>
        c.id === '_nursery'
          ? { id: '_code', header: 'Code', cell: ({ row }: { row: { original: TopItem } }) => row.original.top_item_code }
          : c,
      )
    : allColumns;

  const mutationError = createState.error || updateState.error;

  return (
    <Box>
      <PageHeader
        title="Top Items"
        description="What each nursery is known for — up to 20 plants with size, an indicative price, notes and photos. Not stock: orders never change these."
        action={
          <Tooltip title={nurseryFull ? `${nursery?.label} already lists ${MAX_PER_NURSERY} top items` : ''}>
            <span>
              <Button variant="contained" startIcon={<AddIcon />} disabled={nurseryFull} onClick={() => setEditing('new')}>
                Add top item
              </Button>
            </span>
          </Tooltip>
        }
      />
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search plant, nursery or TOP- code" />
          <NurseryPicker value={nursery} onChange={(v) => { setNursery(v); setPage(0); }} label="Nursery" />
          <PlantPicker value={plant} onChange={(v) => { setPlant(v); setPage(0); }} label="Plant" />
          {nursery && !search && !plant && (
            <Chip
              color={nurseryFull ? 'warning' : 'default'}
              label={`${total} of ${MAX_PER_NURSERY}`}
              sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
            />
          )}
        </Stack>
      </Paper>
      {isFetching && <TableSkeleton rows={8} cols={columns.length} />}
      {error && <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />}
      {!isFetching && !error && (
        <AppDataTable
          columns={columns}
          data={data?.top_items ?? []}
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(0); }}
        />
      )}

      <FormDrawer open={editing !== null} title={editing === 'new' ? 'Add top item' : 'Edit top item'} onClose={() => setEditing(null)}>
        {editing !== null && (
          <TopItemForm
            key={editing === 'new' ? 'new' : editing.id}
            item={editing === 'new' ? undefined : editing}
            nursery={nursery}
            loading={createState.isLoading || updateState.isLoading}
            error={mutationError ? normalizeApiError(mutationError).message : undefined}
            onSubmit={(body) => void save(body).catch(() => undefined)}
          />
        )}
      </FormDrawer>

      <Dialog open={removing !== null} onClose={() => setRemoving(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove this top item?</DialogTitle>
        <DialogContent>
          {deleteState.error && <Alert severity="error" sx={{ mb: 1.5 }}>{normalizeApiError(deleteState.error).message}</Alert>}
          <Typography fontSize={14}>
            {removing && `${removing.common_name || removing.scientific_name} (${removing.size_name}) will no longer be shown for ${removing.nursery_name}.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoving(null)}>Cancel</Button>
          <Button color="error" variant="contained" disabled={deleteState.isLoading} onClick={() => void remove().catch(() => undefined)}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
