import { useId } from 'react';
import { Icon } from './Icon';

export function Stepper({ value, min = 1, max, onChange, label }: { value: number; min?: number; max: number; onChange: (n: number) => void; label: string }) {
  const labelId = useId();
  const control = 'grid h-11 w-11 place-items-center rounded-sm border border-input bg-surface text-primary hover:bg-surface-muted disabled:border-transparent disabled:bg-status-out disabled:text-status-out disabled:cursor-not-allowed';
  return (
    <div role="group" aria-labelledby={labelId} className="flex items-center justify-between rounded-md border bg-surface py-1 pl-4 pr-1 font-bold">
      <span id={labelId}>{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" className={control} aria-label="Quitar uno" disabled={value <= min} onClick={() => onChange(value - 1)}>
          <Icon name="minus" />
        </button>
        <output className="num min-w-6 text-center text-md" aria-live="polite">
          {value}
        </output>
        <button type="button" className={control} aria-label="Agregar uno" disabled={value >= max} onClick={() => onChange(value + 1)}>
          <Icon name="plus" />
        </button>
      </div>
    </div>
  );
}
