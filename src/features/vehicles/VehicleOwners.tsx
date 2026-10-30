import { Alert, Autocomplete, Box, Button, Chip, Link, Stack, TextField, Typography } from '@mui/material';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { AppDataTable } from '../../components/data-table/AppDataTable';
import { ErrorState } from '../../components/feedback/ErrorState';
import { TableSkeleton } from '../../components/feedback/LoadingState';
import { useToast } from '../../components/feedback/toastContext';
import { FormDrawer } from '../../components/forms/FormDrawer';
import { PageHeader } from '../../components/page/PageHeader';
import { normalizeApiError } from '../../utils/apiError';
import { type VehicleOwner, useListVehicleOwnersQuery, useSaveVehicleOwnerMutation } from './vehiclesApi';

/** Owner tag: whether they also use the GreenRoot app (owners do not need to). */
function AccountChip({ owner }: { owner: VehicleOwner }) {
  return owner.has_account
    ? <Chip size="small" color="info" label="Also a GreenRoot user" />
    : <Chip size="small" variant="outlined" label="No app account" />;
}

function OwnerForm({ owner, onDone }: { owner?: VehicleOwner; onDone: () => void }) {
  const { showToast } = useToast();
  const [save, state] = useSaveVehicleOwnerMutation();
  const [name, setName] = useState(owner?.name ?? '');
  const [mobile, setMobile] = useState(owner?.mobile ?? '');
  const [notes, setNotes] = useState(owner?.notes ?? '');
  const [err, setErr] = useState('');
  const digits = mobile.replace(/\D/g, '');
  const mobileBad = digits.length > 0 && digits.length < 10;

  async function submit() {
    setErr('');
    try {
      await save({ id: owner?.id, name: name.trim(), mobile: mobile.trim() || null, notes: notes.trim() || null }).unwrap();
      showToast('Owner saved', 'success');
      onDone();
    } catch (e) {
      setErr(normalizeApiError(e).message);
    }
  }

  return (
    <Stack spacing={2}>
      {err && <Alert severity="error">{err}</Alert>}
      <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <TextField
        label="Mobile (optional)"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
        error={mobileBad}
        helperText={mobileBad ? 'Enter a 10-digit mobile number or leave it empty' : 'The owner does not need the GreenRoot app.'}
      />
      <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} />
      <Button variant="contained" disabled={!name.trim() || mobileBad || state.isLoading} onClick={() => void submit()}>
        Save owner
      </Button>
    </Stack>
  );
}

/** Admin → Lorry Owners: owners need no GreenRoot account; one owner has many lorries. */
export function VehicleOwnersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [editing, setEditing] = useState<VehicleOwner | 'new' | null>(null);
  const { data, isFetching, error, refetch } = useListVehicleOwnersQuery({ search: search || undefined, page: page + 1, per_page: rowsPerPage });

  const columns: ColumnDef<VehicleOwner>[] = [
    {
      id: '_name',
      header: 'Owner',
      cell: ({ row }) => (
        <Link component="button" underline="hover" onClick={() => setEditing(row.original)} sx={{ textAlign: 'left' }}>
          <Typography fontSize={13} fontWeight={600}>{row.original.name}</Typography>
        </Link>
      ),
    },
    { id: '_mobile', header: 'Mobile', cell: ({ row }) => row.original.mobile ?? '—' },
    { id: '_account', header: 'Account', cell: ({ row }) => <AccountChip owner={row.original} /> },
    { id: '_lorries', header: 'Lorries', cell: ({ row }) => row.original.vehicle_count },
    { id: '_notes', header: 'Notes', cell: ({ row }) => row.original.notes ?? '—' },
  ];

  return (
    <Box>
      <PageHeader
        title="Lorry Owners"
        description="Who owns each lorry. Owners do not need the app; an owner who also drives uses their normal driver account."
        action={<Button variant="contained" onClick={() => setEditing('new')}>Add owner</Button>}
      />
      <TextField size="small" label="Search name or mobile" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ minWidth: 280, mb: 2 }} />
      {isFetching && <TableSkeleton rows={6} cols={columns.length} />}
      {error && <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />}
      {!isFetching && !error && (
        <AppDataTable
          columns={columns}
          data={data?.owners ?? []}
          count={data?.pagination.total ?? 0}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(0); }}
        />
      )}
      <FormDrawer open={editing !== null} title={editing === 'new' ? 'Add owner' : 'Edit owner'} onClose={() => setEditing(null)}>
        {editing && <OwnerForm key={editing === 'new' ? 'new' : editing.id} owner={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
      </FormDrawer>
    </Box>
  );
}

export type OwnerOption = { id: number; name: string; mobile?: string | null };

/** Pick a lorry owner by name or mobile (server-side search). */
export function OwnerPicker({
  value,
  onChange,
}: {
  value: OwnerOption | null;
  onChange: (owner: OwnerOption | null) => void;
}) {
  const [input, setInput] = useState('');
  const { data, isFetching } = useListVehicleOwnersQuery({ search: input || undefined, per_page: 20 });
  const options = data?.owners ?? [];
  return (
    <Autocomplete
      value={value}
      onChange={(_, v) => onChange(v ? { id: v.id, name: v.name, mobile: v.mobile } : null)}
      inputValue={input}
      onInputChange={(_, v) => setInput(v)}
      options={options as OwnerOption[]}
      loading={isFetching}
      filterOptions={(o) => o}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      getOptionLabel={(o) => o.name}
      renderOption={(props, o) => (
        <li {...props} key={o.id}>
          {o.name}{o.mobile ? ` · ${o.mobile}` : ''}
        </li>
      )}
      renderInput={(params) => <TextField {...params} label="Owner" helperText="Add new owners under Logistics → Lorry Owners" />}
    />
  );
}
