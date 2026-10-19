import { Box, Chip, Link, Paper, Typography } from '@mui/material';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type BotanicalFamily, useListBotanicalFamiliesQuery } from '../../api/adminResources';
import { AppDataTable } from '../../components/data-table/AppDataTable';
import { ErrorState } from '../../components/feedback/ErrorState';
import { TableSkeleton } from '../../components/feedback/LoadingState';
import { SearchInput } from '../../components/forms/SearchInput';
import { PageHeader } from '../../components/page/PageHeader';
import { normalizeApiError } from '../../utils/apiError';
import { formatCount } from './botanicalName';

type SortKey = 'family' | 'names' | 'accepted' | 'in_catalog';

/**
 * Admin → Categories: the plant families of the World Flora Online names.
 * Clicking a family opens Admin → Plants filtered to it.
 */
export function PlantFamiliesPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useListBotanicalFamiliesQuery();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortBy, setSortBy] = useState<SortKey>('names');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = (data?.families ?? []).filter((f) => !q || f.family.toLowerCase().includes(q));
    const dir = sortOrder === 'asc' ? 1 : -1;
    return [...list].sort((a, b) =>
      sortBy === 'family' ? a.family.localeCompare(b.family) * dir : (a[sortBy] - b[sortBy]) * dir,
    );
  }, [data, search, sortBy, sortOrder]);

  function handleSort(column: string) {
    const key = column as SortKey;
    if (key === sortBy) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(key);
      setSortOrder(key === 'family' ? 'asc' : 'desc');
    }
    setPage(0);
  }

  const columns: ColumnDef<BotanicalFamily>[] = [
    {
      id: 'family',
      header: 'Family',
      cell: ({ row }) =>
        row.original.family ? (
          <Link component="button" underline="hover" onClick={() => navigate(`/plants?family=${encodeURIComponent(row.original.family)}`)}>
            {row.original.family}
          </Link>
        ) : (
          <Typography color="text.secondary" fontSize={14}>(no family recorded)</Typography>
        ),
    },
    { id: 'names', header: 'Names', cell: ({ row }) => formatCount(row.original.names) },
    { id: 'accepted', header: 'Accepted', cell: ({ row }) => formatCount(row.original.accepted) },
    {
      id: 'in_catalog',
      header: 'In catalog',
      cell: ({ row }) =>
        row.original.in_catalog ? <Chip size="small" color="success" variant="outlined" label={formatCount(row.original.in_catalog)} /> : '—',
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Categories"
        description={
          data
            ? `Plant families from World Flora Online · ${formatCount(data.families.length)} families · ${formatCount(data.total_names)} names`
            : 'Plant families from World Flora Online'
        }
      />
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder="Search families, e.g. Rosaceae, Myrtaceae" />
      </Paper>
      {isLoading && <TableSkeleton rows={8} cols={4} />}
      {error && <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />}
      {data && (
        <AppDataTable
          columns={columns}
          data={rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage)}
          count={rows.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(0); }}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSort}
        />
      )}
    </Box>
  );
}
