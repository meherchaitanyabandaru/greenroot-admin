import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import SearchIcon from '@mui/icons-material/Search';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  CircularProgress,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Popover,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { baseApi } from '../api/baseApi';
import { getStoredAuth } from '../api/authStorage';
import { navigationGroups, type NavGroup } from '../components/navigation/navigationGroups';
import { useLogoutMutation } from '../features/auth/authApi';
import { clearAuth } from '../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { tokens } from '../theme/tokens';

const { sidebar: sb, semantic, shadow, transition, radius } = tokens;

const DRAWER_FULL = 256;
const DRAWER_MINI = 58;
const EXPANDED_KEY = 'gr_nav_expanded';

// ── Emoji map for group headers ───────────────────────────────────────────────
const GROUP_EMOJI: Record<string, string> = {
  'User Management': '👥',
  'Plant Catalog':   '🌱',
  'Nursery Network': '🏡',
  'Commerce':        '🛒',
  'Logistics':       '🚚',
  'Notifications':   '🔔',
  'Billing':         '💳',
  'Platform':        '⚙️',
};

// ── Logo mark ─────────────────────────────────────────────────────────────────
function GrLogo({ size = 30 }: { size?: number }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 1.5,
        bgcolor: sb.logoBg,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        fontWeight: 900,
        fontSize: size * 0.38,
        color: sb.logoText,
        letterSpacing: '-0.04em',
        fontFamily: tokens.font.family,
        userSelect: 'none',
      }}
    >
      GR
    </Box>
  );
}

// ── Single nav item ────────────────────────────────────────────────────────────
function NavItem({
  item,
  indent = false,
  onNavigate,
}: {
  item: { label: string; path: string; icon: React.ElementType };
  indent?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <ListItemButton
      component={NavLink}
      to={item.path}
      end={item.path === '/'}
      onClick={onNavigate}
      sx={{
        borderRadius: `${radius.sm}px`,
        mb: 0.25,
        minHeight: 34,
        pl: indent ? 4 : 1.25,
        pr: 1.25,
        py: 0.625,
        color: sb.colorText,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 2.5,
          height: 0,
          borderRadius: 2,
          bgcolor: sb.colorActive,
          transition: `height ${transition.fast}`,
        },
        '&.active': {
          bgcolor: sb.bgActive,
          color: sb.colorActive,
          fontWeight: 600,
          '&::before': { height: '60%' },
          '& .MuiListItemIcon-root': { color: sb.colorActive },
          '& .MuiListItemText-primary': { fontWeight: 600 },
        },
        '&:hover:not(.active)': {
          bgcolor: sb.bgHover,
          color: sb.colorTextHover,
          '& .MuiListItemIcon-root': { color: sb.colorTextHover },
        },
        transition: `all ${transition.fast}`,
      }}
    >
      {!indent && (
        <ListItemIcon sx={{ color: 'inherit', minWidth: 30 }}>
          <Icon sx={{ fontSize: 16, transition: `color ${transition.fast}` }} />
        </ListItemIcon>
      )}
      <ListItemText
        primary={item.label}
        primaryTypographyProps={{
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.2,
          letterSpacing: '-0.003em',
        }}
      />
    </ListItemButton>
  );
}

