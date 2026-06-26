import { createTheme } from '@mui/material/styles';
import { tokens } from './tokens';
import { typography } from './typography';

const { semantic, shadow, radius, transition, color } = tokens;

export const theme = createTheme({
  // ── Palette ──────────────────────────────────────────────────────────────
  palette: {
    mode: 'light',
    primary: {
      main:         semantic.primaryMain,
      dark:         semantic.primaryHover,
      light:        color.forest[500],
      contrastText: '#ffffff',
      50:           color.forest[50],
    },
    success: { main: semantic.primaryMid, light: semantic.primaryLight },
    warning: { main: color.amber[600],   light: color.amber[100] },
    error:   { main: color.red[600],     light: color.red[100] },
    info:    { main: color.blue[600],    light: color.blue[100] },
    background: {
      default: semantic.bg,
      paper:   semantic.surface,
    },
    text: {
      primary:   semantic.textPrimary,
      secondary: semantic.textSecondary,
      disabled:  semantic.textMuted,
    },
    divider: semantic.border,
  },

  // ── Shape ────────────────────────────────────────────────────────────────
  shape: { borderRadius: radius.md },

  typography,

  // ── Shadows — flattened to Stripe-level subtlety ─────────────────────────
  shadows: [
    'none',
    shadow.xs,
    shadow.sm,
    shadow.md,
    shadow.md,
    shadow.lg,
    shadow.lg,
    shadow.xl,
    shadow.xl,
    shadow.xl,
    shadow.xl,
    shadow.xl,
    shadow.xl,
    shadow.xl,
    shadow.xl,
    shadow.xl,
    shadow.xl,
    shadow.xl,
    shadow.xl,
    shadow.xl,
    shadow.xl,
    shadow.xl,
    shadow.xl,
    shadow.xl,
    shadow.xl,
  ],

  // ── Component overrides ───────────────────────────────────────────────────
  components: {
    // ── Global baseline ──────────────────────────────────────────────────
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          // Brand tokens as CSS custom properties (dark-mode ready — swap values here)
          '--gr-primary':        semantic.primaryMain,
          '--gr-primary-hover':  semantic.primaryHover,
          '--gr-primary-light':  semantic.primaryLight,
          '--gr-accent':         semantic.accentMain,
          '--gr-accent-light':   semantic.accentLight,
          '--gr-bg':             semantic.bg,
          '--gr-surface':        semantic.surface,
          '--gr-border':         semantic.border,
          '--gr-text':           semantic.textPrimary,
          '--gr-text-secondary': semantic.textSecondary,
          '--gr-text-muted':     semantic.textMuted,
          '--gr-shadow-card':    shadow.card,
          '--gr-shadow-hover':   shadow.cardHover,
          '--gr-radius-card':    `${radius.lg}px`,
          '--gr-transition':     transition.base,
          // Sidebar
          '--gr-sidebar-bg':     tokens.sidebar.bg,
          '--gr-sidebar-active': tokens.sidebar.colorActive,
        },
        '*, *::before, *::after': {
          boxSizing: 'border-box',
        },
        body: {
          minWidth: 320,
          fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        'a': { color: 'inherit', textDecoration: 'none' },
        '::-webkit-scrollbar': { width: 6, height: 6 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': {
          background: semantic.border,
          borderRadius: 3,
          '&:hover': { background: color.slate[300] },
        },
      },
    },

    // ── Paper / surfaces ─────────────────────────────────────────────────
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: semantic.border,
        },
        elevation1: {
          boxShadow: shadow.card,
        },
        elevation2: {
          boxShadow: shadow.sm,
        },
        elevation3: {
          boxShadow: shadow.md,
        },
      },
    },

    // ── Card ─────────────────────────────────────────────────────────────
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${semantic.border}`,
          boxShadow: shadow.card,
          borderRadius: radius.lg,
          backgroundImage: 'none',
          transition: `box-shadow ${transition.base}, transform ${transition.base}`,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 20,
          '&:last-child': { paddingBottom: 20 },
        },
      },
    },

    // ── Button ───────────────────────────────────────────────────────────
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        disableRipple: false,
      },
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          fontWeight: 500,
          fontSize: 13.5,
          letterSpacing: '-0.005em',
          transition: `all ${transition.fast}`,
          textTransform: 'none',
          '&:focus-visible': {
            outline: 'none',
            boxShadow: shadow.focus,
          },
        },
        sizeSmall: {
          fontSize: 12.5,
          padding: '4px 10px',
          borderRadius: radius.xs,
        },
        sizeMedium: {
          padding: '7px 14px',
        },
        sizeLarge: {
          padding: '10px 20px',
          fontSize: 14.5,
        },
        contained: {
          backgroundColor: semantic.primaryMain,
          color: '#ffffff',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: semantic.primaryHover,
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          },
          '&:active': {
            backgroundColor: semantic.primaryActive,
            boxShadow: 'none',
            transform: 'translateY(1px)',
          },
          '&.Mui-disabled': {
            backgroundColor: color.slate[100],
            color: color.slate[400],
          },
        },
        outlined: {
          borderColor: semantic.border,
          color: semantic.textPrimary,
          backgroundColor: semantic.surface,
          '&:hover': {
            backgroundColor: semantic.surfaceHover,
            borderColor: color.slate[300],
          },
          '&:active': { transform: 'translateY(1px)' },
        },
        text: {
          color: semantic.textSecondary,
          '&:hover': {
            backgroundColor: semantic.surfaceHover,
            color: semantic.textPrimary,
          },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          transition: `all ${transition.fast}`,
          '&:hover': {
            backgroundColor: semantic.surfaceHover,
          },
          '&:focus-visible': {
            boxShadow: shadow.focus,
            outline: 'none',
          },
        },
        sizeSmall: {
          padding: 5,
        },
      },
    },

    // ── TextField / Input ────────────────────────────────────────────────
    MuiTextField: {
      defaultProps: { size: 'small' as const },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          backgroundColor: semantic.surface,
          fontSize: 13.5,
          transition: `box-shadow ${transition.fast}, border-color ${transition.fast}`,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: semantic.border,
            transition: `border-color ${transition.fast}`,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: color.slate[400],
          },
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: semantic.primaryMain,
              borderWidth: 1.5,
            },
            boxShadow: shadow.focus,
          },
          '&.Mui-error': {
            '&.Mui-focused': { boxShadow: shadow.focusError },
          },
          '&.Mui-disabled': {
            backgroundColor: semantic.bg,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: semantic.border,
            },
          },
        },
        sizeSmall: {
          '& input': { padding: '7px 12px' },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: 13.5,
          color: semantic.textSecondary,
          '&.Mui-focused': { color: semantic.primaryMain },
          '&.Mui-error':   { color: color.red[600] },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: { fontSize: 12, marginTop: 4 },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          fontSize: 13.5,
          '&:focus': { backgroundColor: 'transparent' },
        },
      },
    },

    // ── Table ────────────────────────────────────────────────────────────
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: radius.lg,
          border: `1px solid ${semantic.border}`,
          boxShadow: shadow.card,
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: { borderCollapse: 'separate', borderSpacing: 0 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: color.slate[50],
            borderBottom: `1px solid ${semantic.border}`,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.07em',
            color: semantic.textSecondary,
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 16,
            paddingRight: 16,
            whiteSpace: 'nowrap' as const,
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            transition: `background-color ${transition.fast}`,
            '&:hover': {
              backgroundColor: '#f8fafc',
              '& .MuiTableCell-root': { color: semantic.textPrimary },
            },
            '&:last-child .MuiTableCell-root': { borderBottom: 0 },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: semantic.border,
          padding: '10px 16px',
          fontSize: 13.5,
          color: semantic.textPrimary,
          verticalAlign: 'middle',
        },
        head: {
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: semantic.textSecondary,
          backgroundColor: color.slate[50],
          borderBottom: `1px solid ${semantic.border}`,
          paddingTop: 10,
          paddingBottom: 10,
        },
        body: {
          fontSize: 13.5,
          color: semantic.textPrimary,
          borderBottom: `1px solid ${semantic.border}`,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: `background-color ${transition.fast}`,
          '&:hover': { backgroundColor: color.slate[50] },
          '&:last-child td, &:last-child th': { border: 0 },
          '&.MuiTableRow-head': { backgroundColor: color.slate[50] },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          fontSize: 13,
          color: semantic.textSecondary,
          borderTop: `1px solid ${semantic.border}`,
        },
        select: { fontSize: 13 },
        displayedRows: { fontSize: 13 },
      },
    },

    // ── Chip ─────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radius.xs,
          fontWeight: 500,
          fontSize: 12,
          height: 22,
          transition: `all ${transition.fast}`,
          '& .MuiChip-label': { paddingLeft: 8, paddingRight: 8 },
        },
        sizeSmall: {
          height: 20,
          fontSize: 11,
          '& .MuiChip-label': { paddingLeft: 7, paddingRight: 7 },
        },
        outlined: {
          borderColor: semantic.border,
          backgroundColor: 'transparent',
          '&:hover': { backgroundColor: semantic.surfaceHover },
        },
      },
    },

    // ── Tabs ─────────────────────────────────────────────────────────────
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 38,
          borderBottom: `1px solid ${semantic.border}`,
        },
        indicator: {
          height: 2,
          borderRadius: 1,
          backgroundColor: semantic.primaryMain,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 38,
          padding: '0 14px',
          fontSize: 13,
          fontWeight: 500,
          textTransform: 'none',
          letterSpacing: '-0.003em',
          color: semantic.textSecondary,
          transition: `color ${transition.fast}`,
          '&:hover': { color: semantic.textPrimary },
          '&.Mui-selected': {
            color: semantic.textPrimary,
            fontWeight: 600,
          },
          '&:focus-visible': { outline: 'none', boxShadow: shadow.focus },
        },
      },
    },

    // ── Drawer ───────────────────────────────────────────────────────────
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundImage: 'none' },
      },
    },

    // ── AppBar ───────────────────────────────────────────────────────────
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: semantic.surface,
          color: semantic.textPrimary,
          borderBottom: `1px solid ${semantic.border}`,
          boxShadow: 'none',
        },
      },
    },

    // ── Alert ────────────────────────────────────────────────────────────
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          fontSize: 13.5,
          border: '1px solid transparent',
        },
        standardSuccess: {
          backgroundColor: color.forest[50],
          color: color.forest[900],
          borderColor: color.forest[200],
          '& .MuiAlert-icon': { color: color.forest[700] },
        },
        standardWarning: {
          backgroundColor: color.amber[50],
          color: color.amber[700],
          borderColor: color.amber[100],
          '& .MuiAlert-icon': { color: color.amber[600] },
        },
        standardError: {
          backgroundColor: color.red[50],
          color: color.red[700],
          borderColor: color.red[100],
          '& .MuiAlert-icon': { color: color.red[600] },
        },
        standardInfo: {
          backgroundColor: color.blue[50],
          color: color.blue[700],
          borderColor: color.blue[100],
          '& .MuiAlert-icon': { color: color.blue[600] },
        },
        filledSuccess:  { backgroundColor: color.forest[700] },
        filledWarning:  { backgroundColor: color.amber[600] },
        filledError:    { backgroundColor: color.red[600] },
        filledInfo:     { backgroundColor: color.blue[600] },
      },
    },

    // ── Tooltip ──────────────────────────────────────────────────────────
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: {
          fontSize: 12,
          fontWeight: 500,
          backgroundColor: color.slate[900],
          color: '#ffffff',
          borderRadius: radius.sm,
          padding: '5px 10px',
          boxShadow: shadow.tooltip,
          letterSpacing: '-0.003em',
        },
        arrow: { color: color.slate[900] },
      },
    },

    // ── Snackbar ─────────────────────────────────────────────────────────
    MuiSnackbar: {
      styleOverrides: {
        root: { bottom: 24, right: 24 },
      },
    },

    // ── Dialog ───────────────────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radius.xl,
          boxShadow: shadow.modal,
          border: `1px solid ${semantic.border}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: '-0.005em',
          padding: '20px 24px 12px',
        },
      },
    },

    // ── Menu / Popover ───────────────────────────────────────────────────
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: radius.md,
          border: `1px solid ${semantic.border}`,
          boxShadow: shadow.popover,
          marginTop: 4,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: 13.5,
          padding: '7px 12px',
          borderRadius: radius.xs,
          margin: '2px 6px',
          transition: `background-color ${transition.fast}`,
          '&:hover': { backgroundColor: semantic.surfaceHover },
          '&.Mui-selected': {
            backgroundColor: semantic.primaryLight,
            color: semantic.primaryMain,
            fontWeight: 600,
            '&:hover': { backgroundColor: color.forest[100] },
          },
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: radius.md,
          border: `1px solid ${semantic.border}`,
          boxShadow: shadow.popover,
        },
      },
    },

    // ── List ─────────────────────────────────────────────────────────────
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          transition: `all ${transition.fast}`,
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: { fontSize: 13.5 },
        secondary: { fontSize: 12 },
      },
    },

    // ── Divider ──────────────────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: semantic.border },
      },
    },

    // ── Badge ────────────────────────────────────────────────────────────
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontSize: 10,
          fontWeight: 700,
          minWidth: 16,
          height: 16,
          padding: '0 4px',
        },
        dot: { minWidth: 7, height: 7 },
      },
    },

    // ── Avatar ───────────────────────────────────────────────────────────
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: 13,
        },
      },
    },

    // ── LinearProgress ───────────────────────────────────────────────────
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: radius.pill,
          height: 3,
          backgroundColor: color.slate[100],
        },
        bar: {
          borderRadius: radius.pill,
          backgroundColor: semantic.primaryMain,
        },
      },
    },

    // ── Skeleton ─────────────────────────────────────────────────────────
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: color.slate[100],
          '&::after': {
            background: `linear-gradient(90deg, transparent, ${color.slate[50]}, transparent)`,
          },
        },
      },
    },

    // ── Collapse / Transitions ───────────────────────────────────────────
    MuiCollapse: {
      styleOverrides: {
        root: { transition: `height ${transition.base}` },
      },
    },
  },
});
