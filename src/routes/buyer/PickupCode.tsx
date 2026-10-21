import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button, ButtonLink } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Facts, Notice, PageTitle, StickyFoot, Subtitle } from '../../components/ui';
import { distanceMeters, formatDistance } from '../../lib/format';
import { useDocumentTitle } from '../../lib/hooks';
import { findListing, findOrder, findRestaurant, hasRating, pickupWindow } from '../../store/selectors';
import { useStore } from '../../store/StoreProvider';
import type { Listing, Order, Restaurant } from '../../types';
import { MissingPage } from '../MissingPage';
import { useBuyerZone } from './useBuyerZone';

export function PickupCode() {
  const { id } = useParams();
  const { db } = useStore();
  const order = findOrder(db, id);
  const listing = findListing(db, order?.listingId);
  const restaurant = findRestaurant(db, listing?.restaurantId);
  useDocumentTitle('Código de retiro');
  if (!order || !listing || !restaurant) return <MissingPage backTo="/buyer/orders" title="No encontramos este pedido" />;

  switch (order.status) {
    case 'reserved':
    case 'payment_pending':
    case 'expired':
    case 'cancelled':
      return <Navigate to={`/buyer/order/${order.id}/pay`} replace />;
    case 'paid':
      return <CodeScreen order={order} listing={listing} restaurant={restaurant} />;
    case 'picked_up':
      return <PickedUp order={order} listing={listing} />;
    case 'no_show':
      return <NoShow listing={listing} />;
    default: {
      const _exhaustive: never = order;
      return _exhaustive;
    }
  }
}

function SuccessIcon() {
  return (
    <div className="mx-auto mb-3 mt-2 grid h-14 w-14 place-items-center rounded-full bg-status-fresh text-success">
      <Icon name="check" className="h-7 w-7" strokeWidth={2.5} />
    </div>
  );
}

function CodeScreen({ order, listing, restaurant }: { order: Order; listing: Listing; restaurant: Restaurant }) {
  const { actions } = useStore();
  const zone = useBuyerZone();
  const navigate = useNavigate();

  const onPickedUp = () => {
    if (actions.confirmPickup(order.id).ok) navigate(`/buyer/order/${order.id}/rate`);
  };

  return (
    <div className="pt-4 text-center">
      <SuccessIcon />
      <PageTitle>Pago confirmado</PageTitle>
      <Subtitle>Muestra este código cuando retires</Subtitle>
      <div className="my-4 rounded-lg border-2 border-dashed border-inverse bg-surface p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-secondary">Código de retiro</p>
        <p className="num text-xl font-extrabold tracking-widest">{order.pickupCode}</p>
        <p className="text-secondary">
          {listing.title} × {order.quantity}
        </p>
      </div>
      <Facts
        className="text-left"
        items={[
          { icon: 'clock', label: 'Retira hoy', value: pickupWindow(listing) },
          {
            icon: 'pin',
            label: restaurant.name,
            value: `${restaurant.address} · ${formatDistance(distanceMeters(zone, restaurant))} de ${zone.name}`,
          },
        ]}
      />
      <Subtitle>Te avisamos 15 minutos antes de que empiece el retiro.</Subtitle>
      <StickyFoot>
        <Button block variant="secondary" onClick={onPickedUp}>
          Ya lo retiré
        </Button>
      </StickyFoot>
    </div>
  );
}

function PickedUp({ order, listing }: { order: Order; listing: Listing }) {
  const { db } = useStore();
  const rated = hasRating({ db, orderId: order.id });
  return (
    <div className="pt-6 text-center">
      <SuccessIcon />
      <PageTitle>Ya retiraste tu {listing.title.toLowerCase()}</PageTitle>
      <Subtitle>{rated ? '¡Gracias por calificar la frescura!' : '¿Qué tan fresco estaba? Tu respuesta ayuda al próximo comprador.'}</Subtitle>
      <div className="flex flex-col gap-2">
        {!rated && (
          <ButtonLink block to={`/buyer/order/${order.id}/rate`}>
            Calificar frescura
          </ButtonLink>
        )}
        <ButtonLink block variant={rated ? 'primary' : 'ghost'} to="/buyer">
          Ver platos de hoy
        </ButtonLink>
      </div>
    </div>
  );
}

function NoShow({ listing }: { listing: Listing }) {
  return (
    <div className="pt-6">
      <PageTitle>Este pedido no se retiró</PageTitle>
      <Notice tone="out" icon="alert" className="mb-4">
        Terminó el horario de retiro ({pickupWindow(listing)}) y el restaurante no registró la entrega.
      </Notice>
      <ButtonLink block to="/buyer/orders">
        Ver mis pedidos
      </ButtonLink>
    </div>
  );
}
