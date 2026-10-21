import { useState } from 'react';
import { Badge } from '../../components/Badge';
import { Button, ButtonLink } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Photo } from '../../components/Photo';
import { formatLabel, listingStatusMeta } from '../../components/status';
import { PageTitle, Subtitle } from '../../components/ui';
import { formatBs } from '../../lib/format';
import { useDocumentTitle } from '../../lib/hooks';
import { pickupWindow, reservedCount, restaurantListingsToday } from '../../store/selectors';
import { useStore } from '../../store/StoreProvider';
import type { Listing } from '../../types';
import { useOwnRestaurant } from './useOwnRestaurant';

export function TodayListings() {
  const { db, now } = useStore();
  const restaurant = useOwnRestaurant();
  const [announcement, setAnnouncement] = useState('');
  useDocumentTitle('Publicaciones de hoy');
  const listings = restaurantListingsToday({ db, restaurantId: restaurant.id, now });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle>Publicaciones de hoy</PageTitle>
          <Subtitle className="mb-0">Los compradores las ven desde las {restaurant.rushHourEndsAt}, cuando termina tu hora pico.</Subtitle>
        </div>
        <ButtonLink to="/restaurant/new" block className="sm:w-auto sm:px-6">
          <Icon name="plus" strokeWidth={2.5} />
          Publicar más sobras
        </ButtonLink>
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {listings.length === 0 ? (
        <div className="rounded-lg border bg-surface p-6 text-center">
          <p className="mb-1 font-extrabold">Todavía no publicaste nada hoy</p>
          <p className="text-secondary">¿Te sobró algo del almuerzo? Publicarlo toma menos de un minuto.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {listings.map((listing) => (
            <ListingRow key={listing.id} listing={listing} onAnnounce={setAnnouncement} />
          ))}
        </ul>
      )}
    </>
  );
}

function ListingRow({ listing, onAnnounce }: { listing: Listing; onAnnounce: (text: string) => void }) {
  const { db, actions } = useStore();
  const status = listingStatusMeta(listing);
  const reserved = reservedCount({ db, listingId: listing.id });
  const over = listing.status === 'expired';

  const togglePause = () => {
    if (listing.status === 'paused') {
      if (actions.resumeListing(listing.id).ok) onAnnounce(`${listing.title} vuelve a estar publicado.`);
    } else if (actions.pauseListing(listing.id).ok) {
      onAnnounce(`${listing.title} quedó pausado. Los compradores ya no lo ven.`);
    }
  };

  return (
    <li className="flex flex-col rounded-lg border bg-surface p-3">
      <div className="flex gap-3">
        <Photo photo={listing.photo} alt="" className="h-16 w-16 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-md font-extrabold leading-tight">{listing.title}</h2>
            <span className="num whitespace-nowrap font-extrabold">{formatBs(listing.price)}</span>
          </div>
          <p className="text-xs text-secondary">
            {formatLabel(listing.format)} · <span className="num">retiro {pickupWindow(listing)}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge tone={status.tone} icon={status.icon}>
              <span className="num">{status.label}</span>
            </Badge>
            {reserved > 0 && (
              <Badge tone="neutral" icon="bag">
                <span className="num">
                  {reserved} de {listing.portionsTotal} reservadas
                </span>
              </Badge>
            )}
          </div>
        </div>
      </div>
      {!over && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ButtonLink to={`/restaurant/listing/${listing.id}/edit`} variant="secondary" aria-label={`Editar ${listing.title}`}>
            <Icon name="edit" />
            Editar
          </ButtonLink>
          <Button variant="secondary" onClick={togglePause} aria-label={`${listing.status === 'paused' ? 'Reanudar' : 'Pausar'} ${listing.title}`}>
            <Icon name={listing.status === 'paused' ? 'play' : 'pause'} />
            {listing.status === 'paused' ? 'Reanudar' : 'Pausar'}
          </Button>
        </div>
      )}
    </li>
  );
}
