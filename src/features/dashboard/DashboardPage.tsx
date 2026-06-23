import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Assignment,
  Inventory,
  LocalFlorist,
  LocalShipping,
  Payments,
  People,
  Storefront,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { PageHeader } from '../../components/page/PageHeader';
import { greenRootPalette } from '../../theme/palette';
import { normalizeApiError } from '../../utils/apiError';
import { useDashboardQuery } from './dashboardApi';

// ─── KPI card ───────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  Icon,
  href,
  accent = false,
}: {
  label: string;
  value: number;
  Icon: SvgIconComponent;
  href: string;
  accent?: boolean;
}) {
  return (
    <Card
      component={Link}
      to={href}
      sx={{
        display: 'block',
        textDecoration: 'none',
        height: '100%',
        transition: 'box-shadow 0.15s',
        '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textDecoration: 'none' },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography
              fontSize={11}
              fontWeight={700}
              textTransform="uppercase"
              letterSpacing="0.06em"
              color="text.secondary"
              mb={0.75}
            >
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={800} lineHeight={1}>
              {value.toLocaleString('en-IN')}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: accent ? 'rgba(163,214,92,0.15)' : 'primary.50',
              display: 'grid',
              placeItems: 'center',
              color: accent ? '#7A9E2E' : 'primary.main',
              flexShrink: 0,
            }}
          >
            <Icon fontSize="small" />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ─── Pending action row ───────────────────────────────────────────────────────
function PendingAction({
  label,
  count,
  href,
  color,
}: {
  label: string;
  count: number;
  href: string;
  color: 'warning' | 'error';
}) {
  if (count === 0) return null;
  const styles = {
    warning: { bg: '#FEF3C7', text: '#B7791F', icon: '#D97706' },
    error: { bg: '#FEE2E2', text: '#C2410C', icon: '#DC2626' },
  }[color];

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ px: 2, py: 1.25, borderRadius: 1.5, bgcolor: styles.bg }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <WarningAmberIcon sx={{ fontSize: 16, color: styles.icon }} />
        <Typography fontSize={13} fontWeight={500} color={styles.text}>
          {label}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip
          label={count}
          size="small"
          sx={{
            bgcolor: styles.text,
            color: '#fff',
            fontWeight: 700,
            height: 20,
            fontSize: 11,
          }}
        />
        <Button
          component={Link}
          to={href}
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: '14px !important' }} />}
          sx={{ color: styles.text, fontSize: 12, minWidth: 0, p: 0 }}
        >
          View
        </Button>
      </Stack>
    </Stack>
  );
}

// ─── Summary type from API ────────────────────────────────────────────────────
type Summary = {
  nurseries: number | string;
  plants: number | string;
  plant_requests: number | string;
  orders: number | string;
  payments: number | string;
  dispatches: number | string;
  users: number | string;
};

