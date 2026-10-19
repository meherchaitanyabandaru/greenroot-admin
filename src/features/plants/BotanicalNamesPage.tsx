import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  Link,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import type { ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  type BotanicalRow,
  useGetBotanicalNameQuery,
  useListBotanicalNamesQuery,
  useResolvePlantMutation,
} from '../../api/adminResources';
import { AppDataTable } from '../../components/data-table/AppDataTable';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState, TableSkeleton } from '../../components/feedback/LoadingState';
import { FormDrawer } from '../../components/forms/FormDrawer';
import { SearchInput } from '../../components/forms/SearchInput';
import { PageHeader } from '../../components/page/PageHeader';
import { StatusChip } from '../../components/status/StatusChip';
import { normalizeApiError } from '../../utils/apiError';
import { formatCount } from './botanicalName';
import { PlantDetailPanel } from './PlantDetailPanel';

const RANKS = ['species', 'subspecies', 'variety', 'form', 'genus', 'family'];
const STATUSES = ['ACCEPTED', 'SYNONYM', 'UNCHECKED'];
const wfoUrl = (id: string) => `https://www.worldfloraonline.org/taxon/${id}`;

/**
 * Admin → Plants: every World Flora Online name (~16.6 lakh), searchable and
 * filterable. Filters live in the URL, so Admin → Categories can link to a
 * family. A name's species is "in catalog" once a nursery picked it or an
 * admin added it; the catalog plant is edited from the name's drawer.
 */
export function BotanicalNamesPage() {
  const [params, setParams] = useSearchParams();
  const family = params.get('family') ?? '';
  const status = params.get('status') ?? '';
  const rank = params.get('rank') ?? '';
  const inCatalog = params.get('in_catalog') ?? '';
  // Old names (synonyms) are hidden by default: one row per plant.
  const showSynonyms = params.get('show_synonyms') === 'true' || status === 'SYNONYM';
  const [searchInput, setSearchInput] = useState(params.get('search') ?? '');
  const [search, setSearch] = useState(searchInput);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [openWfoId, setOpenWfoId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setPage(0);
  }

  const { data, isFetching, error, refetch } = useListBotanicalNamesQuery({
    page: page + 1,
    per_page: rowsPerPage,
    search: search || undefined,
    family: family || undefined,
    status: status || undefined,
    rank: rank || undefined,
    in_catalog: inCatalog || undefined,
    show_synonyms: showSynonyms ? 'true' : undefined,
    sort_by: sortBy,
    sort_order: sortBy ? sortOrder : undefined,
  });

  function handleSort(column: string) {
    if (sortBy === column) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(0);
  }

  const columns: ColumnDef<BotanicalRow>[] = [
    {
      id: 'scientific_name',
      header: 'Scientific name',
      cell: ({ row }) => (
        <Link component="button" underline="hover" onClick={() => setOpenWfoId(row.original.wfo_id)} sx={{ textAlign: 'left' }}>
          <Typography component="span" fontStyle="italic" fontSize={14}>{row.original.scientific_name}</Typography>
          {row.original.authorship && (
            <Typography component="span" fontSize={12} color="text.secondary"> {row.original.authorship}</Typography>
          )}
          {row.original.matched_name && (
            <Typography fontSize={12} color="text.secondary">
              matched old name <i>{row.original.matched_name}</i>
            </Typography>
          )}
        </Link>
      ),
    },
    {
      id: '_english',
      header: 'English name',
      cell: ({ row }) => row.original.english_name ?? '—',
    },
    {
      id: 'family',
      header: 'Family',
      cell: ({ row }) =>
        row.original.family ? (
          <Link component="button" underline="hover" color="inherit" onClick={() => setFilter('family', row.original.family!)}>
            {row.original.family}
          </Link>
        ) : '—',
    },
    { id: '_rank', header: 'Rank', cell: ({ row }) => row.original.taxon_rank },
    { id: '_status', header: 'Status', cell: ({ row }) => <StatusChip value={row.original.status} /> },
    showSynonyms
      ? {
          id: '_accepted',
          header: 'Accepted name',
          cell: ({ row }) =>
            row.original.accepted_name ? (
              <Typography fontSize={13} fontStyle="italic">→ {row.original.accepted_name}</Typography>
            ) : '—',
        }
      : {
          id: '_old_names',
          header: 'Old names',
          cell: ({ row }) => (row.original.synonym_count ? formatCount(row.original.synonym_count) : '—'),
        },
    {
      id: '_catalog',
      header: 'Catalog',
      cell: ({ row }) =>
        row.original.catalog_plant_code ? (
          <Chip size="small" color="success" variant="outlined" label={row.original.catalog_plant_code} />
        ) : '—',
    },
    { id: '_wfo', header: 'WFO id', cell: ({ row }) => <Typography fontSize={12} color="text.secondary">{row.original.wfo_id}</Typography> },
  ];

  const total = data?.pagination?.total ?? 0;

  return (
    <Box>
      <PageHeader
        title="Plants"
        description={`World Flora Online · ${formatCount(total)} ${search || family || status || rank || inCatalog ? 'matching' : showSynonyms ? 'names' : 'plants'}${showSynonyms ? ' (old names included)' : ' · old names hidden'}`}
      />

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <Box flex={2}>
            <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search scientific or English names, e.g. neem, mango, cumini, ficus" />
          </Box>
          <TextField select size="small" label="Status" value={status} onChange={(e) => setFilter('status', e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="">All</MenuItem>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Rank" value={rank} onChange={(e) => setFilter('rank', e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="">All</MenuItem>
            {RANKS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Catalog" value={inCatalog} onChange={(e) => setFilter('in_catalog', e.target.value)} sx={{ minWidth: 150 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">In catalog</MenuItem>
            <MenuItem value="false">Not in catalog</MenuItem>
          </TextField>
          <FormControlLabel
            sx={{ whiteSpace: 'nowrap' }}
            control={
              <Switch
                checked={showSynonyms}
                disabled={status === 'SYNONYM'}
                onChange={(e) => setFilter('show_synonyms', e.target.checked ? 'true' : '')}
              />
            }
            label="Show old names"
          />
        </Stack>
        {family && (
          <Chip sx={{ mt: 1.5 }} label={`Family: ${family}`} onDelete={() => setFilter('family', '')} color="primary" variant="outlined" />
        )}
      </Paper>

      {isFetching && <TableSkeleton rows={8} cols={columns.length} />}
      {error && <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />}
      {!isFetching && !error && (
        <AppDataTable
          columns={columns}
          data={data?.names ?? []}
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(0); }}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSort}
        />
      )}

      <FormDrawer
        open={openWfoId !== null}
        title="Botanical name"
        onClose={() => setOpenWfoId(null)}
        width={{ xs: '100%', sm: 760 }}
      >
        {openWfoId && <BotanicalNameDetail key={openWfoId} wfoId={openWfoId} onOpen={setOpenWfoId} />}
      </FormDrawer>
    </Box>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <Box minWidth={140}>
      <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.05em">{label}</Typography>
      <Typography fontSize={13.5} mt={0.25}>{value || '—'}</Typography>
    </Box>
  );
}

