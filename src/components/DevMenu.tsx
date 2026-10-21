import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { cx } from '../lib/cx';
import { toHHMM } from '../lib/time';
import { useStore } from '../store/StoreProvider';
import type { UserRole } from '../types';
import { Button } from './Button';
import { Icon } from './Icon';
import { Switch } from './ui';

const CLOCK_PRESETS: Array<{ hhmm: string; hint: string }> = [
  { hhmm: '11:00', hint: 'antes del almuerzo: sin platos' },
  { hhmm: '15:00', hint: 'después del almuerzo: todo en vivo' },
  { hhmm: '20:00', hint: 'cierre: retiros terminados' },
];

const ROLES: Array<{ role: UserRole; label: string; to: string }> = [
  { role: 'buyer', label: 'Comprador', to: '/buyer' },
  { role: 'restaurant_owner', label: 'Restaurante', to: '/restaurant' },
];

/**
 * Demo strip at the top of every screen: shows the fake time and role, and opens the dev menu
 * (role switch, fake clock, force "payment pending", reset). Not part of the product.
 */
export function DevBar() {
  const { now, session } = useStore();
  const [open, setOpen] = useState(false);
  const role = ROLES.find((r) => r.role === session?.role);

  return (
    <>
      <aside aria-label="Controles de la demo" className="flex min-h-11 items-center justify-between gap-2 bg-inverse px-4 text-xs text-inverse">
        <p>
          <b>Modo demo</b> · <span className="num">{toHHMM(now)}</span>
          {role && <> · {role.label}</>}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="-mr-2 inline-flex min-h-11 items-center gap-1 rounded-sm px-2 font-bold underline-offset-2 hover:underline"
        >
          <Icon name="settings" className="h-4 w-4" />
          Menú demo
        </button>
      </aside>
      <DevMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function DevMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { now, session, dev, actions } = useStore();
  const navigate = useNavigate();
  const ref = useRef<HTMLDialogElement>(null);
  const [done, setDone] = useState('');

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const flash = (text: string) => setDone(text);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="dev-menu-title"
      className="m-auto w-[calc(100%-32px)] max-w-md rounded-lg bg-page p-0 text-primary shadow-raised backdrop:bg-scrim"
    >
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h2 id="dev-menu-title" className="text-md font-extrabold">
          Menú demo
        </h2>
        <button type="button" onClick={onClose} aria-label="Cerrar menú demo" className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface-muted">
          <Icon name="x" />
        </button>
      </div>

      <div className="max-h-[75vh] overflow-y-auto px-4 pb-4">
        <Section title="Ver como">
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <PresetButton
                key={r.role}
                pressed={session?.role === r.role}
                onClick={() => {
                  actions.chooseRole(r.role);
                  navigate(r.to);
                  onClose();
                }}
              >
                {r.label}
              </PresetButton>
            ))}
          </div>
        </Section>

        <Section title="Reloj falso">
          <p className="mb-2 text-secondary">
            Hora de la demo: <b className="num text-primary">{toHHMM(now)}</b>
            {dev.clockOffsetMs === 0 && ' (hora real)'}
          </p>
          <div className="grid gap-2">
            {CLOCK_PRESETS.map((p) => (
              <PresetButton
                key={p.hhmm}
                pressed={toHHMM(now) === p.hhmm}
                onClick={() => {
                  actions.setClock(p.hhmm);
                  flash(`Reloj en ${p.hhmm}.`);
                }}
              >
                <span className="num">{p.hhmm}</span>
                <span className="font-normal"> · {p.hint}</span>
              </PresetButton>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <PresetButton
                pressed={false}
                onClick={() => {
                  actions.advanceClock(10);
                  flash('Reloj adelantado 10 minutos.');
                }}
              >
                +10 min
              </PresetButton>
              <PresetButton
                pressed={dev.clockOffsetMs === 0}
                onClick={() => {
                  actions.setClock(null);
                  flash('Reloj en hora real.');
                }}
              >
                Hora real
              </PresetButton>
            </div>
          </div>
          <p className="mt-2 text-xs text-secondary">“+10 min” vence una reserva sin pagar: la porción vuelve a la publicación.</p>
        </Section>

        <Section title="Pagos">
          <Switch
            checked={dev.forcePaymentPending}
            onChange={(next) => {
              actions.setForcePaymentPending(next);
              flash(next ? 'El banco no va a confirmar pagos.' : 'El banco confirma pagos normalmente.');
            }}
            label="Forzar “pago pendiente”"
            hint="Al tocar “Ya pagué”, el banco no confirma."
          />
        </Section>

        <Section title="Datos">
          <Button
            block
            variant="secondary"
            onClick={() => {
              actions.resetDemo();
              navigate(session?.role === 'restaurant_owner' ? '/restaurant' : session ? '/buyer' : '/');
              flash('Datos de demo reiniciados.');
            }}
          >
            Reiniciar datos de demo
          </Button>
          <p className="mt-2 text-xs text-secondary">Vuelve a los platos y pedidos de ejemplo, con el reloj en 15:00.</p>
        </Section>

        <p className="sr-only" aria-live="polite">
          {done}
        </p>
        {done && (
          <p className="mt-4 flex items-center gap-1 font-bold text-status-fresh" aria-hidden="true">
            <Icon name="check" className="h-4 w-4" strokeWidth={2.5} />
            {done}
          </p>
        )}
      </div>
    </dialog>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-secondary">{title}</h3>
      {children}
    </section>
  );
}

function PresetButton({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cx(
        'min-h-target rounded-md border px-3 text-left font-bold',
        pressed ? 'border-inverse bg-inverse text-inverse' : 'border-input bg-surface hover:bg-surface-muted',
      )}
    >
      {children}
    </button>
  );
}
