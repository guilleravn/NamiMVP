import type { ReactNode } from 'react';
import { cx } from '../lib/cx';
import { Icon, type IconName } from './Icon';

/** Status tones match meaning: fresh = good, low = heads-up, out = unavailable. Never orange. */
export type Tone = 'fresh' | 'low' | 'out' | 'neutral';

const TONES: Record<Tone, string> = {
  fresh: 'bg-status-fresh text-status-fresh',
  low: 'bg-status-low text-status-low',
  out: 'bg-status-out text-status-out',
  neutral: 'bg-surface-muted text-secondary',
};

export function Badge({ tone, icon, children, className }: { tone: Tone; icon?: IconName; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-pill px-2 py-1 text-xs font-bold leading-tight', TONES[tone], className)}>
      {icon && <Icon name={icon} className="h-3 w-3" strokeWidth={2.5} />}
      {children}
    </span>
  );
}
