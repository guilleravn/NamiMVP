// Design tokens. Components never use these directly: tailwind.config.ts maps the
// semantic tokens into utilities (bg-action, text-secondary, bg-status-fresh…), and the
// default Tailwind palette is removed so raw colors can't sneak into components.

/** 1. Primitives: raw values, named by appearance. Only semantic tokens may point here. */
const primitive = {
  orange800: '#9a3a09',
  orange700: '#b8460b',
  orange50: '#fff3ea',
  green800: '#237032',
  green50: '#e9f7ec',
  amber900: '#6b4a00',
  amber100: '#fff1c2',
  stone900: '#1f1a15',
  stone700: '#4a4038',
  stone600: '#6b5e51',
  stone500: '#8c7f72',
  stone200: '#e8dfd4',
  stone150: '#efe9e2',
  stone100: '#f3ede6',
  cream50: '#fbf8f4',
  white: '#ffffff',
};

/**
 * 2. Semantic tokens: named by role, never by appearance.
 * Contrast (WCAG): action/on-action 5.36:1 · text-secondary on bg 5.93:1 ·
 * status pairs 5.4–8.4:1 · border-input on surface 3.6:1.
 * Orange is reserved for actions; status colors carry meaning and always ship with text or an icon.
 */
export const semantic = {
  'color-bg': primitive.cream50,
  'color-surface': primitive.white,
  'color-surface-muted': primitive.stone100,
  'color-text': primitive.stone900,
  'color-text-secondary': primitive.stone600,
  'color-border': primitive.stone200,
  'color-border-input': primitive.stone500,
  'color-action': primitive.orange700,
  'color-action-hover': primitive.orange800,
  'color-action-soft': primitive.orange50,
  'color-on-action': primitive.white,
  'color-focus': primitive.orange700,
  'color-success': primitive.green800,
  'color-status-fresh-fg': primitive.green800,
  'color-status-fresh-bg': primitive.green50,
  'color-status-low-fg': primitive.amber900,
  'color-status-low-bg': primitive.amber100,
  'color-status-out-fg': primitive.stone700,
  'color-status-out-bg': primitive.stone150,
  /** Dims the page behind a modal (text color at 55%). */
  'color-scrim': 'rgba(31, 26, 21, 0.55)',
};

/** Spacing on a 4 px scale (key × 4 px). 11 = 44 px, the minimum touch target. */
export const spacing = {
  px: '1px',
  0: '0px',
  0.5: '2px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  11: '44px',
  12: '48px',
  13: '52px',
  14: '56px',
  16: '64px',
  18: '72px',
  20: '80px',
  24: '96px',
  32: '128px',
  44: '176px',
};

/** Five type sizes only: 12 / 14 / 16 / 20 / 28. */
export const fontSize = {
  xs: ['12px', { lineHeight: '1.35' }],
  sm: ['14px', { lineHeight: '1.45' }],
  md: ['16px', { lineHeight: '1.45' }],
  lg: ['20px', { lineHeight: '1.25' }],
  xl: ['28px', { lineHeight: '1.15' }],
} satisfies Record<string, [string, { lineHeight: string }]>;
