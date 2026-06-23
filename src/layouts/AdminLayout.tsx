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
import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { baseApi } from '../api/baseApi';
import { getStoredAuth } from '../api/authStorage';
import { navigationGroups, type NavGroup } from '../components/navigation/navigationGroups';
import { useLogoutMutation } from '../features/auth/authApi';
import { clearAuth } from '../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../hooks/redux';

const DRAWER_FULL = 252;
const DRAWER_MINI = 60;
const EXPANDED_KEY = 'gr_nav_expanded';

function GrLogo({ size = 30 }: { size?: number }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 1.5,
        bgcolor: '#A3D65C',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        fontWeight: 900,
        fontSize: size * 0.4,
        color: '#0B3D1C',
        letterSpacing: '-0.02em',
      }}
    >
      GR
    </Box>
  );
}

// ─── Nav item link ─────────────────────────────────────────────────────────────
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
        borderRadius: 1.5,
        mb: 0.25,
        minHeight: 36,
        pl: indent ? 4.5 : 1.25,
        pr: 1.25,
        color: 'rgba(255,255,255,0.6)',
        '&.active': {
          bgcolor: 'rgba(163,214,92,0.18)',
          color: '#A3D65C',
          '& .MuiListItemIcon-root': { color: '#A3D65C' },
        },
        '&:hover:not(.active)': {
          bgcolor: 'rgba(255,255,255,0.07)',
          color: 'rgba(255,255,255,0.9)',
        },
      }}
    >
      {!indent && (
        <ListItemIcon sx={{ color: 'inherit', minWidth: 32 }}>
          <Icon sx={{ fontSize: 18 }} />
        </ListItemIcon>
      )}
      <ListItemText
        primary={item.label}
        primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1 }}
      />
    </ListItemButton>
  );
}

// ─── Flyout popover for collapsed mode ────────────────────────────────────────
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
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      PaperProps={{
        elevation: 8,
        sx: {
          ml: 1,
          bgcolor: '#0B3D1C',
          color: '#fff',
          borderRadius: 2,
          minWidth: 180,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      }}
      disableRestoreFocus
    >
      {group.section && (
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
          <Typography fontSize={10} fontWeight={700} textTransform="uppercase" letterSpacing="0.07em" color="rgba(255,255,255,0.4)">
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
                borderRadius: 1.5,
                mb: 0.25,
                minHeight: 34,
                px: 1.25,
                color: 'rgba(255,255,255,0.7)',
                '&.active': {
                  bgcolor: 'rgba(163,214,92,0.18)',
                  color: '#A3D65C',
                  '& .MuiListItemIcon-root': { color: '#A3D65C' },
                },
                '&:hover:not(.active)': {
                  bgcolor: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 30 }}>
                <Icon sx={{ fontSize: 16 }} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Popover>
  );
}

