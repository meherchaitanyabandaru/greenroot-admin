import { Box, Button, Card, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useToast } from '../../components/feedback/toastContext';
import { PageHeader } from '../../components/page/PageHeader';
import { normalizeApiError } from '../../utils/apiError';
import { type ArchiveQuery, financialYears, useGetArchiveQuery, useLazyDownloadArchiveQuery } from './archiveApi';

const inr = (n?: number | null) => (n == null ? '-' : `₹${n.toLocaleString('en-IN')}`);

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Admin → Archive: orders and quotations by Indian financial year (April–March).
 * Archiving moves nothing: these are the live records, read by financial year.
 */
export function ArchivePage() {
  const years = financialYears();
  const [type, setType] = useState<ArchiveQuery['type']>('orders');
  const [fy, setFy] = useState(years[0]);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const query: ArchiveQuery = { type, fy, q, page };
  const { data, isFetching, error, refetch } = useGetArchiveQuery(query);
  const [fetchFile, fileState] = useLazyDownloadArchiveQuery();
  const toast = useToast();

  const exportAs = async (format: 'csv' | 'pdf') => {
    try {
      const out = await fetchFile({ query: { ...query, page: 1 }, format }).unwrap();
      download(out.blob, out.filename ?? `greenroot-${type}-FY${fy}.${format}`);
    } catch (e) {
      toast.showToast(normalizeApiError(e).message, 'error');
    }
  };

  return (
    <Box>
      <PageHeader title="Archive" description="Orders and quotations by financial year (1 April – 31 March, India time). Nothing is moved or deleted to archive it." />
      <Tabs value={type} onChange={(_, v) => { setType(v); setPage(1); }} sx={{ mb: 2 }}>
        <Tab value="orders" label="Orders" />
        <Tab value="quotations" label="Quotations" />
      </Tabs>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} mb={2} alignItems={{ md: 'center' }}>
        <TextField select SelectProps={{ native: true }} size="small" label="Financial year" value={fy}
          onChange={(e) => { setFy(e.target.value); setPage(1); }} sx={{ minWidth: 160 }}>
          {years.map((y) => <option key={y} value={y}>FY {y}</option>)}
        </TextField>
        <TextField size="small" label="Search: code, customer or nursery" value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setQ(search); setPage(1); } }} sx={{ flex: 1 }} />
        <Button variant="outlined" onClick={() => { setQ(search); setPage(1); }}>Search</Button>
        <Button onClick={() => void exportAs('csv')} disabled={fileState.isFetching}>Export CSV (Excel)</Button>
        <Button onClick={() => void exportAs('pdf')} disabled={fileState.isFetching}>Export PDF</Button>
      </Stack>
      {error ? <ErrorState message={normalizeApiError(error).message} onRetry={refetch} /> : !data ? <LoadingState /> : (
        <Card variant="outlined" sx={{ overflowX: 'auto' }}>
          <Typography fontSize={13} color="text.secondary" p={1.5}>
            FY {data.financial_year ?? fy}: {data.summary.total} {type}{isFetching ? ' (updating…)' : ''}
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{type === 'orders' ? 'Order' : 'Quotation'}</TableCell><TableCell>Date</TableCell>
                <TableCell>{type === 'orders' ? 'Customer' : 'For'}</TableCell><TableCell>Status</TableCell>
                <TableCell align="right">Amount</TableCell>{type === 'orders' && <TableCell align="right">Paid</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.rows.length === 0 && <TableRow><TableCell colSpan={6}>Nothing in FY {fy}{q ? ` matching “${q}”` : ''}.</TableCell></TableRow>}
              {data.rows.map((r) => (
                <TableRow key={r.reference} hover>
                  <TableCell>{r.reference}</TableCell><TableCell>{r.date}</TableCell><TableCell>{r.party || '-'}</TableCell>
                  <TableCell>{r.status.replaceAll('_', ' ')}</TableCell><TableCell align="right">{inr(r.amount)}</TableCell>
                  {type === 'orders' && <TableCell align="right">{inr(r.paid)}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.pagination.total_pages > 1 && (
            <Stack direction="row" spacing={1} p={1.5} alignItems="center">
              <Button size="small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Typography fontSize={13}>Page {page} of {data.pagination.total_pages}</Typography>
              <Button size="small" disabled={page >= data.pagination.total_pages} onClick={() => setPage(page + 1)}>Next</Button>
            </Stack>
          )}
        </Card>
      )}
    </Box>
  );
}
