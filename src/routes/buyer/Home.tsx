import { useState } from 'react';
import { ListingCard } from '../../components/ListingCard';
import { AppBar, Chip, PageTitle, Subtitle } from '../../components/ui';
import { useDocumentTitle } from '../../lib/hooks';
import { buyerFeed, findRestaurant, restaurantRating } from '../../store/selectors';
import { useStore } from '../../store/StoreProvider';
import type { ListingFormat } from '../../types';
import { useBuyerZone } from './useBuyerZone';

type Filter = 'all' | ListingFormat;

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'Todo' },
  { value: 'dish', label: 'Platos' },
  { value: 'surprise_bag', label: 'Bolsas' },
];

export function Home() {
  const { db, now } = useStore();
  const zone = useBuyerZone();
  const [filter, setFilter] = useState<Filter>('all');
  useDocumentTitle('Platos de hoy');

  const feed = buyerFeed({ db, now }).filter((l) => l.status === 'live');
  const visible = filter === 'all' ? feed : feed.filter((l) => l.format === filter);

  return (
    <>
      <AppBar>
        Retiras cerca de
        <b className="block text-sm text-primary">{zone.name}</b>
      </AppBar>
      <PageTitle>Platos de hoy</PageTitle>
      <Subtitle>Comida hecha hoy en restaurantes cerca de ti, con 50–70% de descuento.</Subtitle>

      <div role="group" aria-label="Filtrar por formato" className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.value} pressed={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
          </Chip>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {visible.length === 1 ? '1 resultado' : `${visible.length} resultados`}
      </p>

      {visible.length === 0 ? (
        <p className="rounded-lg border bg-surface p-4 text-secondary">No hay publicaciones de este tipo ahora mismo. Prueba con “Todo”.</p>
      ) : (
        <ul>
          {visible.map((listing) => {
            const restaurant = findRestaurant(db, listing.restaurantId);
            if (!restaurant) return null;
            return (
              <li key={listing.id}>
                <ListingCard listing={listing} restaurant={restaurant} rating={restaurantRating({ db, restaurantId: restaurant.id })} zone={zone} />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
