import { alpha, lighten, type Theme } from '@mui/material/styles';

/**
 * Colours for a coloured label, badge or callout (text `fg` on a pale `bg`)
 * that read well in both modes. In dark mode the pale background would glare,
 * so it becomes a translucent wash of `fg`, and `fg` is lightened to stay
 * readable on it.
 */
export function tone(theme: Theme, fg: string, bg: string) {
  return theme.palette.mode === 'dark'
    ? { color: lighten(fg, 0.45), bgcolor: alpha(fg, 0.18) }
    : { color: fg, bgcolor: bg };
}
