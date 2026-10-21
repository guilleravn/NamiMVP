import { toHHMM } from '../lib/time';
import type { Listing, ListingFormat, OrderStatus, RestaurantType } from '../types';
import type { Tone } from './Badge';
import type { IconName } from './Icon';

export interface StatusMeta {
  label: string;
  tone: Tone;
  icon: IconName;
}

export function orderStatusMeta(status: OrderStatus): StatusMeta {
  switch (status) {
    case 'reserved':
      return { label: 'Apartado · falta pagar', tone: 'low', icon: 'clock' };
    case 'payment_pending':
      return { label: 'Pago en revisión', tone: 'low', icon: 'alert' };
    case 'paid':
      return { label: 'Pagado · por retirar', tone: 'fresh', icon: 'bag' };
    case 'picked_up':
      return { label: 'Retirado', tone: 'fresh', icon: 'check' };
    case 'expired':
      return { label: 'Reserva vencida', tone: 'out', icon: 'clock' };
    case 'no_show':
      return { label: 'No retirado', tone: 'out', icon: 'alert' };
    case 'cancelled':
      return { label: 'Cancelado', tone: 'out', icon: 'x' };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/** Restaurant-side badge for a listing's state. */
export function listingStatusMeta(listing: Listing): StatusMeta {
  switch (listing.status) {
    case 'live':
      return { label: `En vivo · quedan ${listing.portionsLeft}`, tone: 'fresh', icon: 'check' };
    case 'sold_out':
      return { label: 'Agotado', tone: 'out', icon: 'box' };
    case 'scheduled':
      return { label: `Programado · visible ${toHHMM(listing.visibleFrom)}`, tone: 'neutral', icon: 'clock' };
    case 'paused':
      return { label: 'Pausado', tone: 'neutral', icon: 'pause' };
    case 'expired':
      return { label: 'Terminó el retiro', tone: 'out', icon: 'clock' };
    default: {
      const _exhaustive: never = listing.status;
      return _exhaustive;
    }
  }
}

/** "Hecho hoy 12:30" (or "Horneado hoy" for bakeries): answers the buyer's freshness worry. */
export function freshLabel({ preparedAt, restaurantType }: { preparedAt: string; restaurantType: RestaurantType }): string {
  return `${restaurantType === 'bakery' ? 'Horneado' : 'Hecho'} hoy ${toHHMM(preparedAt)}`;
}

export function formatLabel(format: ListingFormat): string {
  switch (format) {
    case 'dish':
      return 'Plato';
    case 'surprise_bag':
      return 'Bolsa sorpresa';
    default: {
      const _exhaustive: never = format;
      return _exhaustive;
    }
  }
}
