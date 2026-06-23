import { Box, Chip, Divider, Grid, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import {
  useGetUserQuery,
  useListUserAddressesQuery,
  useListUserRolesQuery,
  useListUserSessionsQuery,
} from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { StatusChip } from '../../components/status/StatusChip';
import { normalizeApiError } from '../../utils/apiError';

function text(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function SectionTable({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: Record<string, unknown>[];
  columns: Array<{ key: string; label: string }>;
}) {
  return (
    <Box>
      <Typography sx={{ mb: 1 }} variant="subtitle1">
        {title}
      </Typography>
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key} sx={{ fontWeight: 700 }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Typography color="text.secondary" variant="body2">
                    No records.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>{text(row[col.key])}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export function UserDetailPanel({ userId }: { userId: number }) {
  const userQuery = useGetUserQuery(userId);
  const rolesQuery = useListUserRolesQuery(userId);
  const sessionsQuery = useListUserSessionsQuery(userId);
  const addressesQuery = useListUserAddressesQuery(userId);

  if (userQuery.isLoading) return <LoadingState />;
  if (userQuery.error) return <ErrorState message={normalizeApiError(userQuery.error).message} onRetry={userQuery.refetch} />;

  const user = userQuery.data?.user ?? {};
  const roles: Record<string, unknown>[] = Array.isArray(rolesQuery.data?.roles) ? (rolesQuery.data!.roles as Record<string, unknown>[]) : [];
  const sessions: Record<string, unknown>[] = Array.isArray(sessionsQuery.data?.sessions) ? (sessionsQuery.data!.sessions as Record<string, unknown>[]) : [];
  const addresses: Record<string, unknown>[] = Array.isArray(addressesQuery.data?.addresses) ? (addressesQuery.data!.addresses as Record<string, unknown>[]) : [];

  const profileItems: Array<[string, unknown]> = [
    ['Code', user.user_code],
    ['Mobile', user.mobile],
    ['Email', user.email],
    ['Gender', user.gender],
    ['Mobile verified', user.mobile_verified ? 'Yes' : 'No'],
    ['Email verified', user.email_verified ? 'Yes' : 'No'],
    ['Last login', user.last_login_at],
    ['Created', user.created_at],
  ];

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }} variant="outlined">
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography color="text.secondary" variant="body2">
                User
              </Typography>
              <Typography variant="h6">
                {text(user.first_name)} {text(user.last_name)}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {text(user.user_code)}
              </Typography>
            </Box>
            <StatusChip value={user.status} />
          </Stack>
          <Grid container spacing={1.5}>
            {profileItems.map(([label, value]) => (
              <Grid key={String(label)} size={{ xs: 12, sm: 6 }}>
                <Typography color="text.secondary" variant="caption">
                  {label}
                </Typography>
                <Typography variant="body2">{text(value)}</Typography>
              </Grid>
            ))}
          </Grid>
          {roles.length > 0 && (
            <>
              <Divider />
              <Box>
                <Typography color="text.secondary" variant="caption">
                  Roles
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                  {roles.map((role) => (
                    <Chip key={String(role.id)} label={text(role.name)} size="small" />
                  ))}
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </Paper>

      <SectionTable
        title="Addresses"
        rows={addresses}
        columns={[
          { key: 'address_type', label: 'Type' },
          { key: 'address_line1', label: 'Line 1' },
          { key: 'city', label: 'City' },
          { key: 'state', label: 'State' },
          { key: 'postal_code', label: 'PIN' },
        ]}
      />

      <SectionTable
        title="Sessions"
        rows={sessions}
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'login_time', label: 'Login' },
          { key: 'last_activity_at', label: 'Last Active' },
          { key: 'status', label: 'Status' },
          { key: 'device_type', label: 'Device' },
          { key: 'ip_address', label: 'IP' },
        ]}
      />
    </Stack>
  );
}
