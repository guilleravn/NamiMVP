import { useState } from 'react';
import { ListingCard } from '../../components/ListingCard';
import { AppBar, Chip, PageTitle, Subtitle, Switch } from '../../components/ui';
import { useDocumentTitle } from '../../lib/hooks';
import { isSameDay } from '../../lib/time';
import { isSubscribed, type SubscriptionTarget } from '../../store/logic';
import { buyerFeed, findRestaurant, postingWindow, restaurantRating } from '../../store/selectors';
import { useStore } from '../../store/StoreProvider';
import type { ListingFormat, Zone } from '../../types';
import { useBuyerZone } from './useBuyerZone';

type Filter = 'all' | ListingFormat;

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'Todo' },
  { value: 'dish', label: 'Platos' },
  { value: 'surprise_bag', label: 'Bolsas' },
];

export function Home() {
  const { db, now, currentUser, actions } = useStore();
  const zone = useBuyerZone();
  const [filter, setFilter] = useState<Filter>('all');
  useDocumentTitle('Platos de hoy');

  const feed = buyerFeed({ db, now });
  const visible = filter === 'all' ? feed : feed.filter((l) => l.format === filter);
  const userId = currentUser?.id ?? '';

  return (
    <>
      <AppBar>
        Retiras cerca de
        <b className="block text-sm text-primary">{zone.name}</b>
      </AppBar>

      {feed.length === 0 ? (
        <EmptyState zone={zone} />
      ) : (
        <>
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
                const target: SubscriptionTarget = { kind: 'restaurant', restaurantId: restaurant.id };
                return (
                  <li key={listing.id}>
                    <ListingCard
                      listing={listing}
                      restaurant={restaurant}
                      rating={restaurantRating({ db, restaurantId: restaurant.id })}
                      zone={zone}
                      notify={{ subscribed: isSubscribed({ db, userId, target }), onToggle: () => actions.toggleSubscription(target) }}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </>
  );
}

/** Nothing live nearby: say why, when dishes usually appear, and offer one thing to do. */
function EmptyState({ zone }: { zone: Zone }) {
  const { db, now, currentUser, actions } = useStore();
  const hours = postingWindow({ db, zoneId: zone.id });
  const target: SubscriptionTarget = { kind: 'zone', zoneId: zone.id };
  const subscribed = isSubscribed({ db, userId: currentUser?.id ?? '', target });
  const today = db.listings.filter((l) => isSameDay(l.pickupStart, now));
  const dayIsOver = today.length > 0 && today.every((l) => l.status === 'expired');

  return (
    <div className="px-2 py-6 text-center">
      <div aria-hidden="true" className="mb-3 text-xl">
        🍽️
      </div>
      <PageTitle>{dayIsOver ? 'Por hoy ya no quedan platos' : 'Todavía no hay platos cerca'}</PageTitle>
      {hours && (
        <Subtitle>
          Los restaurantes de esta zona suelen publicar entre las <b className="num text-primary">{hours.from}</b> y las{' '}
          <b className="num text-primary">{hours.to}</b>, cuando termina su hora pico{dayIsOver ? '. Vuelve mañana.' : '.'}
        </Subtitle>
      )}
      <Switch
        checked={subscribed}
        onChange={() => actions.toggleSubscription(target)}
        label="Avisarme cuando publiquen"
        hint={subscribed ? 'Listo: te avisaremos una vez, sin spam.' : 'Una notificación, sin spam.'}
      />
    </div>
  );
}
