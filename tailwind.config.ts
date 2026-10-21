import type { Config } from 'tailwindcss';
import { fontSize, semantic as t, spacing } from './src/tokens';

// Only semantic tokens are exposed. Default palette, spacing and type scale are replaced,
// so `bg-red-500`, `p-7` or `text-2xl` simply don't exist.
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
    },
    backgroundColor: {
      transparent: 'transparent',
      page: t['color-bg'],
      surface: t['color-surface'],
      'surface-muted': t['color-surface-muted'],
      action: t['color-action'],
      'action-hover': t['color-action-hover'],
      'action-soft': t['color-action-soft'],
      inverse: t['color-text'],
      success: t['color-success'],
      'status-fresh': t['color-status-fresh-bg'],
      'status-low': t['color-status-low-bg'],
      'status-out': t['color-status-out-bg'],
    },
    textColor: {
      current: 'currentColor',
      primary: t['color-text'],
      secondary: t['color-text-secondary'],
      action: t['color-action'],
      'on-action': t['color-on-action'],
      inverse: t['color-surface'],
      success: t['color-success'],
      'status-fresh': t['color-status-fresh-fg'],
      'status-low': t['color-status-low-fg'],
      'status-out': t['color-status-out-fg'],
    },
    borderColor: {
      DEFAULT: t['color-border'],
      transparent: 'transparent',
      input: t['color-border-input'],
      action: t['color-action'],
      inverse: t['color-text'],
    },
    outlineColor: {
      focus: t['color-focus'],
    },
    fill: {
      ink: t['color-text'],
      surface: t['color-surface'],
      action: t['color-action'],
    },
    spacing,
    fontSize,
    fontFamily: {
      display: ['Fraunces', 'Georgia', 'serif'],
      sans: ['Figtree', 'system-ui', 'sans-serif'],
    },
    borderRadius: {
      none: '0px',
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      pill: '999px',
      full: '50%',
    },
    extend: {
      minHeight: { target: '44px' },
      minWidth: { target: '44px' },
      maxWidth: { phone: '430px' },
      boxShadow: {
        card: '0 1px 3px rgba(40, 25, 10, 0.08)',
        raised: '0 8px 24px rgba(40, 25, 10, 0.16)',
      },
    },
  },
  plugins: [],
};

export default config;
