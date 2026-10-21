import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../lib/cx';
import { Icon } from './Icon';

export const inputClass =
  'min-h-target w-full rounded-md border border-input bg-surface px-3 font-semibold text-primary placeholder:font-normal placeholder:text-secondary aria-[invalid=true]:border-2 aria-[invalid=true]:border-inverse';

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'children'> {
  label: string;
  error?: string;
  /** Short help or live hint shown under the input. */
  hint?: ReactNode;
  /** Text shown inside the input on the left, e.g. "Bs". */
  prefix?: string;
  id?: string;
}

/** Labeled input. The label sits right above its field; errors are tied with aria-describedby. */
export function Field({ label, error, hint, prefix, id, className, ...input }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx('mb-3', className)}>
      <label htmlFor={inputId} className="mb-1 block text-xs font-bold text-secondary">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-semibold text-secondary">
            {prefix}
          </span>
        )}
        <input id={inputId} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={cx(inputClass, prefix && 'pl-10')} {...input} />
      </div>
      {hint && (
        <div id={hintId} className="mt-1 text-xs">
          {hint}
        </div>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1 flex items-start gap-1 text-xs font-bold text-status-low">
      <Icon name="alert" className="mt-px h-4 w-4" />
      {children}
    </p>
  );
}