function BotanicalNameDetail({ wfoId, onOpen }: { wfoId: string; onOpen: (wfoId: string) => void }) {
  const { data, isLoading, error, refetch } = useGetBotanicalNameQuery(wfoId);
  const [resolvePlant, resolveState] = useResolvePlantMutation();
  const [addedPlantId, setAddedPlantId] = useState<number | null>(null);

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />;

  const { name, accepted, synonyms, synonym_count } = data;
  const species = accepted ?? name;
  const plantId = addedPlantId ?? species.catalog_plant_id ?? null;

  async function addToCatalog() {
    const res = await resolvePlant(name.wfo_id).unwrap();
    setAddedPlantId(Number(res.plant.id));
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6" fontStyle="italic">{name.scientific_name}</Typography>
          <StatusChip value={name.status} />
        </Stack>
        {species.english_name && <Typography fontWeight={600}>{species.english_name}</Typography>}
        {name.authorship && <Typography color="text.secondary" fontSize={13}>{name.authorship}</Typography>}
        <Link href={wfoUrl(name.wfo_id)} target="_blank" rel="noreferrer" fontSize={13} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          {name.wfo_id} on World Flora Online <OpenInNewIcon sx={{ fontSize: 14 }} />
        </Link>
      </Box>

      <Stack direction="row" flexWrap="wrap" gap={2}>
        <Field label="Family" value={name.family} />
        <Field label="Genus" value={name.genus} />
        <Field label="Rank" value={name.taxon_rank} />
      </Stack>

      {accepted && (
        <Alert severity="info">
          This is an old name (synonym). The accepted name is{' '}
          <Link component="button" onClick={() => onOpen(accepted.wfo_id)} fontStyle="italic">{accepted.scientific_name}</Link>
          ; the catalog keeps one plant per accepted species.
        </Alert>
      )}

      <Divider />

      <Box>
        <Typography fontWeight={700} mb={1}>Catalog</Typography>
        {resolveState.error && <Alert severity="error" sx={{ mb: 1 }}>{normalizeApiError(resolveState.error).message}</Alert>}
        {plantId ? (
          <PlantDetailPanel plantId={plantId} />
        ) : (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography color="text.secondary" fontSize={14}>
              Not in the catalog yet. Nurseries add it automatically when they pick it.
            </Typography>
            <Button variant="contained" size="small" disabled={resolveState.isLoading} onClick={addToCatalog}>
              Add to catalog
            </Button>
          </Stack>
        )}
      </Box>

      <Divider />

      <Box>
        <Typography fontWeight={700} mb={1}>
          Synonyms of {species.scientific_name} ({formatCount(synonym_count)})
        </Typography>
        {synonyms.length === 0 ? (
          <Typography color="text.secondary" fontSize={14}>No synonyms.</Typography>
        ) : (
          <Stack spacing={0.5}>
            {synonyms.map((s) => (
              <Link key={s.wfo_id} component="button" underline="hover" onClick={() => onOpen(s.wfo_id)} sx={{ textAlign: 'left' }}>
                <Typography component="span" fontStyle="italic" fontSize={13.5}>{s.scientific_name}</Typography>
                {s.authorship && <Typography component="span" fontSize={12} color="text.secondary"> {s.authorship}</Typography>}
              </Link>
            ))}
            {synonym_count > synonyms.length && (
              <Typography color="text.secondary" fontSize={12}>and {formatCount(synonym_count - synonyms.length)} more</Typography>
            )}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
