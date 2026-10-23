import { Alert, Box, Button, Chip, Divider, Link, MenuItem, Stack, TextField, Typography } from '@mui/material';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import {
  type PlantSuggestion,
  type PlantSuggestionStatus,
  useCreatePlantMutation,
  useListPlantSuggestionsQuery,
  useReviewPlantSuggestionMutation,
} from '../../api/adminResources';
import { AppDataTable } from '../../components/data-table/AppDataTable';
import { ErrorState } from '../../components/feedback/ErrorState';
import { TableSkeleton } from '../../components/feedback/LoadingState';
import { useToast } from '../../components/feedback/toastContext';
import { FormDrawer } from '../../components/forms/FormDrawer';
import { PageHeader } from '../../components/page/PageHeader';
import { normalizeApiError } from '../../utils/apiError';
import { type Picked, PlantPicker } from '../topItems/pickers';
import { PlantForm } from './PlantForm';

const statusColor: Record<PlantSuggestionStatus, 'warning' | 'success' | 'info' | 'default'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  LINKED: 'info',
  REJECTED: 'default',
};
const statusLabel: Record<PlantSuggestionStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Added',
  LINKED: 'Linked',
  REJECTED: 'Rejected',
};

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
}

/**
 * Admin → Plant Suggestions: plants users could not find in search. Only these
 * actions change the plants master data: add as a new plant, link to an
 * existing one (fills its common name if empty), or reject with a reason.
 * Names the catalog already has, and repeats, never reach this queue.
 */
export function PlantSuggestionsPage() {
  const [status, setStatus] = useState<string>('PENDING');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [open, setOpen] = useState<PlantSuggestion | null>(null);
  const { data, isFetching, error, refetch } = useListPlantSuggestionsQuery({ status, page: page + 1, per_page: rowsPerPage });

  const columns: ColumnDef<PlantSuggestion>[] = [
    {
      id: '_name',
      header: 'Suggested plant',
      cell: ({ row }) => (
        <Link component="button" underline="hover" onClick={() => setOpen(row.original)} sx={{ textAlign: 'left' }}>
          <Typography fontSize={13} fontWeight={600}>{row.original.name}</Typography>
          {row.original.scientific_name && <Typography fontSize={12} color="text.secondary" fontStyle="italic">{row.original.scientific_name}</Typography>}
        </Link>
      ),
    },
    { id: '_notes', header: 'Notes', cell: ({ row }) => row.original.notes ?? '—' },
    {
      id: '_by',
      header: 'Suggested by',
      cell: ({ row }) => (
        <Box>
          <Typography fontSize={13}>{row.original.suggested_by_name || `User #${row.original.suggested_by_user_id}`}</Typography>
          <Typography fontSize={12} color="text.secondary">{row.original.suggested_by_mobile}</Typography>
        </Box>
      ),
    },
    { id: '_when', header: 'Received', cell: ({ row }) => formatDate(row.original.created_at) },
    {
      id: '_status',
      header: 'Status',
      cell: ({ row }) => (
        <Stack spacing={0.5} alignItems="flex-start">
          <Chip size="small" color={statusColor[row.original.status]} label={statusLabel[row.original.status]} sx={{ height: 22, fontSize: 11 }} />
          {row.original.plant_name && <Typography fontSize={12} color="text.secondary">→ {row.original.plant_name}</Typography>}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Plant Suggestions"
        description="Plants users could not find. Add them to the catalog, link them to an existing plant, or reject them. The user gets a notification."
      />
      <TextField
        select
        size="small"
        label="Status"
        value={status}
        onChange={(e) => { setStatus(e.target.value); setPage(0); }}
        sx={{ minWidth: 180, mb: 2 }}
      >
        <MenuItem value="PENDING">Pending</MenuItem>
        <MenuItem value="APPROVED">Added</MenuItem>
        <MenuItem value="LINKED">Linked</MenuItem>
        <MenuItem value="REJECTED">Rejected</MenuItem>
        <MenuItem value="">All</MenuItem>
      </TextField>
      {isFetching && <TableSkeleton rows={6} cols={columns.length} />}
      {error && <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />}
      {!isFetching && !error && (
        <AppDataTable
          columns={columns}
          data={data?.suggestions ?? []}
          count={data?.total ?? 0}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(0); }}
        />
      )}

      <FormDrawer open={open !== null} title="Plant suggestion" onClose={() => setOpen(null)} width={{ xs: '100%', sm: 640 }}>
        {open && <ReviewPanel key={open.id} suggestion={open} onDone={() => setOpen(null)} />}
      </FormDrawer>
    </Box>
  );
}

