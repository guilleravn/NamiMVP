// Small layout pieces shared by both sides of the app.

import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '../lib/cx';
import { Icon, type IconName } from './Icon';

export function Logo({ className }: { className?: string }) {
  return <span className={cx('font-display text-xl font-bold leading-none tracking-tight text-action', className)}>ñami</span>;
}

export function AppBar({ children }: { children?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3 pb-3 pt-2">
      <Link to="/" className="-mx-1 rounded-sm px-1 py-2" aria-label="Ñami, volver al inicio">
        <Logo />
      </Link>
      {children && <div className="text-right text-xs leading-snug text-secondary">{children}</div>}
    </header>
  );
}

export function BackButton({ to, label = 'Volver' }: { to: string; label?: string }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="mb-3 mt-1 inline-flex h-11 w-11 items-center justify-center rounded-full border bg-surface text-primary hover:bg-surface-muted"
    >
      <Icon name="back" strokeWidth={2.2} />
    </Link>
  );
}

/** Bottom bar for the one main action of a screen. Stays visible while scrolling. */
export function StickyFoot({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-0 -mx-4 mt-4 flex flex-col gap-2 border-t bg-page px-4 pb-4 pt-3">{children}</div>;
}

export interface Fact {
  icon: IconName;
  label: string;
  value: ReactNode;
  /** Green: used for "prepared at", the freshness signal. */
  fresh?: boolean;
}

export function Facts({ items, className }: { items: Fact[]; className?: string }) {
  return (
    <dl className={cx('mb-4 rounded-lg border bg-surface', className)}>
      {items.map((fact) => (
        <div key={fact.label} className="flex items-center gap-3 border-b p-3 last:border-b-0">
          <span className={fact.fresh ? 'text-status-fresh' : 'text-secondary'}>
            <Icon name={fact.icon} />
          </span>
          <div>
            <dt className="text-xs text-secondary">{fact.label}</dt>
            <dd className={cx('num font-bold', fact.fresh && 'text-status-fresh')}>{fact.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

/** Inline message. `low` = heads-up (amber), `fresh` = reassuring (green). Never the action color. */
export function Notice({
  tone,
  icon,
  children,
  live,
  className,
}: {
  tone: 'low' | 'fresh' | 'out';
  icon: IconName;
  children: ReactNode;
  /** Announce changes to screen readers. */
  live?: boolean;
  className?: string;
}) {
  const tones = { low: 'bg-status-low text-status-low', fresh: 'bg-status-fresh text-status-fresh', out: 'bg-status-out text-status-out' };
  return (
    <div className={cx('flex gap-2 rounded-md p-3 leading-snug', tones[tone], className)} aria-live={live ? 'polite' : undefined}>
      <span className="mt-0.5">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div>{children}</div>
    </div>
  );
}

/** Toggle button with aria-pressed (filters, rating tags). */
export function Chip({ pressed, className, ...props }: { pressed: boolean } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'>) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cx(
        'inline-flex min-h-target items-center gap-1 whitespace-nowrap rounded-pill border px-4 font-bold',
        pressed ? 'border-inverse bg-inverse text-inverse' : 'border-input bg-surface text-primary hover:bg-surface-muted',
        className,
      )}
      {...props}
    />
  );
}

/** On/off switch. The label is part of the button, and the state is spelled out, not just colored. */
export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (next: boolean) => void; label: string; hint: string }) {
  const hintId = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={hintId}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-md border bg-surface px-4 py-3 text-left"
    >
      <span>
        <b className="block">{label}</b>
        <span id={hintId} className="text-secondary">
          {hint}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={cx(
          'relative inline-flex h-8 w-13 shrink-0 items-center rounded-pill border px-1 transition-colors',
          checked ? 'justify-end border-transparent bg-success text-success' : 'justify-start border-input bg-surface-muted text-secondary',
        )}
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-surface shadow-card">
          <Icon name={checked ? 'check' : 'x'} className="h-3 w-3" strokeWidth={3} />
        </span>
      </span>
    </button>
  );
}

export function PageTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1 tabIndex={-1} className={cx('mb-1 text-lg font-extrabold leading-tight', className)}>
      {children}
    </h1>
  );
}

export function Subtitle({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('mb-4 leading-snug text-secondary', className)}>{children}</p>;
}
