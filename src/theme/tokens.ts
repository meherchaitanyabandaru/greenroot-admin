// ─── GreenRoot Design Tokens ─────────────────────────────────────────────────
// Single source of truth for all visual values.
// Structured for future dark-mode support — add a `dark` variant to each token.

export const tokens = {
  // ── Color primitives ────────────────────────────────────────────────────────
  color: {
    // Brand: Forest Green (primary identity)
    forest: {
      950: '#052e16',
      900: '#14532d',   // sidebar bg base
      800: '#166534',   // primary main (spec)
      700: '#15803d',
      600: '#16a34a',   // success
      500: '#22c55e',
      400: '#4ade80',
      200: '#bbf7d0',
      100: '#dcfce7',
      50:  '#f0fdf4',
    },
    // Accent: Lime (highlights, active states)
    lime: {
      500: '#84cc16',   // accent main (spec)
      400: '#a3e635',
      200: '#d9f99d',
      100: '#ecfccb',
      50:  '#f7fee7',
    },
    // Neutrals: Slate-based (Stripe/Linear palette)
    slate: {
      950: '#020617',
      900: '#0f172a',   // text primary (spec)
      800: '#1e293b',
      700: '#334155',
      600: '#475569',
      500: '#64748b',   // text secondary (spec)
      400: '#94a3b8',
      300: '#cbd5e1',
      200: '#e2e8f0',   // border (spec)
      100: '#f1f5f9',
      50:  '#f8fafc',   // background (spec)
    },
    // Status palette
    blue:   { 700: '#1d4ed8', 600: '#2563eb', 500: '#3b82f6', 100: '#dbeafe', 50: '#eff6ff' },
    amber:  { 700: '#b45309', 600: '#d97706', 500: '#f59e0b', 100: '#fef3c7', 50: '#fffbeb' },
    red:    { 700: '#b91c1c', 600: '#dc2626', 500: '#ef4444', 100: '#fee2e2', 50: '#fef2f2' },
    teal:   { 700: '#0f766e', 600: '#0d9488', 500: '#14b8a6', 100: '#ccfbf1', 50: '#f0fdfa' },
    purple: { 700: '#6d28d9', 600: '#7c3aed', 500: '#8b5cf6', 100: '#ede9fe', 50: '#f5f3ff' },
    orange: { 700: '#c2410c', 600: '#ea580c', 500: '#f97316', 100: '#ffedd5', 50: '#fff7ed' },
  },

  // ── Semantic aliases (light mode) ──────────────────────────────────────────
  // These are the values consumed by components and the theme.
  // To add dark mode: export a `dark` variant with different mappings.
  semantic: {
    // Backgrounds
    bg:           '#f8fafc',   // page background
    surface:      '#ffffff',   // card / paper
    surfaceHover: '#f8fafc',   // table row hover
    surfaceRaised:'#ffffff',   // elevated card

    // Text
    textPrimary:   '#0f172a',
    textSecondary: '#64748b',
    textMuted:     '#94a3b8',
    textInverse:   '#ffffff',

    // Borders
    border:        '#e2e8f0',
    borderStrong:  '#cbd5e1',
    borderFocus:   '#166534',

    // Brand
    primaryMain:   '#166534',
    primaryHover:  '#14532d',
    primaryActive: '#0f3d23',
    primaryLight:  '#dcfce7',
    primaryMid:    '#16a34a',

    accentMain:    '#84cc16',
    accentHover:   '#65a30d',
    accentLight:   '#ecfccb',

    // Status
    successText:   '#15803d',
    successBg:     '#dcfce7',
    warningText:   '#b45309',
    warningBg:     '#fef3c7',
    errorText:     '#dc2626',
    errorBg:       '#fee2e2',
    infoText:      '#2563eb',
    infoBg:        '#dbeafe',
  },

  // ── Sidebar-specific tokens ─────────────────────────────────────────────────
  sidebar: {
    bg:             '#0c1e10',   // very deep forest
    bgHover:        'rgba(255,255,255,0.06)',
    bgActive:       'rgba(132,204,22,0.13)',
    colorText:      'rgba(255,255,255,0.55)',
    colorTextHover: 'rgba(255,255,255,0.88)',
    colorActive:    '#84cc16',
    groupLabel:     'rgba(255,255,255,0.28)',
    divider:        'rgba(255,255,255,0.07)',
    copyright:      'rgba(255,255,255,0.22)',
    logoBg:         '#84cc16',
    logoText:       '#052e16',
  },

  // ── Shadows ────────────────────────────────────────────────────────────────
  shadow: {
    xs:        '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm:        '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
    md:        '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
    lg:        '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
    xl:        '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)',
    card:      '0 1px 2px rgb(0 0 0 / 0.04), 0 0 0 1px rgb(0 0 0 / 0.04)',
    cardHover: '0 4px 16px rgb(0 0 0 / 0.1), 0 0 0 1px rgb(0 0 0 / 0.04)',
    focus:     '0 0 0 3px rgba(22,101,52,0.2)',
    focusError:'0 0 0 3px rgba(220,38,38,0.15)',
    tooltip:   '0 4px 12px rgb(0 0 0 / 0.15)',
    popover:   '0 8px 24px rgb(0 0 0 / 0.12), 0 0 0 1px rgb(0 0 0 / 0.06)',
    modal:     '0 24px 48px rgb(0 0 0 / 0.18)',
  },

  // ── Border radius ──────────────────────────────────────────────────────────
  radius: {
    xs:   4,
    sm:   6,
    md:   8,
    lg:   10,
    xl:   12,
    '2xl':16,
    pill: 9999,
  },

  // ── Transitions ────────────────────────────────────────────────────────────
  transition: {
    fast:   '120ms ease',
    base:   '180ms ease',
    slow:   '250ms ease',
    drawer: '220ms cubic-bezier(0.4,0,0.6,1)',
  },

  // ── Typography scale ───────────────────────────────────────────────────────
  font: {
    family: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    // Display
    display:   { size: 28, weight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' },
    // Headings
    h1:        { size: 24, weight: 700, lineHeight: 1.2,  letterSpacing: '-0.015em' },
    h2:        { size: 20, weight: 700, lineHeight: 1.25, letterSpacing: '-0.01em' },
    h3:        { size: 17, weight: 600, lineHeight: 1.3,  letterSpacing: '-0.005em' },
    h4:        { size: 15, weight: 600, lineHeight: 1.35, letterSpacing: '-0.003em' },
    // Body
    bodyLg:    { size: 15, weight: 400, lineHeight: 1.6,  letterSpacing: 0 },
    body:      { size: 14, weight: 400, lineHeight: 1.55, letterSpacing: 0 },
    bodySm:    { size: 13, weight: 400, lineHeight: 1.5,  letterSpacing: 0 },
    // UI
    label:     { size: 13, weight: 500, lineHeight: 1.2,  letterSpacing: 0 },
    caption:   { size: 12, weight: 400, lineHeight: 1.4,  letterSpacing: 0 },
    overline:  { size: 11, weight: 600, lineHeight: 1,    letterSpacing: '0.07em' },
    // Code
    mono:      { family: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace' },
  },

  // ── Chart palette (not all green) ─────────────────────────────────────────
  chart: {
    green:  '#166534',
    blue:   '#3b82f6',
    amber:  '#f59e0b',
    teal:   '#14b8a6',
    purple: '#8b5cf6',
    orange: '#f97316',
  },
} as const;
