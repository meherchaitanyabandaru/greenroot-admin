import { useMemo } from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BugReportIcon from '@mui/icons-material/BugReport';
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
  Legend,
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
import { formatCurrency, toLabel } from '../../utils/labels';
import { useListMarketReportsQuery, useListResourceQuery } from '../../api/adminResources';
import { useGetEmailStatusQuery } from '../email/emailApi';
import { useGetSmsStatusQuery } from '../sms/smsApi';
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
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: tones.bg, color: tones.fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon sx={{ fontSize: 19 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontSize={11.5} fontWeight={600} color="text.secondary" noWrap>
              {label}
            </Typography>
            <Typography fontSize={20} fontWeight={750} lineHeight={1.15} letterSpacing={0}>
              {textValue}
            </Typography>
            {helper && (
              <Typography fontSize={11} color="text.secondary" noWrap title={helper}>
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
  scroll = true,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  /** false for charts: a scrollable body lets a chart resize itself in a loop. */
  scroll?: boolean;
}) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.25} sx={{ flexShrink: 0 }}>
          <Typography fontSize={15} fontWeight={700}>
            {title}
          </Typography>
          {action}
        </Stack>
        {/* Long lists scroll inside the card; the page stays one screen. */}
        <Box sx={{ flex: 1, overflowY: scroll ? 'auto' : 'hidden', position: 'relative', minHeight: scroll ? 0 : 240 }}>{children}</Box>
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
  const sms = useGetSmsStatusQuery();
  const email = useGetEmailStatusQuery();
  const reports = useListMarketReportsQuery({ status: 'PENDING', page: 1, per_page: 1 });
  const activity = useListResourceQuery({ resource: 'audit', params: { page: 1, per_page: 6 } });
  const s = data?.summary;
  const n = (key: keyof NonNullable<typeof s>) => numberValue(s?.[key]);

  const pendingApprovals = n('pending_nurseries');
  const pendingPayments = n('pending_payments');
  const reportedAds = reports.data?.pagination?.total ?? 0;
  const crashes = n('crash_reports_24h');
  // Same array until the data changes: a new one each render made the chart
  // replay its animation whenever anything on the page re-rendered.
  const trend = useMemo(
    () =>
      (s?.trend ?? []).map((d) => ({
        ...d,
        label: new Date(`${d.day}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      })),
    [s?.trend],
  );

  if (isLoading) return <LoadingState label="Loading GreenRoot operations" />;
  if (error) return <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />;

  const alerts = [
    pendingApprovals > 0 && { tone: 'danger', title: `${pendingApprovals} nursery application${pendingApprovals > 1 ? 's' : ''} waiting`, body: 'Owners cannot sell until you approve them.', href: '/nurseries/applications' },
    reportedAds > 0 && { tone: 'warning', title: `${reportedAds} reported market ad${reportedAds > 1 ? 's' : ''}`, body: 'Check the photos, then restore or remove the ads.', href: '/market/review' },
    crashes > 0 && { tone: 'warning', title: `${crashes} app crash${crashes > 1 ? 'es' : ''} in 24 h`, body: 'Check which app version and screen fail.', href: '/crash-reports' },
    sms.data && !sms.data.live && { tone: 'info', title: 'SMS is in mock mode', body: 'OTP is the fixed dev code for every account. Go live after DLT approval.', href: '/sms' },
    email.data && !email.data.live && { tone: 'info', title: 'Email is in mock mode', body: 'Nothing is delivered until a provider (Amazon SES) is enabled.', href: '/email' },
  ].filter(Boolean) as Array<{ tone: 'danger' | 'warning' | 'info'; title: string; body: string; href: string }>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 560 }}>
      <PageHeader
        title="Platform Overview"
        description="Live figures from the GreenRoot API. Today means the business day in India (IST)."
        action={
          <Stack direction="row" spacing={1}>
            <Button component={Link} to="/nurseries/applications" variant="outlined" size="small">
              Review queue
            </Button>
            <Button component={Link} to="/audit" variant="contained" size="small">
              Audit activity
            </Button>
          </Stack>
        }
      />

      <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        <Grid container spacing={1.5} sx={{ flexShrink: 0 }}>
          {[
            { label: "Today's orders", value: n('orders_today'), icon: ReceiptLongIcon, href: '/orders', tone: 'info' as const, helper: `${n('active_orders').toLocaleString('en-IN')} in progress` },
            { label: 'Active trips', value: n('active_trips'), icon: LocalShippingIcon, href: '/tracking', tone: n('active_trips') ? ('warning' as const) : ('neutral' as const), helper: `${n('dispatches_today')} dispatched today` },
            { label: 'Pending approvals', value: pendingApprovals, icon: ErrorOutlineIcon, href: '/nurseries/applications', tone: pendingApprovals ? ('danger' as const) : ('neutral' as const), helper: `${n('approved_nurseries')} active nurseries` },
            { label: 'Reported ads', value: reportedAds, icon: StorefrontIcon, href: '/market/review', tone: reportedAds ? ('warning' as const) : ('neutral' as const), helper: 'Local market, awaiting review' },
            { label: 'Order revenue', value: formatCurrency(n('order_revenue')), icon: PaymentsIcon, href: '/payments', tone: 'success' as const, helper: 'Successful order payments' },
            { label: 'Subscription revenue', value: formatCurrency(n('subscription_revenue')), icon: PaymentsIcon, href: '/subscriptions', tone: 'success' as const, helper: 'Successful subscription payments' },
            { label: 'Pending payments', value: pendingPayments, icon: PaymentsIcon, href: '/payments', tone: pendingPayments ? ('warning' as const) : ('neutral' as const), helper: 'Waiting for confirmation' },
            { label: 'Failed logins (24 h)', value: n('failed_logins_24h'), icon: ErrorOutlineIcon, href: '/security-logs', tone: n('failed_logins_24h') ? ('danger' as const) : ('neutral' as const) },
            { label: 'Users', value: n('users'), icon: PeopleIcon, href: '/users', helper: `${n('active_drivers')} active drivers` },
            { label: 'Catalog plants', value: n('plants'), icon: LocalFloristIcon, href: '/plants?in_catalog=true', helper: `of ${n('botanical_names').toLocaleString('en-IN')} botanical names` },
            { label: 'Plant requests', value: n('plant_requests'), icon: TravelExploreIcon, href: '/requests', helper: `${n('top_items')} top items` },
            { label: 'App crashes (24 h)', value: crashes, icon: BugReportIcon, href: '/crash-reports', tone: crashes ? ('warning' as const) : ('neutral' as const) },
          ].map((kpi) => (
            <Grid key={kpi.label} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KpiTile {...kpi} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
          <Grid size={{ xs: 12, lg: 6 }} sx={{ height: { lg: '100%' } }}>
            <Panel
              title="Orders and dispatches"
              scroll={false}
              action={<Chip size="small" label="Last 7 days" sx={{ height: 22, borderRadius: 1, fontSize: 11, fontWeight: 700 }} />}
            >
              {/* Absolutely placed: the chart takes the space it is given and
                  never pushes back on the layout, so it cannot jitter. */}
              <Box sx={{ position: 'absolute', inset: 0 }}>
                <ResponsiveContainer width="100%" height="100%" debounce={150}>
                  <AreaChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
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
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: tokens.semantic.textSecondary }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: tokens.semantic.textSecondary }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${tokens.semantic.border}`, fontSize: 12 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" name="Orders" dataKey="orders" stroke={palette.forest[700]} fill="url(#orders)" strokeWidth={2} isAnimationActive={false} />
                    <Area type="monotone" name="Dispatches" dataKey="dispatches" stroke={palette.blue[600]} fill="url(#dispatches)" strokeWidth={2} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Panel>
          </Grid>

          <Grid size={{ xs: 12, md: 6, lg: 3 }} sx={{ height: { lg: '100%' } }}>
            <Panel title="Needs attention">
              {alerts.length === 0 ? (
                <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: palette.forest[50], color: palette.forest[700] }}>
                  <Typography fontSize={13} fontWeight={700}>All clear</Typography>
                  <Typography fontSize={12}>No approvals, reports or crashes waiting.</Typography>
                </Box>
              ) : (
                <Stack spacing={1.25}>
                  {alerts.map((a) => {
                    const c = { danger: palette.red, warning: palette.amber, info: palette.blue }[a.tone];
                    return (
                      <Box key={a.title} component={Link} to={a.href} sx={{ p: 1.25, borderRadius: 1, bgcolor: c[50], color: c[700], textDecoration: 'none', display: 'block', '&:hover': { opacity: 0.85 } }}>
                        <Typography fontSize={13} fontWeight={700}>{a.title}</Typography>
                        <Typography fontSize={12}>{a.body}</Typography>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Panel>
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 3 }} sx={{ height: { lg: '100%' } }}>
            <Panel
              title="Recent activity"
              action={<Button component={Link} to="/audit" size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}>All activity</Button>}
            >
              {activity.isLoading ? (
                <LinearProgress />
              ) : (activity.data?.rows ?? []).length === 0 ? (
                <Typography color="text.secondary" fontSize={13}>No activity yet.</Typography>
              ) : (
                <Stack divider={<Divider flexItem />} spacing={0}>
                  {(activity.data?.rows ?? []).map((row) => (
                    <RowItem
                      key={String(row.id)}
                      title={String(row.description || `${toLabel(String(row.action_type ?? ''))} ${String(row.entity_type ?? '')} #${String(row.record_id ?? '')}`)}
                      caption={`${String(row.user_name ?? 'System')} · ${toLabel(String(row.module ?? ''))} · ${formatDateTime(row.changed_at)}`}
                    />
                  ))}
                </Stack>
              )}
            </Panel>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}

function formatDateTime(value: unknown) {
  const d = new Date(String(value ?? ''));
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