function ReviewPanel({ suggestion: s, onDone }: { suggestion: PlantSuggestion; onDone: () => void }) {
  const { showToast } = useToast();
  const [review, reviewState] = useReviewPlantSuggestionMutation();
  const [createPlant, createState] = useCreatePlantMutation();
  const [linkTo, setLinkTo] = useState<Picked | null>(null);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const busy = reviewState.isLoading || createState.isLoading;

  async function decide(action: 'APPROVED' | 'LINKED' | 'REJECTED', plantId?: number) {
    setErr('');
    try {
      await review({ id: s.id, action, plant_id: plantId, note: action === 'REJECTED' ? reason.trim() : undefined }).unwrap();
      showToast(action === 'REJECTED' ? 'Suggestion rejected' : 'Plant saved — the user was notified', 'success');
      onDone();
    } catch (e) {
      setErr(normalizeApiError(e).message);
    }
  }

  async function addNew(values: Record<string, unknown>) {
    setErr('');
    try {
      const res = await createPlant(values).unwrap();
      await decide('APPROVED', Number(res.plant.id));
    } catch (e) {
      setErr(normalizeApiError(e).message);
    }
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h6">{s.name}</Typography>
        {s.scientific_name && <Typography fontStyle="italic" color="text.secondary">{s.scientific_name}</Typography>}
        {s.notes && <Typography mt={1}>{s.notes}</Typography>}
        <Typography fontSize={13} color="text.secondary" mt={1}>
          By {s.suggested_by_name || `User #${s.suggested_by_user_id}`} {s.suggested_by_mobile} · {formatDate(s.created_at)}
        </Typography>
      </Box>
      {err && <Alert severity="error">{err}</Alert>}

      {s.status !== 'PENDING' ? (
        <Alert severity="info">
          {statusLabel[s.status]}{s.plant_name ? ` → ${s.plant_name}` : ''}{s.review_note ? ` — ${s.review_note}` : ''} ({formatDate(s.reviewed_at)})
        </Alert>
      ) : (
        <>
          <Divider />
          <Box>
            <Typography fontWeight={700} mb={0.5}>It is a plant we have, or a botanical name</Typography>
            <Typography fontSize={13} color="text.secondary" mb={1.5}>
              Pick it. If it has no common name yet, it gets "{s.name}".
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-start' }}>
              <Box flex={1}><PlantPicker value={linkTo} onChange={setLinkTo} label="Existing plant" /></Box>
              <Button variant="contained" disabled={!linkTo || busy} onClick={() => linkTo && void decide('LINKED', linkTo.id)} sx={{ mt: { sm: 0.5 } }}>
                Link
              </Button>
            </Stack>
          </Box>

          <Divider />
          <Box>
            <Typography fontWeight={700} mb={0.5}>It is new: add it to the catalog</Typography>
            <Typography fontSize={13} color="text.secondary" mb={1.5}>
              Check the scientific name (pick a botanical name when there is one). If it already exists, the catalog refuses the duplicate.
            </Typography>
            <PlantForm
              initial={{ scientific_name: s.scientific_name ?? s.name, common_name: s.name }}
              loading={busy}
              onSubmit={(v) => void addNew(v)}
            />
          </Box>

          <Divider />
          <Box>
            <Typography fontWeight={700} mb={1}>Reject</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                size="small"
                fullWidth
                label="Reason (sent to the user)"
                placeholder="e.g. Not a plant name"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button color="error" variant="outlined" disabled={!reason.trim() || busy} onClick={() => void decide('REJECTED')}>
                Reject
              </Button>
            </Stack>
          </Box>
        </>
      )}
    </Stack>
  );
}
