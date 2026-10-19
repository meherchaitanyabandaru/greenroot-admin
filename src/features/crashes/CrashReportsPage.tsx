import {
  Box,
  Chip,
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
import { type CrashReport, useListCrashReportsQuery } from '../../api/adminResources';
import { AppDataTable } from '../../components/data-table/AppDataTable';
import { ErrorState } from '../../components/feedback/ErrorState';
import { TableSkeleton } from '../../components/feedback/LoadingState';
import { FormDrawer } from '../../components/forms/FormDrawer';
import { PageHeader } from '../../components/page/PageHeader';
import { normalizeApiError } from '../../utils/apiError';

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Admin → App Crash Reports: uncaught errors sent by the mobile and web apps
 * (POST /app/crash-reports). The API has already removed tokens, phone
 * numbers and emails, so stack traces are safe to read here.
 */
export function CrashReportsPage() {
  const [platform, setPlatform] = useState('');
  const [fatalOnly, setFatalOnly] = useState(false);
  const [versionInput, setVersionInput] = useState('');
  const [version, setVersion] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [open, setOpen] = useState<CrashReport | null>(null);
  useEffect(() => {
    const t = setTimeout(() => { setVersion(versionInput.trim()); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [versionInput]);

  const { data, isFetching, error, refetch } = useListCrashReportsQuery({
    platform: platform || undefined,
    app_version: version || undefined,
    fatal: fatalOnly ? 'true' : undefined,
    page: page + 1,
    per_page: rowsPerPage,
  });

  const columns: ColumnDef<CrashReport>[] = [
    { id: '_when', header: 'Received', cell: ({ row }) => formatDate(row.original.received_at) },
    {
      id: '_app',
      header: 'App',
      cell: ({ row }) => (
        <Box>
          <Typography fontSize={13}>{row.original.platform === 'ios' ? 'iOS' : row.original.platform === 'web' ? 'Web' : 'Android'} {row.original.app_version}</Typography>
          <Typography fontSize={12} color="text.secondary">{[row.original.device_model, row.original.os_version].filter(Boolean).join(' · ') || '—'}</Typography>
        </Box>
      ),
    },
    {
      id: '_error',
      header: 'Error',
      cell: ({ row }) => (
        <Link component="button" underline="hover" onClick={() => setOpen(row.original)} sx={{ textAlign: 'left' }}>
          <Typography fontSize={13} fontWeight={600}>{row.original.error_type}</Typography>
          <Typography fontSize={12} color="text.secondary" sx={{ maxWidth: 520, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.original.message}
          </Typography>
        </Link>
      ),
    },
    {
      id: '_fatal',
      header: 'Severity',
      cell: ({ row }) =>
        row.original.is_fatal ? <Chip size="small" color="error" label="Crash" sx={{ height: 22, fontSize: 11 }} /> : <Chip size="small" label="Handled" sx={{ height: 22, fontSize: 11 }} />,
    },
    { id: '_user', header: 'User', cell: ({ row }) => row.original.user_name ?? (row.original.user_id ? `User #${row.original.user_id}` : 'Signed out') },
  ];

  return (
    <Box>
      <PageHeader title="App Crash Reports" description="Errors the GreenRoot mobile and web apps reported. Personal data is removed before storage." />
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <TextField select size="small" label="Platform" value={platform} onChange={(e) => { setPlatform(e.target.value); setPage(0); }} sx={{ minWidth: 160 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="android">Android</MenuItem>
            <MenuItem value="ios">iOS</MenuItem>
            <MenuItem value="web">Web</MenuItem>
          </TextField>
          <TextField size="small" label="App version" placeholder="e.g. 1.4.2" value={versionInput} onChange={(e) => setVersionInput(e.target.value)} sx={{ minWidth: 160 }} />
          <FormControlLabel control={<Switch checked={fatalOnly} onChange={(e) => { setFatalOnly(e.target.checked); setPage(0); }} />} label="Crashes only" />
        </Stack>
      </Paper>
      {isFetching && <TableSkeleton rows={6} cols={columns.length} />}
      {error && <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />}
      {!isFetching && !error && (
        <AppDataTable
          columns={columns}
          data={data?.items ?? []}
          count={data?.total ?? 0}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(0); }}
        />
      )}

      <FormDrawer open={open !== null} title="Crash report" onClose={() => setOpen(null)} width={{ xs: '100%', sm: 720 }}>
        {open && (
          <Stack spacing={2}>
            <Box>
              <Typography fontWeight={700}>{open.error_type}</Typography>
              <Typography fontSize={14} mt={0.5}>{open.message}</Typography>
            </Box>
            <Typography fontSize={13} color="text.secondary">
              {open.platform} {open.app_version}{open.build_number ? ` (${open.build_number})` : ''} · {open.device_model ?? 'unknown device'} · {open.os_version ?? ''}
              <br />
              Happened {formatDate(open.occurred_at)} · received {formatDate(open.received_at)}
            </Typography>
            {open.stack_trace && (
              <Box component="pre" sx={{ m: 0, p: 1.5, bgcolor: 'background.default', border: 1, borderColor: 'divider', borderRadius: 1, fontSize: 12, overflow: 'auto', maxHeight: 420 }}>
                {open.stack_trace}
              </Box>
            )}
            {open.context && Object.keys(open.context).length > 0 && (
              <Box component="pre" sx={{ m: 0, p: 1.5, bgcolor: 'background.default', border: 1, borderColor: 'divider', borderRadius: 1, fontSize: 12, overflow: 'auto' }}>
                {JSON.stringify(open.context, null, 2)}
              </Box>
            )}
          </Stack>
        )}
      </FormDrawer>
    </Box>
  );
}
