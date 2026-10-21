import { Badge } from '../../components/Badge';
import { ButtonLink } from '../../components/Button';
import { Photo } from '../../components/Photo';
import { orderStatusMeta } from '../../components/status';
import { AppBar, PageTitle } from '../../components/ui';
import { formatBs } from '../../lib/format';
import { useDocumentTitle } from '../../lib/hooks';
import { relativeDay } from '../../lib/time';
import { buyerOrders, findListing, findRestaurant, hasRating, isActiveOrder, pickupWindow } from '../../store/selectors';
import { useStore } from '../../store/StoreProvider';
import type { Order } from '../../types';

export function MyOrders() {
  const { db, currentUser } = useStore();
  useDocumentTitle('Mis pedidos');
  const orders = currentUser ? buyerOrders({ db, buyerId: currentUser.id }) : [];
  const active = orders.filter((o) => isActiveOrder(o.status));
  const past = orders.filter((o) => !isActiveOrder(o.status));

  return (
    <>
      <AppBar />
      <PageTitle className="mb-4">Mis pedidos</PageTitle>

      <section aria-labelledby="active-orders" className="mb-6">
        <h2 id="active-orders" className="mb-2 font-extrabold">
          En curso <span className="num font-semibold text-secondary">({active.length})</span>
        </h2>
        {active.length === 0 ? (
          <div className="rounded-lg border bg-surface p-4">
            <p className="mb-3 text-secondary">No tienes pedidos en curso.</p>
            <ButtonLink to="/buyer">Ver platos de hoy</ButtonLink>
          </div>
        ) : (
          <ul>
            {active.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="past-orders">
        <h2 id="past-orders" className="mb-2 font-extrabold">
          Anteriores <span className="num font-semibold text-secondary">({past.length})</span>
        </h2>
        <ul>
          {past.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </ul>
      </section>
    </>
  );
}

/** The one thing to do next with an order, if any. */
function nextStep(order: Order, rated: boolean): { to: string; label: string } | null {
  switch (order.status) {
    case 'reserved':
    case 'payment_pending':
      return { to: `/buyer/order/${order.id}/pay`, label: 'Pagar' };
    case 'paid':
      return { to: `/buyer/order/${order.id}`, label: 'Ver código' };
    case 'picked_up':
      return rated ? null : { to: `/buyer/order/${order.id}/rate`, label: 'Calificar' };
    case 'expired':
    case 'no_show':
    case 'cancelled':
      return null;
    default: {
      const _exhaustive: never = order;
      return _exhaustive;
    }
  }
}

function OrderRow({ order }: { order: Order }) {
  const { db, now } = useStore();
  const listing = findListing(db, order.listingId);
  const restaurant = findRestaurant(db, listing?.restaurantId);
  if (!listing || !restaurant) return null;
  const status = orderStatusMeta(order.status);
  const step = nextStep(order, hasRating({ db, orderId: order.id }));

  return (
    <li className="mb-2 flex gap-3 rounded-lg border bg-surface p-3">
      <Photo photo={listing.photo} alt="" className="h-14 w-14 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-extrabold leading-tight">
            {listing.title} × {order.quantity}
          </h3>
          <span className="num font-bold">{formatBs(order.total)}</span>
        </div>
        <p className="text-xs text-secondary">
          {restaurant.name} · <span className="num">{relativeDay({ iso: listing.pickupStart, now })} {pickupWindow(listing)}</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <Badge tone={status.tone} icon={status.icon}>
            {status.label}
          </Badge>
          {step && (
            <ButtonLink to={step.to} variant={isActiveOrder(order.status) ? 'primary' : 'secondary'} aria-label={`${step.label}: ${listing.title}`}>
              {step.label}
            </ButtonLink>
          )}
        </div>
      </div>
    </li>
  );
}
