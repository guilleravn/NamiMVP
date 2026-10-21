import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cx } from '../lib/cx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface StyleProps {
  variant?: ButtonVariant;
  /** Full width, 52 px tall: the one main action at the bottom of a screen. */
  block?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-action text-on-action hover:bg-action-hover disabled:bg-status-out disabled:text-status-out',
  secondary: 'border-2 border-action bg-surface text-action hover:bg-action-soft disabled:border-transparent disabled:bg-status-out disabled:text-status-out',
  ghost: 'bg-transparent text-secondary hover:bg-surface-muted',
};

export function buttonClass({ variant = 'primary', block = false }: StyleProps, className?: string): string {
  return cx(
    'inline-flex min-h-target items-center justify-center gap-2 rounded-md px-4 text-center font-extrabold transition-colors disabled:cursor-not-allowed',
    block ? 'min-h-13 w-full text-md' : 'text-sm',
    VARIANTS[variant],
    className,
  );
}

export function Button({ variant, block, className, type = 'button', ...props }: StyleProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={buttonClass({ variant, block }, className)} {...props} />;
}

export function ButtonLink({ variant, block, className, ...props }: StyleProps & LinkProps) {
  return <Link className={buttonClass({ variant, block }, className)} {...props} />;
}
