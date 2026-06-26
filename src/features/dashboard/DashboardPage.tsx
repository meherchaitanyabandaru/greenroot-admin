import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {
  AccountTree,
  LocalFlorist,
  People,
  Storefront,
  ReceiptLong,
  LocalShipping,
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

function KpiCard({
  label,
  value,
  Icon,
  href,
  accent = false,
  alert = false,
}: {
  label: string;
  value: number;
  Icon: SvgIconComponent;
  href: string;
  accent?: boolean;
  alert?: boolean;
}) {
  const iconBg = alert
    ? 'rgba(220,38,38,0.10)'
    : accent
      ? 'rgba(163,214,92,0.15)'
      : 'primary.50';
  const iconColor = alert ? '#DC2626' : accent ? '#7A9E2E' : 'primary.main';

  return (
    <Card
      component={Link}
      to={href}
      sx={{
        display: 'block',
        textDecoration: 'none',
        height: '100%',
        transition: 'box-shadow 0.15s',
        '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
        ...(alert && value > 0 ? { border: '1.5px solid #FCA5A5' } : {}),
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
            <Typography
              variant="h4"
              fontWeight={800}
              lineHeight={1}
              color={alert && value > 0 ? '#DC2626' : 'text.primary'}
            >
              {value.toLocaleString('en-IN')}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: iconBg,
              display: 'grid',
              placeItems: 'center',
              color: iconColor,
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

function AttentionBanner({
  label,
  count,
  href,
  severity,
}: {
  label: string;
  count: number;
  href: string;
  severity: 'warning' | 'error';
}) {
  if (count === 0) return null;
  const s =
    severity === 'error'
      ? { bg: '#FEE2E2', text: '#B91C1C', icon: '#DC2626' }
      : { bg: '#FEF3C7', text: '#B45309', icon: '#D97706' };

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ px: 2, py: 1.25, borderRadius: 1.5, bgcolor: s.bg }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <ErrorOutlineIcon sx={{ fontSize: 16, color: s.icon }} />
        <Typography fontSize={13} fontWeight={500} color={s.text}>
          {label}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip
          label={count}
          size="small"
          sx={{ bgcolor: s.text, color: '#fff', fontWeight: 700, height: 20, fontSize: 11 }}
        />
        <Button
          component={Link}
          to={href}
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: '14px !important' }} />}
          sx={{ color: s.text, fontSize: 12, minWidth: 0, p: 0 }}
        >
          Review
        </Button>
      </Stack>
    </Stack>
  );
}

export function DashboardPage() {
  const { data, error, isLoading, refetch } = useDashboardQuery();
  const s = data?.summary;

  const n = (k: keyof NonNullable<typeof s>) => (s ? Number(s[k] ?? 0) : 0);

  const barData = s
    ? [
        { name: 'Users', value: n('users'), fill: greenRootPalette.accent.blue },
        { name: 'Nurseries', value: n('nurseries'), fill: greenRootPalette.primary[700] },
        { name: 'Active Orders', value: n('active_orders'), fill: greenRootPalette.accent.amber },
        { name: 'Dispatches', value: n('dispatches'), fill: greenRootPalette.primary[500] },
        { name: 'Drivers', value: n('active_drivers'), fill: greenRootPalette.accent.mint },
        { name: 'Plants', value: n('plants'), fill: greenRootPalette.primary[400] },
      ]
    : [];

  return (
    <Box>
      <PageHeader title="Dashboard" description="GreenRoot platform overview" />

      {isLoading && <LoadingState />}
      {error && <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />}

      {s && (
        <Stack spacing={3}>
          {/* ── KPI row ── */}
          <Grid container spacing={2}>
            {[
              {
                label: 'Pending Applications',
                value: n('pending_nurseries'),
                Icon: CheckCircleOutlineIcon,
                href: '/nurseries/applications',
                alert: true,
              },
              {
                label: 'Total Users',
                value: n('users'),
                Icon: People,
                href: '/users',
              },
              {
                label: 'Approved Nurseries',
                value: n('approved_nurseries'),
                Icon: Storefront,
                href: '/nurseries',
                accent: true,
              },
              {
                label: 'Active Drivers',
                value: n('active_drivers'),
                Icon: AccountTree,
                href: '/drivers',
              },
              {
                label: 'Active Orders',
                value: n('active_orders'),
                Icon: ReceiptLong,
                href: '/orders',
              },
              {
                label: 'Active Dispatches',
                value: n('dispatches'),
                Icon: LocalShipping,
                href: '/dispatches',
                accent: true,
              },
              {
                label: 'Plants in Catalog',
                value: n('plants'),
                Icon: LocalFlorist,
                href: '/plants',
              },
            ].map((kpi) => (
              <Grid key={kpi.label} size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                <KpiCard {...kpi} />
              </Grid>
            ))}
          </Grid>

          {/* ── Main row ── */}
          <Grid container spacing={2}>
            {/* Bar chart */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <Card>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={0.25}>
                    Platform Overview
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2.5}>
                    Key metrics across the platform
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
                          contentStyle={{
                            borderRadius: 8,
                            fontSize: 13,
                            border: '1px solid #DFE7E2',
                          }}
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

            {/* Nursery status breakdown */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={0.25}>
                    Nursery Status
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Current registration breakdown
                  </Typography>
                  <Stack spacing={1.5}>
                    {[
                      { label: 'Pending Review', value: n('pending_nurseries'), color: '#B45309', bg: '#FEF3C7' },
                      { label: 'Approved', value: n('approved_nurseries'), color: '#15803D', bg: '#DCFCE7' },
                      { label: 'Suspended', value: n('suspended_nurseries'), color: '#7C3AED', bg: '#EDE9FE' },
                    ].map(({ label, value, color, bg }) => (
                      <Stack
                        key={label}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ px: 1.5, py: 1, borderRadius: 1.5, bgcolor: bg }}
                      >
                        <Typography fontSize={13} fontWeight={500} color={color}>
                          {label}
                        </Typography>
                        <Typography fontSize={20} fontWeight={800} color={color} lineHeight={1}>
                          {value}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Button
                    component={Link}
                    to="/nurseries/applications"
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ mt: 2, fontSize: 12 }}
                    endIcon={<ArrowForwardIcon sx={{ fontSize: '14px !important' }} />}
                  >
                    Review Applications
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ── Bottom row: Needs Attention + Quick Links ── */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                    Needs Attention
                  </Typography>
                  <Stack spacing={1}>
                    <AttentionBanner
                      label="Nursery applications pending review"
                      count={n('pending_nurseries')}
                      href="/nurseries/applications"
                      severity="error"
                    />
                    <AttentionBanner
                      label="Nurseries currently suspended"
                      count={n('suspended_nurseries')}
                      href="/nurseries"
                      severity="warning"
                    />
                    {n('pending_nurseries') === 0 && n('suspended_nurseries') === 0 && (
                      <Box sx={{ py: 3, textAlign: 'center' }}>
                        <Typography fontSize={28} mb={1}>✅</Typography>
                        <Typography fontSize={13} color="text.secondary">
                          No pending admin actions.
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
                      { label: 'Review Applications', href: '/nurseries/applications' },
                      { label: 'All Nurseries', href: '/nurseries' },
                      { label: 'Manage Users', href: '/users' },
                      { label: 'Driver Management', href: '/drivers' },
                      { label: 'Audit Logs', href: '/audit' },
                      { label: 'Add Plant', href: '/plants' },
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
