import { formatCountdown } from '../lib/time';
import { useStore } from '../store/StoreProvider';
import { Notice } from './ui';

/** Milliseconds left until `until`, following the (fake) clock. */
export function useRemaining(until: string): number {
  const { now } = useStore();
  return Math.max(0, Date.parse(until) - now.getTime());
}

/**
 * Amber notice with a live mm:ss countdown. The ticking digits are hidden from screen readers;
 * a polite live region announces once per minute instead of every second.
 */
export function HoldNotice({ until, stillHeld = false }: { until: string; stillHeld?: boolean }) {
  const remaining = useRemaining(until);
  const minutes = Math.ceil(remaining / 60_000);
  const spoken =
    minutes <= 1 ? 'Queda menos de un minuto para pagar.' : `Tu porción está apartada ${minutes} minutos más.`;

  return (
    <Notice tone="low" icon="clock" className="mb-3 font-bold">
      <span aria-hidden="true">
        {stillHeld ? 'Tu porción sigue apartada' : 'Tu porción está apartada'} por{' '}
        <span className="num">{formatCountdown(remaining)}</span> min
        {stillHeld && <span className="font-normal">. No pierdes tu reserva mientras revisamos.</span>}
      </span>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {spoken}
      </span>
    </Notice>
  );
}
