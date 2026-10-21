import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Photo } from '../../components/Photo';
import { Price } from '../../components/Price';
import { Stepper } from '../../components/Stepper';
import { freshLabel } from '../../components/status';
import { BackButton, Facts, Notice, PageTitle, StickyFoot } from '../../components/ui';
import { distanceMeters, formatBs, formatDistance, walkMinutes } from '../../lib/format';
import { useDocumentTitle } from '../../lib/hooks';
import { toHHMM } from '../../lib/time';
import type { ReserveError } from '../../store/logic';
import { findListing, findRestaurant, pickupWindow, restaurantRating } from '../../store/selectors';
import { useStore } from '../../store/StoreProvider';
import type { Listing } from '../../types';
import { MissingPage } from '../MissingPage';
import { useBuyerZone } from './useBuyerZone';

function reserveErrorMessage(error: ReserveError): string {
  switch (error) {
    case 'listing_not_found':
      return 'Esta publicación ya no existe.';
    case 'not_available':
      return 'Esta publicación ya no está disponible.';
    case 'invalid_quantity':
      return 'Elige al menos una porción.';
    case 'not_enough_portions':
      return 'Ya no quedan tantas porciones. Baja la cantidad.';
    default: {
      const _exhaustive: never = error;
      return _exhaustive;
    }
  }
}

/** Why the Reserve button is off, when the listing isn't live. */
function unavailableReason(listing: Listing): string | null {
  switch (listing.status) {
    case 'live':
      return null;
    case 'sold_out':
      return 'Agotado hoy';
    case 'scheduled':
      return `Disponible desde las ${toHHMM(listing.visibleFrom)}`;
    case 'paused':
      return 'El restaurante pausó esta publicación';
    case 'expired':
      return 'Terminó el horario de retiro';
    default: {
      const _exhaustive: never = listing.status;
      return _exhaustive;
    }
  }
}

export function ListingDetail() {
  const { id } = useParams();
  const { db, actions } = useStore();
  const zone = useBuyerZone();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const listing = findListing(db, id);
  const restaurant = findRestaurant(db, listing?.restaurantId);
  useDocumentTitle(listing?.title ?? 'Plato');
  if (!listing || !restaurant) return <MissingPage backTo="/buyer" />;

  const rating = restaurantRating({ db, restaurantId: restaurant.id });
  const meters = distanceMeters(zone, restaurant);
  const reason = unavailableReason(listing);
  const qty = Math.min(quantity, Math.max(1, listing.portionsLeft));
  const unit = listing.format === 'dish' ? (listing.portionsLeft === 1 ? 'porción' : 'porciones') : listing.portionsLeft === 1 ? 'bolsa' : 'bolsas';

  const onReserve = () => {
    const result = actions.reserve({ listingId: listing.id, quantity: qty });
    if (result.ok) navigate(`/buyer/order/${result.order.id}/pay`);
    else setError(reserveErrorMessage(result.error));
  };

  return (
    <>
      <BackButton to="/buyer" label="Volver a los platos de hoy" />
      <div className="relative mb-4 h-32 overflow-hidden rounded-lg">
        <Photo photo={listing.photo} alt={`Foto de ${listing.title}`} className="h-full w-full" />
        <Badge tone="fresh" icon="flame" className="absolute left-3 top-3">
          <span className="num">{freshLabel({ preparedAt: listing.preparedAt, restaurantType: restaurant.type })}</span>
        </Badge>
      </div>

      <div className="mb-1 flex items-start justify-between gap-3">
        <PageTitle>{listing.title}</PageTitle>
        <Price listing={listing} />
      </div>
      <p className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-secondary">
        <b className="text-primary">{restaurant.name}</b>
        {rating ? (
          <span>
            <span aria-hidden="true">★ </span>
            {rating.average.toLocaleString('es-BO')} frescura ({rating.count})
          </span>
        ) : (
          <Badge tone="neutral">Nuevo · sin calificaciones</Badge>
        )}
      </p>

      <Facts
        items={[
          { icon: 'flame', label: 'Preparado', value: `Hoy a las ${toHHMM(listing.preparedAt)}`, fresh: true },
          { icon: 'clock', label: 'Retiro', value: `Hoy ${pickupWindow(listing)}` },
          { icon: 'pin', label: 'Dónde', value: `${formatDistance(meters)} de ${zone.name} · ${walkMinutes(meters)} min a pie` },
          { icon: 'box', label: 'Quedan', value: `${listing.portionsLeft} ${unit}` },
        ]}
      />
      <p className="mb-4 leading-relaxed text-secondary">{listing.description}</p>

      {reason === null && <Stepper label="Cantidad" value={qty} max={listing.portionsLeft} onChange={setQuantity} />}
      {reason !== null && (
        <Notice tone="out" icon="alert">
          {reason}
        </Notice>
      )}
      <div aria-live="polite">
        {error && (
          <Notice tone="low" icon="alert" className="mt-3">
            {error}
          </Notice>
        )}
      </div>

      <StickyFoot>
        <Button block disabled={reason !== null} onClick={onReserve}>
          {reason ?? (
            <>
              Reservar · <span className="num">{formatBs(listing.price * qty)}</span>
            </>
          )}
        </Button>
      </StickyFoot>
    </>
  );
}
