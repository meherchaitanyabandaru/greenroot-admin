import type { ThemeOptions } from '@mui/material/styles';
import { tokens } from './tokens';

const { font } = tokens;

export const typography: ThemeOptions['typography'] = {
  fontFamily: font.family,
  fontSize: 14,

  h1: {
    fontSize: font.h1.size,
    fontWeight: font.h1.weight,
    lineHeight: font.h1.lineHeight,
    letterSpacing: font.h1.letterSpacing,
  },
  h2: {
    fontSize: font.h2.size,
    fontWeight: font.h2.weight,
    lineHeight: font.h2.lineHeight,
    letterSpacing: font.h2.letterSpacing,
  },
  h3: {
    fontSize: font.h3.size,
    fontWeight: font.h3.weight,
    lineHeight: font.h3.lineHeight,
    letterSpacing: font.h3.letterSpacing,
  },
  h4: {
    fontSize: font.h4.size,
    fontWeight: font.h4.weight,
    lineHeight: font.h4.lineHeight,
    letterSpacing: font.h4.letterSpacing,
  },
  h5: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h6: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: '-0.005em',
  },
  subtitle1: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.003em',
  },
  subtitle2: {
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.4,
    color: tokens.semantic.textSecondary,
  },
  body1: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.55,
  },
  body2: {
    fontSize: 13,
    fontWeight: 400,
    lineHeight: 1.5,
    color: tokens.semantic.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.4,
  },
  overline: {
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
  },
  button: {
    fontWeight: 500,
    fontSize: 13.5,
    textTransform: 'none' as const,
    letterSpacing: '-0.005em',
  },
};
