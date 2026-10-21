import { useId } from 'react';
import { distanceMeters, formatBs, formatDistance } from '../lib/format';
import { cx } from '../lib/cx';
import { isLowStock, pickupWindow } from '../store/selectors';
import type { Listing, RatingSummary, Restaurant, Zone } from '../types';
import { Badge } from './Badge';
import { ButtonLink } from './Button';
import { Photo } from './Photo';
import { Price } from './Price';
import { freshLabel } from './status';

interface ListingCardProps {
  listing: Listing;
  restaurant: Restaurant;
  rating: RatingSummary | null;
  zone: Zone;
}

/** Home card: what it is, when it was made, how much, and a visible Reserve button. */
export function ListingCard({ listing, restaurant, rating, zone }: ListingCardProps) {
  const titleId = useId();
  const distance = formatDistance(distanceMeters(zone, restaurant));

  return (
    <article aria-labelledby={titleId} className={cx('mb-3 grid grid-cols-[72px_1fr] gap-3 rounded-lg border bg-surface p-3')}>
      <Photo photo={listing.photo} alt="" className="h-18 w-18 rounded-md" />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 id={titleId} className="text-md font-extrabold leading-tight">
              {listing.title}
            </h2>
            <p className="mt-0.5 text-xs text-secondary">
              {restaurant.name}
              {rating && (
                <>
                  {' · '}
                  <span aria-hidden="true">★ {rating.average.toLocaleString('es-BO')}</span>
                  <span className="sr-only">frescura {rating.average.toLocaleString('es-BO')} de 5</span>
                </>
              )}
              {' · '}
              <span className="num">{distance}</span>
            </p>
          </div>
          <Price listing={listing} />
        </div>
        <div className="my-2 flex flex-wrap gap-1">
          <Badge tone="fresh" icon="flame">
            <span className="num">{freshLabel({ preparedAt: listing.preparedAt, restaurantType: restaurant.type })}</span>
          </Badge>
          {isLowStock(listing) && <Badge tone="low">Quedan {listing.portionsLeft}</Badge>}
          {rating === null && <Badge tone="neutral">Nuevo · sin calificaciones</Badge>}
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-2">
        <p className="text-xs leading-snug text-secondary">
          Retira hoy
          <br />
          <b className="num text-primary">{pickupWindow(listing)}</b>
        </p>
        <ButtonLink to={`/buyer/listing/${listing.id}`} aria-label={`Reservar ${listing.title} de ${restaurant.name}, ${formatBs(listing.price)}`}>
          Reservar
        </ButtonLink>
      </div>
    </article>
  );
}
