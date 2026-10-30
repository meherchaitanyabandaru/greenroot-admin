import { Alert, Box, Button, Chip, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { baseApi } from '../../api/baseApi';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useToast } from '../../components/feedback/toastContext';
import { normalizeApiError } from '../../utils/apiError';

// Other names of a catalog plant: local/regional, common, synonym, trade,
// frequent misspelling. Search finds the plant by them. Retiring one (a wrong
// mapping or a duplicate) never changes quotations made with it.

const ALIAS_TYPES = ['LOCAL', 'COMMON', 'SYNONYM', 'TRADE', 'MISSPELLING'] as const;

type PlantAlias = {
  id: number;
  plant_id: number;
  plant_name: string;
  name: string;
  alias_type: string;
  language?: string | null;
  region?: string | null;
  source: 'ADMIN' | 'SUGGESTION';
  is_active: boolean;
  created_at: string;
  other_plant_ids: number[];
};

type AliasBody = { name: string; alias_type: string; language?: string; region?: string; is_active?: boolean };

const aliasesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPlantAliases: builder.query<{ aliases: PlantAlias[]; total: number }, { plantId?: number; search?: string }>({
      query: ({ plantId, search }) => ({ url: plantId ? `/api/v1/plants/${plantId}/aliases` : '/api/v1/plants/aliases', params: { search, per_page: 100 } }),
      providesTags: ['Plants'],
    }),
    createPlantAlias: builder.mutation<{ alias: PlantAlias }, { plantId: number; body: AliasBody }>({
      query: ({ plantId, body }) => ({ url: `/api/v1/plants/${plantId}/aliases`, method: 'POST', body }),
      invalidatesTags: ['Plants'],
    }),
    updatePlantAlias: builder.mutation<{ alias: PlantAlias }, { id: number; body: AliasBody }>({
      query: ({ id, body }) => ({ url: `/api/v1/plants/aliases/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Plants'],
    }),
  }),
});

const { useListPlantAliasesQuery, useCreatePlantAliasMutation, useUpdatePlantAliasMutation } = aliasesApi;

/** A plant's other names: add, retire, see where else a name is used. */
export function PlantAliases({ plantId }: { plantId: number }) {
  const { showToast } = useToast();
  const { data, isLoading, error, refetch } = useListPlantAliasesQuery({ plantId });
  const [create, createState] = useCreatePlantAliasMutation();
  const [update, updateState] = useUpdatePlantAliasMutation();
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('LOCAL');
  const [language, setLanguage] = useState('');
  const [region, setRegion] = useState('');
  const [err, setErr] = useState('');

  async function add() {
    setErr('');
    try {
      await create({ plantId, body: { name: name.trim(), alias_type: type, language: language || undefined, region: region || undefined } }).unwrap();
      setName('');
      showToast('Name added — search finds the plant by it', 'success');
    } catch (e) {
      setErr(normalizeApiError(e).message);
    }
  }

  async function setActive(a: PlantAlias, active: boolean) {
    try {
      await update({ id: a.id, body: { name: a.name, alias_type: a.alias_type, language: a.language ?? undefined, region: a.region ?? undefined, is_active: active } }).unwrap();
      showToast(active ? 'Name restored' : 'Name retired', 'success');
    } catch (e) {
      showToast(normalizeApiError(e).message, 'error');
    }
  }

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />;
  const aliases = data?.aliases ?? [];

  return (
    <Stack spacing={2}>
      <Typography fontSize={13} color="text.secondary">
        Names people use for this plant. Search matches them (and near spellings). Names linked from customer requests appear here too.
      </Typography>
      {err && <Alert severity="error">{err}</Alert>}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <TextField size="small" label="Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ flex: 2 }} />
        <TextField size="small" select label="Type" value={type} onChange={(e) => setType(e.target.value)} sx={{ minWidth: 140 }}>
          {ALIAS_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <TextField size="small" label="Language (e.g. te)" value={language} onChange={(e) => setLanguage(e.target.value)} sx={{ maxWidth: 140 }} />
        <TextField size="small" label="Region" value={region} onChange={(e) => setRegion(e.target.value)} sx={{ flex: 1 }} />
        <Button variant="contained" disabled={name.trim().length < 2 || createState.isLoading} onClick={() => void add()}>Add</Button>
      </Stack>
      {aliases.length === 0 ? (
        <Typography color="text.secondary" fontSize={13}>No other names yet.</Typography>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Name', 'Type', 'Language / region', 'Source', ''].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {aliases.map((a) => (
                <TableRow key={a.id} sx={{ opacity: a.is_active ? 1 : 0.5 }}>
                  <TableCell>
                    {a.name}
                    {a.other_plant_ids.length > 0 && (
                      <Chip size="small" color="warning" variant="outlined" sx={{ ml: 1 }} label={`also on plant ${a.other_plant_ids.join(', ')}`} />
                    )}
                  </TableCell>
                  <TableCell>{a.alias_type}</TableCell>
                  <TableCell>{[a.language, a.region].filter(Boolean).join(' · ') || '—'}</TableCell>
                  <TableCell>{a.source === 'SUGGESTION' ? 'Customer name' : 'Admin'}</TableCell>
                  <TableCell align="right">
                    <Button size="small" disabled={updateState.isLoading} onClick={() => void setActive(a, !a.is_active)}>
                      {a.is_active ? 'Retire' : 'Restore'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Stack>
  );
}