export function DashboardPage() {
  const { data, error, isLoading, refetch } = useDashboardQuery();
  const summary = data?.summary as Summary | undefined;

  const n = (k: keyof Summary) => (summary ? Number(summary[k]) : 0);

  const barData = summary
    ? [
        { name: 'Nurseries', value: n('nurseries'), fill: greenRootPalette.primary[700] },
        { name: 'Plants', value: n('plants'), fill: greenRootPalette.primary[500] },
        { name: 'Requests', value: n('plant_requests'), fill: greenRootPalette.accent.amber },
        { name: 'Orders', value: n('orders'), fill: greenRootPalette.accent.blue },
        { name: 'Dispatches', value: n('dispatches'), fill: greenRootPalette.primary[400] },
        { name: 'Users', value: n('users'), fill: greenRootPalette.accent.mint },
      ]
    : [];

  const pieData = summary
    ? [
        { name: 'Nurseries', value: n('nurseries'), fill: greenRootPalette.primary[700] },
        { name: 'Plants', value: n('plants'), fill: greenRootPalette.primary[400] },
        { name: 'Requests', value: n('plant_requests'), fill: greenRootPalette.accent.amber },
        { name: 'Orders', value: n('orders'), fill: greenRootPalette.accent.blue },
      ]
    : [];

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        description="GreenRoot platform overview"
      />

      {isLoading && <LoadingState />}
      {error && <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />}

      {summary && (
        <Stack spacing={3}>
          {/* ── KPI row ── */}
          <Grid container spacing={2}>
            {[
              { label: 'Total Nurseries', value: n('nurseries'), Icon: Storefront, href: '/nurseries' },
              { label: 'Active Users', value: n('users'), Icon: People, href: '/users' },
              { label: 'Plant Requests', value: n('plant_requests'), Icon: Assignment, href: '/requests', accent: true },
              { label: 'Orders', value: n('orders'), Icon: Inventory, href: '/orders' },
              { label: 'Payments', value: n('payments'), Icon: Payments, href: '/payments' },
              { label: 'Active Dispatches', value: n('dispatches'), Icon: LocalShipping, href: '/dispatches', accent: true },
              { label: 'Plants in Catalog', value: n('plants'), Icon: LocalFlorist, href: '/plants' },
            ].map((kpi) => (
              <Grid key={kpi.label} size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                <KpiCard {...kpi} />
              </Grid>
            ))}
          </Grid>

          {/* ── Charts row ── */}
          <Grid container spacing={2}>
            {/* Bar chart */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <Card>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={0.25}>
                    Platform Overview
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2.5}>
                    Total records across all modules
                  </Typography>
                  <Box sx={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} barSize={36}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F4F1" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: '#667085' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#667085' }}
                          axisLine={false}
                          tickLine={false}
                          width={40}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(31,122,58,0.04)' }}
                          contentStyle={{ borderRadius: 8, fontSize: 13, border: '1px solid #DFE7E2' }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {barData.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Pie chart */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={0.25}>
                    Operations Mix
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Core module breakdown
                  </Typography>
                  <Box sx={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          innerRadius={52}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: 8, fontSize: 13, border: '1px solid #DFE7E2' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Stack spacing={0.75} mt={1.5}>
                    {pieData.map((d) => (
                      <Stack key={d.name} direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: d.fill,
                            flexShrink: 0,
                          }}
                        />
                        <Typography fontSize={12} flex={1} color="text.secondary">
                          {d.name}
                        </Typography>
                        <Typography fontSize={12} fontWeight={700}>
                          {d.value.toLocaleString('en-IN')}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ── Bottom row: Needs Attention + Quick Access ── */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                    Needs Attention
                  </Typography>
                  <Stack spacing={1}>
                    <PendingAction
                      label="Open plant requests"
                      count={n('plant_requests')}
                      href="/requests"
                      color="warning"
                    />
                    <PendingAction
                      label="Active dispatches"
                      count={n('dispatches')}
                      href="/dispatches"
                      color="warning"
                    />
                    {n('plant_requests') === 0 && n('dispatches') === 0 && (
                      <Box sx={{ py: 3, textAlign: 'center' }}>
                        <Typography fontSize={28} mb={1}>✅</Typography>
                        <Typography fontSize={13} color="text.secondary">
                          All caught up — no pending actions.
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                    Quick Access
                  </Typography>
                  <Grid container spacing={1}>
                    {[
                      { label: 'Add Nursery', href: '/nurseries' },
                      { label: 'Add Plant', href: '/plants' },
                      { label: 'Create Order', href: '/orders' },
                      { label: 'Create Dispatch', href: '/dispatches' },
                      { label: 'Add Driver', href: '/drivers' },
                      { label: 'Add Vehicle', href: '/vehicles' },
                    ].map((item) => (
                      <Grid key={item.label} size={{ xs: 6, sm: 4 }}>
                        <Button
                          component={Link}
                          to={item.href}
                          variant="outlined"
                          size="small"
                          fullWidth
                          sx={{
                            fontSize: 12,
                            py: 0.875,
                            justifyContent: 'flex-start',
                            px: 1.5,
                            borderColor: 'divider',
                            color: 'text.primary',
                            '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                          }}
                        >
                          {item.label}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Box>
  );
}