// ─── Full sidebar content (expanded or mobile) ────────────────────────────────
function SidebarFull({
  onNavigate,
  onToggleCollapse,
}: {
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  const location = useLocation();

  // Find which group the current route belongs to
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
    try {
      return localStorage.getItem(EXPANDED_KEY) ?? getActiveGroup();
    } catch {
      return getActiveGroup();
    }
  });

  // Keep expanded group in sync with navigation
  useEffect(() => {
    const activeGroup = getActiveGroup();
    if (activeGroup && activeGroup !== expanded) {
      setExpanded(activeGroup);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  function toggleGroup(section: string) {
    const next = expanded === section ? '' : section;
    setExpanded(next);
    try { localStorage.setItem(EXPANDED_KEY, next); } catch { /* ignore */ }
  }

  return (
    <Stack sx={{ height: '100%', overflow: 'hidden' }}>
      {/* Logo */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, minHeight: 56, flexShrink: 0 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <GrLogo />
          <Box>
            <Typography fontWeight={800} fontSize={14.5} color="#fff" lineHeight={1.2}>
              GreenRoot
            </Typography>
            <Typography fontSize={10} sx={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1 }}>
              Admin Console
            </Typography>
          </Box>
        </Stack>
        {onToggleCollapse && (
          <IconButton
            onClick={onToggleCollapse}
            size="small"
            sx={{ color: 'rgba(255,255,255,0.35)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
        {navigationGroups.map((group) => {
          const isRoot = !group.section;
          const isOpen = isRoot || expanded === group.section;

          return (
            <Box key={group.section || '__root'}>
              {/* Group header */}
              {!isRoot && (
                <ListItemButton
                  onClick={() => toggleGroup(group.section)}
                  sx={{
                    px: 2,
                    py: 0.625,
                    minHeight: 32,
                    color: isOpen ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)',
                    '&:hover': { color: 'rgba(255,255,255,0.75)', bgcolor: 'transparent' },
                  }}
                >
                  <ListItemText
                    primary={group.section}
                    primaryTypographyProps={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                    }}
                  />
                  {isOpen ? (
                    <ExpandLessIcon sx={{ fontSize: 14, opacity: 0.5 }} />
                  ) : (
                    <ExpandMoreIcon sx={{ fontSize: 14, opacity: 0.35 }} />
                  )}
                </ListItemButton>
              )}

              {/* Group items */}
              <Collapse in={isOpen} timeout={220} unmountOnExit>
                <List dense disablePadding sx={{ px: 1 }}>
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
    </Stack>
  );
}

// ─── Mini sidebar (collapsed, icons only with flyout) ─────────────────────────
function SidebarMini({ onExpand }: { onExpand: () => void }) {
  const [flyout, setFlyout] = useState<{ group: NavGroup; el: HTMLElement } | null>(null);
  const location = useLocation();

  function isGroupActive(group: NavGroup): boolean {
    return group.items.some((item) =>
      item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path),
    );
  }

  // For root group (Dashboard), show the item icon directly
  // For other groups, show a representative icon (first item's icon)
  return (
    <Stack sx={{ height: '100%', overflow: 'hidden' }} alignItems="center">
      {/* Logo + expand toggle */}
      <Box sx={{ minHeight: 56, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <GrLogo size={30} />
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', width: '80%', flexShrink: 0 }} />

      <Box sx={{ flex: 1, overflowY: 'auto', width: '100%', py: 1 }}>
        {navigationGroups.map((group) => {
          const isRoot = !group.section;
          const active = isGroupActive(group);

          if (isRoot) {
            // Root group: show items directly (Dashboard only)
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
                      borderRadius: 1.5,
                      mx: 0.5,
                      mb: 0.25,
                      minHeight: 36,
                      color: 'rgba(255,255,255,0.6)',
                      '&.active': { bgcolor: 'rgba(163,214,92,0.18)', color: '#A3D65C' },
                      '&:hover:not(.active)': { bgcolor: 'rgba(255,255,255,0.07)', color: '#fff' },
                    }}
                  >
                    <Icon sx={{ fontSize: 18 }} />
                  </ListItemButton>
                </Tooltip>
              );
            });
          }

          const RepIcon = group.items[0].icon;
          return (
            <Box key={group.section}>
              <Divider sx={{ my: 0.5, mx: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
              <Tooltip title={group.section} placement="right">
                <ListItemButton
                  onClick={(e) => setFlyout({ group, el: e.currentTarget })}
                  sx={{
                    justifyContent: 'center',
                    borderRadius: 1.5,
                    mx: 0.5,
                    mb: 0.25,
                    minHeight: 36,
                    color: active ? '#A3D65C' : 'rgba(255,255,255,0.55)',
                    bgcolor: active ? 'rgba(163,214,92,0.12)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', color: '#fff' },
                  }}
                >
                  <RepIcon sx={{ fontSize: 18 }} />
                </ListItemButton>
              </Tooltip>
            </Box>
          );
        })}
      </Box>

      {/* Expand chevron at bottom */}
      <Box sx={{ py: 1, flexShrink: 0 }}>
        <Tooltip title="Expand sidebar" placement="right">
          <IconButton
            onClick={onExpand}
            size="small"
            sx={{ color: 'rgba(255,255,255,0.35)', '&:hover': { color: '#fff' } }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Flyout popover */}
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

// ─── Main layout ──────────────────────────────────────────────────────────────
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
        PaperProps={{ sx: { width: DRAWER_FULL, bgcolor: 'primary.dark', border: 0 } }}
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
            bgcolor: 'primary.dark',
            border: 0,
            transition: 'width 0.22s cubic-bezier(0.4,0,0.6,1)',
            overflow: 'visible',
          },
        }}
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          transition: 'width 0.22s cubic-bezier(0.4,0,0.6,1)',
        }}
      >
        {collapsed ? (
          <SidebarMini onExpand={() => setCollapsed(false)} />
        ) : (
          <SidebarFull onToggleCollapse={() => setCollapsed(true)} />
        )}
      </Drawer>

      {/* Main area */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          transition: 'margin 0.22s cubic-bezier(0.4,0,0.6,1)',
        }}
      >
        <AppBar
          color="inherit"
          elevation={0}
          position="sticky"
          sx={{ borderBottom: 1, borderColor: 'divider', zIndex: 1100 }}
        >
          <Toolbar sx={{ gap: 1, minHeight: '56px !important', px: { xs: 2, md: 3 } }}>
            {isMobile && (
              <IconButton size="small" edge="start" onClick={() => setMobileOpen(true)}>
                <MenuIcon fontSize="small" />
              </IconButton>
            )}

            <TextField
              placeholder="Search…"
              size="small"
              sx={{ maxWidth: 280, flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  sx: { fontSize: 13.5 },
                },
              }}
            />

            <Box sx={{ flex: 1 }} />

            <Tooltip title="Notifications">
              <IconButton size="small">
                <Badge color="error" variant="dot" invisible>
                  <NotificationsNoneIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 0.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 30, height: 30, fontSize: 12, fontWeight: 700 }}>
                {user?.first_name?.[0] ?? 'A'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography fontWeight={600} fontSize={13} lineHeight={1.2}>
                  {user?.first_name ?? 'Admin'}
                </Typography>
                <Typography color="text.secondary" fontSize={11} lineHeight={1.2}>
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
                >
                  {logoutState.isLoading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <LogoutIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3 }, py: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
