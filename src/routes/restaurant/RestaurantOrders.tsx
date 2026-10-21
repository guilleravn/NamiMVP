import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { PageTitle } from '../../components/ui';
import { formatBs } from '../../lib/format';
import { useDocumentTitle } from '../../lib/hooks';
import { orderFee } from '../../store/logic';
import { daySummary, findListing, pickupWindow, restaurantOrdersToday } from '../../store/selectors';
import { useStore } from '../../store/StoreProvider';
import type { Order } from '../../types';
import { useOwnRestaurant } from './useOwnRestaurant';

export function RestaurantOrders() {
  const { db, now } = useStore();
  const restaurant = useOwnRestaurant();
  const [announcement, setAnnouncement] = useState('');
  useDocumentTitle('Pedidos de hoy');

  const orders = restaurantOrdersToday({ db, restaurantId: restaurant.id, now });
  const toHandOver = orders.filter((o) => o.status === 'paid');
  const handedOver = orders.filter((o) => o.status === 'picked_up');
  const noShows = orders.filter((o) => o.status === 'no_show');
  const summary = daySummary({ db, restaurantId: restaurant.id, now });
  const freeMonth = orderFee({ restaurant, quantity: 1, now }) === 0;

  return (
    <>
      <PageTitle className="mb-4">Pedidos de hoy</PageTitle>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <section aria-label="Resumen de hoy" className="mb-6 rounded-lg border bg-surface p-4">
        <p className="font-semibold text-secondary">Hoy recuperaste</p>
        <p className="num my-1 text-xl font-extrabold text-success">{formatBs(summary.recovered)}</p>
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary">
          <div className="flex gap-1">
            <dt>Platos rescatados</dt>
            <dd className="num font-bold text-primary">{summary.dishesRescued}</dd>
          </div>
          <div className="flex gap-1">
            <dt>Ventas</dt>
            <dd className="num font-bold text-primary">{formatBs(summary.sales)}</dd>
          </div>
          <div className="flex gap-1">
            <dt>Comisión Ñami</dt>
            <dd className="num font-bold text-primary">{freeMonth ? 'Bs 0 · mes gratis' : formatBs(summary.fees)}</dd>
          </div>
        </dl>
      </section>

      <OrderGroup title="Por entregar" count={toHandOver.length} empty="No hay pedidos pagados esperando.">
        {toHandOver.map((order) => (
          <HandOverRow key={order.id} order={order} onDone={setAnnouncement} />
        ))}
      </OrderGroup>

      <OrderGroup title="Entregados" count={handedOver.length} empty="Todavía no entregaste pedidos hoy.">
        {handedOver.map((order) => (
          <OrderLine key={order.id} order={order}>
            <Badge tone="fresh" icon="check">
              Listo
            </Badge>
          </OrderLine>
        ))}
      </OrderGroup>

      {noShows.length > 0 && (
        <OrderGroup title="No retirados" count={noShows.length} empty="">
          {noShows.map((order) => (
            <OrderLine key={order.id} order={order}>
              <Badge tone="out" icon="alert">
                No vino
              </Badge>
            </OrderLine>
          ))}
        </OrderGroup>
      )}
    </>
  );
}

function OrderGroup({ title, count, empty, children }: { title: string; count: number; empty: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="mb-6">
      <h2 id={headingId} className="mb-2 flex items-baseline justify-between font-extrabold">
        {title} <span className="num text-xs font-semibold text-secondary">{count}</span>
      </h2>
      {count === 0 ? <p className="rounded-md border bg-surface p-3 text-secondary">{empty}</p> : <ul className="grid gap-2 sm:grid-cols-2">{children}</ul>}
    </section>
  );
}

function OrderLine({ order, children }: { order: Order; children: ReactNode }) {
  const { db } = useStore();
  const listing = findListing(db, order.listingId);
  return (
    <li className="flex items-center justify-between gap-2 rounded-md border bg-surface py-2 pl-3 pr-2">
      <div>
        <b className="num tracking-wide">{order.pickupCode}</b>
        <small className="block text-xs text-secondary">
          {listing?.title ?? 'Publicación'} × {order.quantity}
          {listing && <span className="num"> · {pickupWindow(listing)}</span>}
        </small>
      </div>
      {children}
    </li>
  );
}

/** "Hand over" asks for the code the buyer shows; only a matching code completes the order. */
function HandOverRow({ order, onDone }: { order: Order; onDone: (text: string) => void }) {
  const { actions } = useStore();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const inputId = useId();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = actions.handOver({ orderId: order.id, code });
    if (result.ok) {
      onDone(`Pedido ${order.pickupCode} entregado.`);
      return;
    }
    switch (result.error) {
      case 'wrong_code':
        setError('El código no coincide con este pedido. Pide al comprador que te lo muestre de nuevo.');
        break;
      case 'not_paid':
      case 'order_not_found':
        setError('Este pedido ya no se puede entregar.');
        break;
      default: {
        const _exhaustive: never = result.error;
        return _exhaustive;
      }
    }
    document.getElementById(inputId)?.focus();
  };

  if (!open) {
    return (
      <OrderLine order={order}>
        <Button
          onClick={() => {
            setOpen(true);
            // Wait for the input to render before focusing it.
            requestAnimationFrame(() => document.getElementById(inputId)?.focus());
          }}
          aria-label={`Entregar pedido ${order.pickupCode}`}
        >
          Entregar
        </Button>
      </OrderLine>
    );
  }

  return (
    <li className="rounded-md border-2 border-inverse bg-surface p-3">
      <form onSubmit={submit} noValidate>
        <Field
          id={inputId}
          label={`Código que muestra el comprador (pedido de ${formatBs(order.total)})`}
          placeholder="ÑAM-0000 o solo los 4 números"
          autoComplete="off"
          autoCapitalize="characters"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(undefined);
          }}
          error={error}
          className="num"
        />
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setOpen(false);
              setCode('');
              setError(undefined);
            }}
          >
            Cancelar
          </Button>
          <Button type="submit">Confirmar entrega</Button>
        </div>
      </form>
    </li>
  );
}
