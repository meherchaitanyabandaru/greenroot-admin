import { createTheme } from '@mui/material/styles';
import { greenRootPalette } from './palette';
import { typography } from './typography';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: greenRootPalette.primary[600],
      dark: greenRootPalette.primary[900],
      light: greenRootPalette.primary[300],
      contrastText: '#FFFFFF',
    },
    success: { main: greenRootPalette.semantic.success },
    warning: { main: greenRootPalette.semantic.warning },
    error: { main: greenRootPalette.semantic.error },
    info: { main: greenRootPalette.semantic.info },
    background: {
      default: greenRootPalette.neutral.background,
      paper: greenRootPalette.neutral.surface,
    },
    text: {
      primary: greenRootPalette.neutral.text,
      secondary: greenRootPalette.neutral.textSecondary,
    },
    divider: greenRootPalette.neutral.border,
  },
  shape: {
    borderRadius: 8,
  },
  typography,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--gr-primary-900': greenRootPalette.primary[900],
          '--gr-primary-800': greenRootPalette.primary[800],
          '--gr-primary-700': greenRootPalette.primary[700],
          '--gr-primary-600': greenRootPalette.primary[600],
          '--gr-primary-500': greenRootPalette.primary[500],
          '--gr-primary-100': greenRootPalette.primary[100],
          '--gr-bg': greenRootPalette.neutral.background,
          '--gr-surface': greenRootPalette.neutral.surface,
          '--gr-border': greenRootPalette.neutral.border,
          '--gr-text': greenRootPalette.neutral.text,
        },
        body: {
          minWidth: 320,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 7,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${greenRootPalette.neutral.border}`,
          boxShadow: '0 1px 4px rgba(17, 24, 39, 0.06)',
          borderRadius: 10,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
          color: greenRootPalette.neutral.textSecondary,
          backgroundColor: greenRootPalette.neutral.surfaceSoft,
          borderBottom: `1px solid ${greenRootPalette.neutral.border}`,
          paddingTop: 10,
          paddingBottom: 10,
        },
        body: {
          fontSize: 13.5,
          paddingTop: 10,
          paddingBottom: 10,
          borderColor: greenRootPalette.neutral.border,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: greenRootPalette.neutral.surfaceSoft },
          '&:last-child td, &:last-child th': { border: 0 },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundImage: 'none' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' as const },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: { fontSize: 12 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8, fontSize: 13.5 },
      },
    },
  },
});
