import BugReportIcon from '@mui/icons-material/BugReport';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PaymentsIcon from '@mui/icons-material/Payments';
import StorefrontIcon from '@mui/icons-material/Storefront';
import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { createElement, useState, type ElementType } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useListMarketReportsQuery,
  useListResourceQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '../../api/adminResources';
import { useDashboardQuery } from '../../features/dashboard/dashboardApi';
import { useAppSelector } from '../../hooks/redux';

// The console is watched all day: refresh the bell every minute.
const POLL = { pollingInterval: 60_000 };

type Task = { key: string; count: number; title: string; body: string; href: string; icon: ElementType; tone: string };

/**
 * Top-bar bell: work waiting for the admin (reports, approvals, payments,
 * crashes) and the admin's own unread notifications, in one place.
 */
export function NotificationBell() {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const userId = useAppSelector((s) => s.auth.user?.id);

  const summary = useDashboardQuery(undefined, POLL).data?.summary;
  const reports = useListMarketReportsQuery({ status: 'PENDING', page: 1, per_page: 1 }, POLL).data?.pagination?.total ?? 0;
  // Admins can list everyone's notifications; the bell shows only their own.
  const mine = useListResourceQuery(
    { resource: 'notifications', params: { user_id: userId, unread: 'true', page: 1, per_page: 6 } },
    { ...POLL, skip: !userId },
  ).data;
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, markAllState] = useMarkAllNotificationsReadMutation();

  const num = (k: string) => Number((summary as Record<string, unknown> | undefined)?.[k] ?? 0) || 0;
  const tasks: Task[] = [
    { key: 'reports', count: reports, title: 'reported market ads', body: 'Check the photos, then restore or remove.', href: '/market/review', icon: GppMaybeIcon, tone: '#b45309' },
    { key: 'approvals', count: num('pending_nurseries'), title: 'nurseries waiting for approval', body: 'They cannot sell until approved.', href: '/nurseries/applications', icon: StorefrontIcon, tone: '#b91c1c' },
    { key: 'payments', count: num('pending_payments'), title: 'payments waiting for confirmation', body: 'Confirm or mark them failed.', href: '/payments', icon: PaymentsIcon, tone: '#1d4ed8' },
    { key: 'crashes', count: num('crash_reports_24h'), title: 'app crashes in the last 24 h', body: 'See which version and screen fail.', href: '/crash-reports', icon: BugReportIcon, tone: '#b45309' },
  ].filter((t) => t.count > 0);

  const unread = mine?.rows ?? [];
  const unreadTotal = mine?.pagination?.total ?? unread.length;
  const badge = tasks.reduce((n, t) => n + t.count, 0) + unreadTotal;

  const go = (href: string) => { setAnchor(null); navigate(href); };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton size="small" aria-label={`Notifications: ${badge} waiting`} onClick={(e) => setAnchor(e.currentTarget)}>
          <Badge badgeContent={badge} color="error" max={99} overlap="circular">
            <NotificationsNoneIcon sx={{ fontSize: 21 }} />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 380, maxHeight: 520, mt: 1, borderRadius: 2 } }}
      >
        <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1.5 }}>
          <Typography fontWeight={700} fontSize={15} sx={{ flex: 1 }}>Notifications</Typography>
          {unreadTotal > 0 && (
            <Button size="small" startIcon={<DoneAllIcon />} disabled={markAllState.isLoading} onClick={() => markAll()}>
              Mark all read
            </Button>
          )}
        </Stack>
        <Divider />

        {badge === 0 && (
          <Stack alignItems="center" spacing={1} sx={{ py: 5, color: 'text.secondary' }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 36, color: '#16a34a' }} />
            <Typography fontSize={14} fontWeight={600}>All caught up</Typography>
            <Typography fontSize={12.5}>Nothing is waiting for you.</Typography>
          </Stack>
        )}

        {tasks.length > 0 && (
          <Box sx={{ py: 0.5 }}>
            <Typography fontSize={11} fontWeight={700} color="text.secondary" sx={{ px: 2, pt: 1, pb: 0.5, letterSpacing: '0.06em' }}>
              WAITING FOR YOU
            </Typography>
            {tasks.map((t) => (
              <Stack
                key={t.key}
                direction="row"
                spacing={1.5}
                alignItems="center"
                onClick={() => go(t.href)}
                sx={{ px: 2, py: 1.1, cursor: 'pointer', '&:hover': { bgcolor: '#f1f5f9' } }}
              >
                <Box sx={{ width: 34, height: 34, borderRadius: 1.5, display: 'grid', placeItems: 'center', bgcolor: `${t.tone}14`, color: t.tone, flexShrink: 0 }}>
                  {createElement(t.icon, { sx: { fontSize: 19 } })}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontSize={13.5} fontWeight={600}>{t.count.toLocaleString('en-IN')} {t.title}</Typography>
                  <Typography fontSize={12} color="text.secondary">{t.body}</Typography>
                </Box>
              </Stack>
            ))}
          </Box>
        )}

        {unread.length > 0 && (
          <Box sx={{ py: 0.5 }}>
            <Divider />
            <Typography fontSize={11} fontWeight={700} color="text.secondary" sx={{ px: 2, pt: 1.25, pb: 0.5, letterSpacing: '0.06em' }}>
              UNREAD ({unreadTotal})
            </Typography>
            {unread.map((n) => (
              <Box
                key={String(n.id)}
                onClick={() => { void markRead(Number(n.id)); go('/notifications'); }}
                sx={{ px: 2, py: 1, cursor: 'pointer', borderLeft: '3px solid #16a34a', '&:hover': { bgcolor: '#f1f5f9' } }}
              >
                <Typography fontSize={13.5} fontWeight={600} noWrap>{String(n.title ?? 'Notification')}</Typography>
                {Boolean(n.message) && <Typography fontSize={12} color="text.secondary" noWrap>{String(n.message)}</Typography>}
                <Typography fontSize={11} color="text.disabled">{new Date(String(n.created_at)).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Typography>
              </Box>
            ))}
          </Box>
        )}

        <Divider />
        <Button fullWidth onClick={() => go('/notifications')} sx={{ py: 1.25, borderRadius: 0 }}>
          View all notifications
        </Button>
      </Popover>
    </>
  );
}