// ── Flyout popover for mini sidebar ───────────────────────────────────────────
function GroupFlyout({
  group,
  anchorEl,
  onClose,
  onNavigate,
}: {
  group: NavGroup;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onNavigate: () => void;
}) {
  const emoji = GROUP_EMOJI[group.section] ?? '';
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      PaperProps={{
        elevation: 0,
        sx: {
          ml: 1,
          bgcolor: sb.bg,
          color: '#fff',
          borderRadius: 2,
          minWidth: 188,
          overflow: 'hidden',
          border: `1px solid ${sb.divider}`,
          boxShadow: shadow.popover,
        },
      }}
      disableRestoreFocus
    >
      {group.section && (
        <Box sx={{ px: 2, pt: 1.5, pb: 0.75 }}>
          <Typography
            fontSize={10}
            fontWeight={700}
            textTransform="uppercase"
            letterSpacing="0.08em"
            color={sb.groupLabel}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
          >
            {emoji && <span style={{ fontSize: 11 }}>{emoji}</span>}
            {group.section}
          </Typography>
        </Box>
      )}
      <List dense disablePadding sx={{ px: 0.75, pb: 0.75 }}>
        {group.items.map((item) => {
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              end={item.path === '/'}
              onClick={() => { onNavigate(); onClose(); }}
              sx={{
                borderRadius: `${radius.sm}px`,
                mb: 0.25,
                minHeight: 32,
                px: 1.25,
                color: sb.colorText,
                '&.active': {
                  bgcolor: sb.bgActive,
                  color: sb.colorActive,
                  '& .MuiListItemIcon-root': { color: sb.colorActive },
                },
                '&:hover:not(.active)': { bgcolor: sb.bgHover, color: sb.colorTextHover },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 28 }}>
                <Icon sx={{ fontSize: 15 }} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: 12.5, fontWeight: 500, letterSpacing: '-0.003em' }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Popover>
  );
}

// ── Full sidebar ───────────────────────────────────────────────────────────────
function SidebarFull({
  onNavigate,
  onToggleCollapse,
}: {
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  const location = useLocation();

  function getActiveGroup(): string {
    for (const g of navigationGroups) {
      for (const item of g.items) {
        if (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)) {
          return g.section;
        }
      }
    }
    return '';
  }

  const [expanded, setExpanded] = useState<string>(() => {
    try { return localStorage.getItem(EXPANDED_KEY) ?? getActiveGroup(); }
    catch { return getActiveGroup(); }
  });

  useEffect(() => {
    const activeGroup = getActiveGroup();
    if (activeGroup && activeGroup !== expanded) setExpanded(activeGroup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleGroup = useCallback((section: string) => {
    const next = expanded === section ? '' : section;
    setExpanded(next);
    try { localStorage.setItem(EXPANDED_KEY, next); } catch { /* ignore */ }
  }, [expanded]);

  return (
    <Stack sx={{ height: '100%', overflow: 'hidden', bgcolor: sb.bg }}>
      {/* Logo header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, minHeight: 54, flexShrink: 0 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <GrLogo />
          <Box>
            <Typography
              fontWeight={800}
              fontSize={14}
              color="#fff"
              lineHeight={1.2}
              letterSpacing="-0.03em"
            >
              GreenRoot
            </Typography>
            <Typography fontSize={10} sx={{ color: sb.groupLabel, lineHeight: 1, letterSpacing: '0.04em' }}>
              Admin Console
            </Typography>
          </Box>
        </Stack>
        {onToggleCollapse && (
          <Tooltip title="Collapse sidebar" placement="right">
            <IconButton
              onClick={onToggleCollapse}
              size="small"
              sx={{
                color: 'rgba(255,255,255,0.25)',
                '&:hover': { color: '#fff', bgcolor: sb.bgHover },
                borderRadius: `${radius.sm}px`,
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Box sx={{ borderBottom: `1px solid ${sb.divider}`, flexShrink: 0 }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1.25, px: 1 }}>
        {navigationGroups.map((group) => {
          const isRoot = !group.section;
          const isOpen = isRoot || expanded === group.section;
          const emoji = GROUP_EMOJI[group.section] ?? '';

          return (
            <Box key={group.section || '__root'} mb={0.25}>
              {/* Group accordion header */}
              {!isRoot && (
                <ListItemButton
                  onClick={() => toggleGroup(group.section)}
                  sx={{
                    px: 1.25,
                    py: 0.5,
                    minHeight: 30,
                    borderRadius: `${radius.sm}px`,
                    mb: 0.25,
                    color: isOpen ? sb.colorTextHover : sb.groupLabel,
                    '&:hover': { bgcolor: sb.bgHover, color: sb.colorTextHover },
                    transition: `all ${transition.fast}`,
                  }}
                >
                  {emoji && (
                    <Box component="span" sx={{ fontSize: 12, mr: 1, lineHeight: 1 }}>
                      {emoji}
                    </Box>
                  )}
                  <ListItemText
                    primary={group.section}
                    primaryTypographyProps={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      lineHeight: 1,
                    }}
                  />
                  {isOpen
                    ? <ExpandLessIcon sx={{ fontSize: 13, opacity: 0.5 }} />
                    : <ExpandMoreIcon sx={{ fontSize: 13, opacity: 0.35 }} />
                  }
                </ListItemButton>
              )}

              {/* Items */}
              <Collapse in={isOpen} timeout={200} unmountOnExit>
                <List dense disablePadding>
                  {group.items.map((item) => (
                    <NavItem
                      key={item.path}
                      item={item}
                      indent={!isRoot}
                      onNavigate={onNavigate}
                    />
                  ))}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </Box>

      {/* Copyright footer */}
      <Box sx={{ borderTop: `1px solid ${sb.divider}`, flexShrink: 0 }} />
      <Box sx={{ px: 2, py: 1.5, flexShrink: 0 }}>
        <Typography fontSize={10} color={sb.copyright} lineHeight={1.6} letterSpacing="-0.01em">
          © {new Date().getFullYear()} GreenRoot Pvt. Ltd.
        </Typography>
        <Typography fontSize={10} color="rgba(255,255,255,0.15)" lineHeight={1.4}>
          All rights reserved.
        </Typography>
      </Box>
    </Stack>
  );
}

// ── Mini sidebar (icons only + flyout) ────────────────────────────────────────
function SidebarMini({ onExpand }: { onExpand: () => void }) {
  const [flyout, setFlyout] = useState<{ group: NavGroup; el: HTMLElement } | null>(null);
  const location = useLocation();

  function isGroupActive(group: NavGroup): boolean {
    return group.items.some((item) =>
      item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path),
    );
  }

  return (
    <Stack
      sx={{ height: '100%', overflow: 'hidden', bgcolor: sb.bg }}
      alignItems="center"
    >
      <Box sx={{ minHeight: 54, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <GrLogo size={28} />
      </Box>

      <Box sx={{ width: '70%', borderBottom: `1px solid ${sb.divider}`, flexShrink: 0 }} />

      <Box sx={{ flex: 1, overflowY: 'auto', width: '100%', py: 1 }}>
        {navigationGroups.map((group) => {
          const isRoot = !group.section;
          const active = isGroupActive(group);

          if (isRoot) {
            return group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Tooltip key={item.path} title={item.label} placement="right">
                  <ListItemButton
                    component={NavLink}
                    to={item.path}
                    end
                    sx={{
                      justifyContent: 'center',
                      borderRadius: `${radius.sm}px`,
                      mx: 0.75,
                      mb: 0.25,
                      minHeight: 34,
                      color: sb.colorText,
                      '&.active': { bgcolor: sb.bgActive, color: sb.colorActive },
                      '&:hover:not(.active)': { bgcolor: sb.bgHover, color: sb.colorTextHover },
                    }}
                  >
                    <Icon sx={{ fontSize: 17 }} />
                  </ListItemButton>
                </Tooltip>
              );
            });
          }

          const RepIcon = group.items[0].icon;
          const emoji = GROUP_EMOJI[group.section] ?? '';
          return (
            <Box key={group.section}>
              <Box sx={{ width: '70%', mx: 'auto', my: 0.5, borderTop: `1px solid ${sb.divider}` }} />
              <Tooltip title={`${emoji} ${group.section}`.trim()} placement="right">
                <ListItemButton
                  onClick={(e) => setFlyout({ group, el: e.currentTarget })}
                  sx={{
                    justifyContent: 'center',
                    borderRadius: `${radius.sm}px`,
                    mx: 0.75,
                    mb: 0.25,
                    minHeight: 34,
                    color: active ? sb.colorActive : sb.colorText,
                    bgcolor: active ? sb.bgActive : 'transparent',
                    '&:hover': { bgcolor: sb.bgHover, color: sb.colorTextHover },
                  }}
                >
                  <RepIcon sx={{ fontSize: 17 }} />
                </ListItemButton>
              </Tooltip>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ width: '70%', borderTop: `1px solid ${sb.divider}`, flexShrink: 0 }} />
      <Box sx={{ py: 1, flexShrink: 0 }}>
        <Tooltip title="Expand sidebar" placement="right">
          <IconButton
            onClick={onExpand}
            size="small"
            sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#fff', bgcolor: sb.bgHover } }}
          >
            <ChevronRightIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {flyout && (
        <GroupFlyout
          group={flyout.group}
          anchorEl={flyout.el}
          onClose={() => setFlyout(null)}
          onNavigate={() => setFlyout(null)}
        />
      )}
    </Stack>
  );
}

// ── Main layout ────────────────────────────────────────────────────────────────
export function AdminLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [logout, logoutState] = useLogoutMutation();
  const isMobile = useMediaQuery('(max-width:900px)');
  const user = useAppSelector((state) => state.auth.user);

  const drawerWidth = collapsed && !isMobile ? DRAWER_MINI : DRAWER_FULL;

  async function handleLogout() {
    const refreshToken = getStoredAuth()?.refreshToken;
    try {
      await logout({ refresh_token: refreshToken }).unwrap();
    } finally {
      dispatch(clearAuth());
      dispatch(baseApi.util.resetApiState());
      navigate('/login', { replace: true });
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { width: DRAWER_FULL, border: 0, boxShadow: shadow.modal } }}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <SidebarFull onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        PaperProps={{
          sx: {
            width: drawerWidth,
            border: 0,
            borderRight: `1px solid rgba(255,255,255,0.04)`,
            transition: `width ${transition.drawer}`,
            overflow: 'visible',
          },
        }}
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          transition: `width ${transition.drawer}`,
        }}
      >
        {collapsed
          ? <SidebarMini onExpand={() => setCollapsed(false)} />
          : <SidebarFull onToggleCollapse={() => setCollapsed(true)} />
        }
      </Drawer>

      {/* Main area */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          transition: `margin ${transition.drawer}`,
        }}
      >
        {/* Topbar */}
        <AppBar
          color="inherit"
          elevation={0}
          position="sticky"
          sx={{ zIndex: 1100 }}
        >
          <Toolbar sx={{ gap: 1.5, minHeight: '54px !important', px: { xs: 2, md: 3 } }}>
            {isMobile && (
              <IconButton
                size="small"
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 0.5 }}
              >
                <MenuIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}

            {/* ⌘K Search */}
            <TextField
              placeholder="Search…"
              size="small"
              sx={{ maxWidth: 260, flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 15, color: semantic.textMuted }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Box
                        sx={{
                          display: { xs: 'none', sm: 'flex' },
                          alignItems: 'center',
                          gap: 0.25,
                          px: 0.75,
                          py: 0.25,
                          borderRadius: `${radius.xs}px`,
                          bgcolor: semantic.bg,
                          border: `1px solid ${semantic.border}`,
                          color: semantic.textMuted,
                          fontSize: 10.5,
                          fontWeight: 500,
                          lineHeight: 1,
                          letterSpacing: '0.02em',
                          whiteSpace: 'nowrap',
                          userSelect: 'none',
                        }}
                      >
                        ⌘K
                      </Box>
                    </InputAdornment>
                  ),
                  sx: {
                    fontSize: 13.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: semantic.border },
                  },
                },
              }}
            />

            <Box sx={{ flex: 1 }} />

            {/* Notification bell */}
            <Tooltip title="Notifications">
              <IconButton
                size="small"
                sx={{
                  color: semantic.textSecondary,
                  '&:hover': { color: semantic.textPrimary, bgcolor: semantic.surfaceHover },
                }}
              >
                <Badge color="error" variant="dot" invisible>
                  <NotificationsNoneIcon sx={{ fontSize: 18 }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Divider */}
            <Box sx={{ width: 1, height: 20, bgcolor: semantic.border, mx: 0.5 }} />

            {/* User */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar
                sx={{
                  bgcolor: semantic.primaryMain,
                  width: 28,
                  height: 28,
                  fontSize: 11.5,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              >
                {user?.first_name?.[0] ?? 'A'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography fontWeight={600} fontSize={13} lineHeight={1.2} letterSpacing="-0.01em">
                  {user?.first_name ?? 'Admin'}
                </Typography>
                <Typography color="text.secondary" fontSize={11} lineHeight={1.2} sx={{ opacity: 0.7 }}>
                  Super Admin
                </Typography>
              </Box>
            </Stack>

            <Tooltip title="Sign out">
              <span>
                <IconButton
                  size="small"
                  disabled={logoutState.isLoading}
                  onClick={handleLogout}
                  aria-label="Sign out"
                  sx={{
                    color: semantic.textSecondary,
                    '&:hover': { color: tokens.color.red[600], bgcolor: tokens.color.red[50] },
                  }}
                >
                  {logoutState.isLoading
                    ? <CircularProgress size={15} />
                    : <LogoutIcon sx={{ fontSize: 16 }} />
                  }
                </IconButton>
              </span>
            </Tooltip>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box
          component="main"
          sx={{ flex: 1, px: { xs: 2, md: 3 }, py: 3 }}
        >
          <Outlet />
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            borderTop: `1px solid ${semantic.border}`,
            px: { xs: 2, md: 3 },
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            bgcolor: semantic.surface,
          }}
        >
          <Typography fontSize={12} color="text.disabled" letterSpacing="-0.01em">
            © {new Date().getFullYear()} GreenRoot Pvt. Ltd. All rights reserved.
          </Typography>
          <Typography fontSize={12} color="text.disabled">
            Admin Console v1.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
