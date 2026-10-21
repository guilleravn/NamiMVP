import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button, ButtonLink } from '../../components/Button';
import { HoldNotice } from '../../components/HoldNotice';
import { QrCode } from '../../components/QrCode';
import { BackButton, Facts, Notice, PageTitle, StickyFoot, Subtitle } from '../../components/ui';
import { formatBs } from '../../lib/format';
import { useDocumentTitle, useFocusHeadingOnChange, useTimeout } from '../../lib/hooks';
import { findListing, findOrder, findRestaurant } from '../../store/selectors';
import { useStore } from '../../store/StoreProvider';
import type { Listing, Restaurant, UnpaidOrder } from '../../types';
import { MissingPage } from '../MissingPage';

/** How long the fake bank takes to answer. */
const FAKE_BANK_DELAY_MS = 1500;

export function Pay() {
  const { id } = useParams();
  const { db } = useStore();
  const order = findOrder(db, id);
  const listing = findListing(db, order?.listingId);
  const restaurant = findRestaurant(db, listing?.restaurantId);
  useDocumentTitle('Paga con QR');
  if (!order || !listing || !restaurant) return <MissingPage backTo="/buyer/orders" title="No encontramos este pedido" />;

  switch (order.status) {
    case 'reserved':
    case 'payment_pending':
      return <PayScreen order={order} listing={listing} restaurant={restaurant} />;
    case 'paid':
    case 'picked_up':
    case 'no_show':
      return <Navigate to={`/buyer/order/${order.id}`} replace />;
    case 'expired':
    case 'cancelled':
      return <HoldExpired listing={listing} />;
    default: {
      const _exhaustive: never = order;
      return _exhaustive;
    }
  }
}

function PayScreen({ order, listing, restaurant }: { order: UnpaidOrder; listing: Listing; restaurant: Restaurant }) {
  const { actions, readDev } = useStore();
  const navigate = useNavigate();
  const later = useTimeout();
  const [view, setView] = useState<'qr' | 'pending'>(order.status === 'payment_pending' ? 'pending' : 'qr');
  const [checking, setChecking] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // Same route, different screen: move focus to the new heading.
  useFocusHeadingOnChange(view);

  /** "I paid" / "Check again": ask the fake bank, which answers after a short delay. */
  const checkPayment = () => {
    setChecking(true);
    setAnnouncement('Revisando tu pago…');
    later(() => {
      setChecking(false);
      if (readDev().forcePaymentPending) {
        if (actions.markPaymentPending(order.id).ok) {
          setView('pending');
          setAnnouncement('Todavía no vemos tu pago. Tu porción sigue apartada.');
        }
        return;
      }
      if (actions.markPaid(order.id).ok) navigate(`/buyer/order/${order.id}`);
    }, FAKE_BANK_DELAY_MS);
  };

  const summary = `${listing.title} × ${order.quantity}`;

  return (
    <>
      <p className="sr-only" aria-live="polite" role="status">
        {announcement}
      </p>
      {view === 'qr' ? (
        <>
          <BackButton to={`/buyer/listing/${listing.id}`} label="Volver al plato" />
          <PageTitle>Paga con QR</PageTitle>
          <Subtitle>
            {summary} · {restaurant.name}
          </Subtitle>
          <HoldNotice until={order.reservedUntil} />
          <div className="mb-3 rounded-lg border bg-surface p-4 text-center">
            <QrCode seed={Number(order.pickupCode.replace(/\D/g, '')) || 4827} label={`Código QR para pagar ${formatBs(order.total)} a ${restaurant.name}`} />
            <p className="num text-xl font-extrabold">{formatBs(order.total, { cents: true })}</p>
          </div>
          <ol className="list-decimal space-y-1 pl-5 leading-relaxed text-secondary">
            <li>Abre la app de tu banco o billetera.</li>
            <li>Escanea el QR (QR Simple, cualquier banco).</li>
            <li>Vuelve aquí y toca “Ya pagué”.</li>
          </ol>
          <StickyFoot>
            <Button block onClick={checkPayment} disabled={checking}>
              {checking ? 'Revisando tu pago…' : 'Ya pagué'}
            </Button>
          </StickyFoot>
        </>
      ) : (
        <>
          <BackButton to={`/buyer/listing/${listing.id}`} label="Volver al plato" />
          <PageTitle>Todavía no vemos tu pago</PageTitle>
          <Subtitle>A veces el banco tarda un poco en confirmarlo.</Subtitle>
          <HoldNotice until={order.reservedUntil} stillHeld />
          <Facts
            items={[
              { icon: 'box', label: 'Pedido', value: `${summary} · ${formatBs(order.total)}` },
              { icon: 'pin', label: 'Restaurante', value: restaurant.name },
            ]}
          />
          <StickyFoot>
            <Button block onClick={checkPayment} disabled={checking}>
              {checking ? 'Revisando…' : 'Revisar de nuevo'}
            </Button>
            <Button block variant="ghost" onClick={() => setView('qr')} disabled={checking}>
              Volver al QR
            </Button>
          </StickyFoot>
        </>
      )}
    </>
  );
}

function HoldExpired({ listing }: { listing: Listing }) {
  return (
    <div className="pt-6">
      <PageTitle>Se acabó el tiempo para pagar</PageTitle>
      <Notice tone="out" icon="clock" className="mb-4">
        Pasaron 10 minutos sin confirmar el pago, así que la porción volvió a estar disponible para otros.
      </Notice>
      <div className="flex flex-col gap-2">
        <ButtonLink block to={`/buyer/listing/${listing.id}`}>
          Volver a {listing.title}
        </ButtonLink>
        <ButtonLink block variant="ghost" to="/buyer">
          Ver otros platos
        </ButtonLink>
      </div>
    </div>
  );
}
