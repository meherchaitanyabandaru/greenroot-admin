import { tokens } from './tokens';

// Re-exported for legacy usage in components that import directly from palette.
// Prefer importing `tokens` directly for new code.
export const greenRootPalette = {
  primary: {
    950: tokens.color.forest[950],
    900: tokens.color.forest[900],
    800: tokens.color.forest[800],
    700: tokens.color.forest[700],
    600: tokens.color.forest[600],
    500: tokens.color.forest[500],
    400: tokens.color.forest[400],
    200: tokens.color.forest[200],
    100: tokens.color.forest[100],
    50:  tokens.color.forest[50],
  },
  accent: {
    lime:   tokens.color.lime[500],
    mint:   tokens.color.teal[500],
    amber:  tokens.color.amber[500],
    blue:   tokens.color.blue[500],
    red:    tokens.color.red[500],
    teal:   tokens.color.teal[500],
    purple: tokens.color.purple[500],
  },
  neutral: {
    background:    tokens.semantic.bg,
    surface:       tokens.semantic.surface,
    surfaceSoft:   tokens.semantic.surfaceHover,
    border:        tokens.semantic.border,
    text:          tokens.semantic.textPrimary,
    textSecondary: tokens.semantic.textSecondary,
    textMuted:     tokens.semantic.textMuted,
  },
  semantic: {
    success: tokens.semantic.primaryMid,
    warning: tokens.color.amber[600],
    error:   tokens.color.red[600],
    info:    tokens.color.blue[600],
  },
  chart: tokens.chart,
};
