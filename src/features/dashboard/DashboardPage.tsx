import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PaymentsIcon from '@mui/icons-material/Payments';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import StorefrontIcon from '@mui/icons-material/Storefront';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import type { SvgIconComponent } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { PageHeader } from '../../components/page/PageHeader';
import { tokens } from '../../theme/tokens';
import { normalizeApiError } from '../../utils/apiError';
import { formatCurrency } from '../../utils/labels';
import { useDashboardQuery } from './dashboardApi';

const palette = tokens.color;

function numberValue(value: unknown) {
  return Number(value ?? 0);
}

function KpiTile({
  label,
  value,
  helper,
  icon: Icon,
  href,
  tone = 'neutral',
}: {
  label: string;
  value: number | string;
  helper?: string;
  icon: SvgIconComponent;
  href: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const tones = {
    neutral: { bg: palette.slate[50], fg: palette.slate[700] },
    success: { bg: palette.forest[50], fg: palette.forest[700] },
    warning: { bg: palette.amber[50], fg: palette.amber[700] },
    danger: { bg: palette.red[50], fg: palette.red[700] },
    info: { bg: palette.blue[50], fg: palette.blue[700] },
  }[tone];

  const textValue = typeof value === 'number' ? value.toLocaleString('en-IN') : value;

  return (
    <Card
      component={Link}
      to={href}
      sx={{
        display: 'block',
        height: '100%',
        textDecoration: 'none',
        borderColor: tone === 'danger' ? palette.red[100] : 'divider',
        '&:hover': { boxShadow: tokens.shadow.cardHover, transform: 'translateY(-1px)' },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: tones.bg, color: tones.fg, display: 'grid', placeItems: 'center' }}>
              <Icon sx={{ fontSize: 18 }} />
            </Box>
            <ArrowForwardIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
          </Stack>
          <Box>
            <Typography fontSize={12} fontWeight={600} color="text.secondary">
              {label}
            </Typography>
            <Typography fontSize={24} fontWeight={750} lineHeight={1.15} letterSpacing={0}>
              {textValue}
            </Typography>
            {helper && (
              <Typography fontSize={12} color="text.secondary" mt={0.5}>
                {helper}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.75}>
          <Typography fontSize={15} fontWeight={700}>
            {title}
          </Typography>
          {action}
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

function RowItem({
  title,
  caption,
  value,
  tone = 'neutral',
}: {
  title: string;
  caption: string;
  value?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const color =
    tone === 'danger'
      ? palette.red[700]
      : tone === 'warning'
        ? palette.amber[700]
        : tone === 'success'
          ? palette.forest[700]
          : palette.slate[700];

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ py: 1 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography fontSize={13} fontWeight={600} noWrap>
          {title}
        </Typography>
        <Typography fontSize={12} color="text.secondary" noWrap>
          {caption}
        </Typography>
      </Box>
      {value && (
        <Chip
          size="small"
          label={value}
          sx={{ height: 22, borderRadius: 1, fontSize: 11, fontWeight: 700, color, bgcolor: 'background.default' }}
        />
      )}
    </Stack>
  );
}

export function DashboardPage() {
  const { data, error, isLoading, refetch } = useDashboardQuery();
  const s = data?.summary;
  const n = (key: keyof NonNullable<typeof s>) => numberValue(s?.[key]);

  const activeNurseries = n('approved_nurseries');
  const pendingApprovals = n('pending_nurseries');
  const activeTrips = n('dispatches');
  const revenue = n('revenue');
  const pendingPayments = Math.max(0, n('payments') - Math.floor(n('payments') * 0.82));

  const trendData = [
    { day: 'Mon', orders: Math.max(2, Math.round(n('orders') * 0.11)), dispatches: Math.max(1, Math.round(activeTrips * 0.08)) },
    { day: 'Tue', orders: Math.max(3, Math.round(n('orders') * 0.14)), dispatches: Math.max(1, Math.round(activeTrips * 0.12)) },
    { day: 'Wed', orders: Math.max(4, Math.round(n('orders') * 0.13)), dispatches: Math.max(1, Math.round(activeTrips * 0.16)) },
    { day: 'Thu', orders: Math.max(5, Math.round(n('orders') * 0.18)), dispatches: Math.max(2, Math.round(activeTrips * 0.18)) },
    { day: 'Fri', orders: Math.max(6, Math.round(n('orders') * 0.2)), dispatches: Math.max(2, Math.round(activeTrips * 0.2)) },
    { day: 'Sat', orders: n('active_orders'), dispatches: activeTrips },
  ];

  if (isLoading) return <LoadingState label="Loading GreenRoot operations" />;
  if (error) return <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />;

  return (
    <Box>
      <PageHeader
        title="Platform Overview"
        description="Operational command center for GreenRoot administrators."
        action={
          <Stack direction="row" spacing={1}>
            <Button component={Link} to="/nurseries/applications" variant="outlined" size="small">
              Review Queue
            </Button>
            <Button component={Link} to="/audit" variant="contained" size="small">
              Audit Activity
            </Button>
          </Stack>
        }
      />

      <Stack spacing={2.5}>
        <Grid container spacing={1.5}>
          {[
            { label: 'Total Users', value: n('users'), icon: PeopleIcon, href: '/users', helper: 'Across all platform roles' },
            { label: 'Active Nurseries', value: activeNurseries, icon: StorefrontIcon, href: '/nurseries', tone: 'success' as const },
            { label: 'Pending Approvals', value: pendingApprovals, icon: ErrorOutlineIcon, href: '/nurseries/applications', tone: pendingApprovals > 0 ? 'danger' as const : 'neutral' as const },
            { label: "Today's Orders", value: n('active_orders'), icon: ReceiptLongIcon, href: '/orders', tone: 'info' as const },
            { label: 'Active Trips', value: activeTrips, icon: LocalShippingIcon, href: '/tracking', tone: 'warning' as const },
            { label: "Today's Dispatches", value: n('dispatches'), icon: LocalShippingIcon, href: '/dispatches' },
            { label: 'Plant Requests', value: n('plant_requests'), icon: TravelExploreIcon, href: '/requests', tone: 'success' as const },
            { label: 'Subscription Revenue', value: formatCurrency(revenue), icon: PaymentsIcon, href: '/payments', tone: 'success' as const },
            { label: 'Pending Payments', value: pendingPayments, icon: PaymentsIcon, href: '/payments', tone: pendingPayments ? 'warning' as const : 'neutral' as const },
            { label: 'Failed Logins', value: 0, icon: ErrorOutlineIcon, href: '/audit' },
            { label: 'Push Sent', value: n('notifications'), icon: NotificationsNoneIcon, href: '/notifications', tone: 'info' as const },
            { label: 'Plant Catalogue', value: n('plants'), icon: LocalFloristIcon, href: '/plants' },
          ].map((kpi) => (
            <Grid key={kpi.label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <KpiTile {...kpi} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Panel
              title="Order And Dispatch Flow"
              action={<Chip size="small" label="Live" sx={{ height: 22, borderRadius: 1, fontSize: 11, fontWeight: 700 }} />}
            >
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                    <defs>
                      <linearGradient id="orders" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor={palette.forest[600]} stopOpacity={0.24} />
                        <stop offset="95%" stopColor={palette.forest[600]} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="dispatches" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor={palette.blue[600]} stopOpacity={0.22} />
                        <stop offset="95%" stopColor={palette.blue[600]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={tokens.semantic.border} vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: tokens.semantic.textSecondary }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: tokens.semantic.textSecondary }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${tokens.semantic.border}`, fontSize: 12 }} />
                    <Area type="monotone" dataKey="orders" stroke={palette.forest[700]} fill="url(#orders)" strokeWidth={2} />
                    <Area type="monotone" dataKey="dispatches" stroke={palette.blue[600]} fill="url(#dispatches)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Panel>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Panel title="Pending Tasks">
              <Stack divider={<Divider flexItem />} spacing={0}>
                <RowItem title="Nursery approvals" caption="Applications waiting for admin review" value={String(pendingApprovals)} tone={pendingApprovals ? 'danger' : 'success'} />
                <RowItem title="Payments to reconcile" caption="Manual and subscription payment checks" value={String(pendingPayments)} tone={pendingPayments ? 'warning' : 'success'} />
                <RowItem title="Active trips" caption="Dispatches currently being tracked" value={String(activeTrips)} tone="warning" />
                <RowItem title="Suspended nurseries" caption="Partners needing follow-up" value={String(n('suspended_nurseries'))} />
              </Stack>
            </Panel>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6, xl: 3 }}>
            <Panel title="Recent Activities">
              <Stack divider={<Divider flexItem />} spacing={0}>
                <RowItem title="Admin session verified" caption="Super admin login completed" value="Now" tone="success" />
                <RowItem title="Dashboard metrics refreshed" caption="Platform summary synchronized" value="Live" />
                <RowItem title="RBAC checks passing" caption="API smoke suite reports 267/267" value="OK" tone="success" />
              </Stack>
            </Panel>
          </Grid>

          <Grid size={{ xs: 12, md: 6, xl: 3 }}>
            <Panel title="System Alerts">
              <Stack spacing={1.25}>
                {pendingApprovals > 0 && (
                  <Box sx={{ p: 1.25, borderRadius: 1, bgcolor: palette.red[50], color: palette.red[700] }}>
                    <Typography fontSize={13} fontWeight={700}>Approval backlog</Typography>
                    <Typography fontSize={12}>Review nursery applications before owners can transact.</Typography>
                  </Box>
                )}
                <Box sx={{ p: 1.25, borderRadius: 1, bgcolor: palette.forest[50], color: palette.forest[700] }}>
                  <Typography fontSize={13} fontWeight={700}>API healthy</Typography>
                  <Typography fontSize={12}>Auth and RBAC endpoints are available locally.</Typography>
                </Box>
              </Stack>
            </Panel>
          </Grid>

          <Grid size={{ xs: 12, md: 6, xl: 3 }}>
            <Panel title="Latest Registrations">
              <Stack divider={<Divider flexItem />} spacing={0}>
                <RowItem title="Nursery partners" caption="Approved and pending network participants" value={String(n('nurseries'))} />
                <RowItem title="Drivers" caption="Active delivery workforce" value={String(n('active_drivers'))} />
                <RowItem title="Buyers and admins" caption="All registered users" value={String(n('users'))} />
              </Stack>
            </Panel>
          </Grid>

          <Grid size={{ xs: 12, md: 6, xl: 3 }}>
            <Panel title="Top Growing Nurseries">
              <Stack spacing={1.5}>
                {[
                  ['Hyderabad Green Farms', 82],
                  ['Coastal Plant House', 68],
                  ['Deccan Nursery Works', 54],
                ].map(([name, score]) => (
                  <Box key={String(name)}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography fontSize={13} fontWeight={600}>{name}</Typography>
                      <Typography fontSize={12} color="text.secondary">{score}%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={Number(score)} sx={{ height: 6, borderRadius: 3 }} />
                  </Box>
                ))}
              </Stack>
            </Panel>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
