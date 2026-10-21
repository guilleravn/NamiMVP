import { addDays, addMinutes, atTime } from '../lib/time';
import type { Db, Listing, ListingFormat, Order, Payment, PhotoKey, Rating } from '../types';
import { DEMO_BUYER_ID, USERS, ZONE_UCB } from './people';
import { RESTAURANT_IDS, buildRestaurants } from './restaurants';

// The demo database, built relative to `today` so the demo works on any date.
// Listing statuses are placeholders here: the store runs `refresh()` right after seeding.

interface ListingSpec {
  id: string;
  restaurantId: string;
  format: ListingFormat;
  title: string;
  description: string;
  photo: PhotoKey;
  regularPrice: number;
  price: number;
  portionsTotal: number;
  portionsLeft: number;
  /** "HH:MM" on the listing's day. */
  preparedAt: string;
  visibleFrom: string;
  pickupStart: string;
  pickupEnd: string;
}

function makeListing(day: Date, spec: ListingSpec): Listing {
  return {
    ...spec,
    preparedAt: atTime({ day, hhmm: spec.preparedAt }),
    visibleFrom: atTime({ day, hhmm: spec.visibleFrom }),
    pickupStart: atTime({ day, hhmm: spec.pickupStart }),
    pickupEnd: atTime({ day, hhmm: spec.pickupEnd }),
    status: 'scheduled',
  };
}

const R = RESTAURANT_IDS;

const SILPANCHO = {
  format: 'dish',
  title: 'Silpancho',
  description:
    'El mismo silpancho del almuerzo de hoy: arroz, papa, carne apanada, huevo y ensalada. Se entrega en envase para llevar.',
  photo: 'silpancho',
  regularPrice: 35,
  price: 14,
} satisfies Partial<ListingSpec>;

const SOPA_DE_MANI = {
  format: 'dish',
  title: 'Sopa de maní',
  description: 'Sopa de maní con fideo frito y papa, del menú de hoy. Si quieres, trae tu táper; también damos envase.',
  photo: 'sopa-de-mani',
  regularPrice: 20,
  price: 8,
} satisfies Partial<ListingSpec>;

const PIQUE_MACHO = {
  format: 'dish',
  title: 'Pique macho',
  description: 'Carne de res, salchicha, papas fritas, locoto, cebolla y huevo. Porción completa del almuerzo.',
  photo: 'pique',
  regularPrice: 40,
  price: 16,
} satisfies Partial<ListingSpec>;

const POLLO_BROASTER = {
  format: 'dish',
  title: 'Cuarto de pollo broaster',
  description: 'Cuarto de pollo broaster con papas fritas y arroz, preparado para el almuerzo.',
  photo: 'pollo',
  regularPrice: 30,
  price: 12,
} satisfies Partial<ListingSpec>;

function todaysListings(today: Date): Listing[] {
  const specs: ListingSpec[] = [
    { id: 'lst-1', restaurantId: R.saborValluno, ...SILPANCHO, portionsTotal: 6, portionsLeft: 3, preparedAt: '12:30', visibleFrom: '14:30', pickupStart: '15:00', pickupEnd: '16:30' },
    { id: 'lst-2', restaurantId: R.saborValluno, ...SOPA_DE_MANI, portionsTotal: 4, portionsLeft: 0, preparedAt: '11:45', visibleFrom: '14:30', pickupStart: '14:30', pickupEnd: '16:00' },
    { id: 'lst-3', restaurantId: R.rinconCochala, ...PIQUE_MACHO, portionsTotal: 4, portionsLeft: 0, preparedAt: '12:00', visibleFrom: '14:30', pickupStart: '15:00', pickupEnd: '16:00' },
    {
      id: 'lst-4',
      restaurantId: R.rinconCochala,
      format: 'dish',
      title: 'Chicharrón',
      description: 'Chicharrón de cerdo con mote, papa y llajua. Del almuerzo de hoy.',
      photo: 'chicharron',
      regularPrice: 45,
      price: 18,
      portionsTotal: 5,
      portionsLeft: 5,
      preparedAt: '12:15',
      visibleFrom: '14:30',
      pickupStart: '15:30',
      pickupEnd: '17:00',
    },
    {
      id: 'lst-5',
      restaurantId: R.rinconCochala,
      format: 'surprise_bag',
      title: 'Bolsa sorpresa del almuerzo',
      description: 'Lo que sobró del menú de hoy: el segundo del día y, si hay, sopa o postre.',
      photo: 'almuerzo',
      regularPrice: 30,
      price: 12,
      portionsTotal: 3,
      portionsLeft: 2,
      preparedAt: '12:30',
      visibleFrom: '14:30',
      pickupStart: '16:00',
      pickupEnd: '17:30',
    },
    {
      id: 'lst-6',
      restaurantId: R.laEspiga,
      format: 'surprise_bag',
      title: 'Bolsa de panadería',
      description: 'Marraquetas, empanadas de queso y algo de pastelería de hoy. El contenido cambia cada día.',
      photo: 'pan',
      regularPrice: 30,
      price: 10,
      portionsTotal: 5,
      portionsLeft: 4,
      preparedAt: '07:00',
      visibleFrom: '13:00',
      pickupStart: '19:00',
      pickupEnd: '20:00',
    },
    { id: 'lst-7', restaurantId: R.pollosDonaRosa, ...POLLO_BROASTER, portionsTotal: 8, portionsLeft: 6, preparedAt: '12:45', visibleFrom: '14:30', pickupStart: '15:00', pickupEnd: '17:00' },
    {
      id: 'lst-8',
      restaurantId: R.pollosDonaRosa,
      format: 'dish',
      title: 'Salteñas de pollo (2 u.)',
      description: 'Dos salteñas horneadas esta mañana. Se recalientan bien en horno.',
      photo: 'saltenas',
      regularPrice: 16,
      price: 7,
      portionsTotal: 6,
      portionsLeft: 2,
      preparedAt: '09:30',
      visibleFrom: '14:30',
      pickupStart: '14:30',
      pickupEnd: '16:00',
    },
    {
      id: 'lst-9',
      restaurantId: R.cafeTunari,
      format: 'surprise_bag',
      title: 'Bolsa de masitas del café',
      description: 'Cuñapés, rollos de canela y masitas que horneamos hoy.',
      photo: 'masitas',
      regularPrice: 30,
      price: 12,
      portionsTotal: 4,
      portionsLeft: 4,
      preparedAt: '08:00',
      visibleFrom: '16:00',
      pickupStart: '18:00',
      pickupEnd: '19:30',
    },
    {
      id: 'lst-10',
      restaurantId: R.cafeTunari,
      format: 'dish',
      title: 'Torta de chocolate (porción)',
      description: 'Porción de torta de chocolate con dulce de leche, hecha esta mañana.',
      photo: 'torta',
      regularPrice: 15,
      price: 6,
      portionsTotal: 3,
      portionsLeft: 3,
      preparedAt: '10:00',
      visibleFrom: '16:00',
      pickupStart: '18:00',
      pickupEnd: '19:30',
    },
  ];
  return specs.map((spec) => makeListing(today, spec));
}

interface OrderSpec {
  listing: Listing;
  buyerId: string;
  quantity: number;
  code: string;
  /** Minutes after the listing's visibleFrom when it was reserved. */
  reservedAfter: number;
  outcome: 'paid' | 'picked_up' | 'no_show' | 'expired';
}

/** Every seeded restaurant except La Espiga pays Bs 2 per dish. */
function seedFee(listing: Listing, quantity: number): number {
  return listing.restaurantId === R.laEspiga ? 0 : 2 * quantity;
}

function makeOrder(id: string, spec: OrderSpec): Order {
  const { listing, quantity } = spec;
  const reservedAt = addMinutes(listing.visibleFrom, spec.reservedAfter);
  const base = {
    id,
    buyerId: spec.buyerId,
    listingId: listing.id,
    quantity,
    unitPrice: listing.price,
    total: listing.price * quantity,
    feeAmount: seedFee(listing, quantity),
    pickupCode: spec.code,
    reservedAt,
    reservedUntil: addMinutes(reservedAt, 10),
  };
  const paidAt = addMinutes(reservedAt, 2);
  switch (spec.outcome) {
    case 'expired':
      return { ...base, status: 'expired' };
    case 'paid':
      return { ...base, status: 'paid', paidAt };
    case 'no_show':
      return { ...base, status: 'no_show', paidAt };
    case 'picked_up':
      return { ...base, status: 'picked_up', paidAt, pickedUpAt: addMinutes(listing.pickupStart, 10 + spec.reservedAfter) };
    default: {
      const _exhaustive: never = spec.outcome;
      return _exhaustive;
    }
  }
}

interface PastDay {
  daysAgo: number;
  restaurantId: string;
  dish: typeof SILPANCHO | typeof SOPA_DE_MANI | typeof PIQUE_MACHO | typeof POLLO_BROASTER | typeof ALMUERZO;
  portionsTotal: number;
  /** Quantities of orders that were picked up. */
  pickedUp: number[];
  noShow?: number[];
}

const ALMUERZO = {
  format: 'surprise_bag',
  title: 'Bolsa sorpresa del almuerzo',
  description: 'Lo que sobró del menú del día.',
  photo: 'almuerzo',
  regularPrice: 30,
  price: 12,
} satisfies Partial<ListingSpec>;

/** Sabor Valluno's last six days, so Stats and "Orders" aren't empty. */
const PAST_DAYS: PastDay[] = [
  { daysAgo: 1, restaurantId: R.saborValluno, dish: SILPANCHO, portionsTotal: 6, pickedUp: [1, 2, 2] },
  { daysAgo: 2, restaurantId: R.saborValluno, dish: SOPA_DE_MANI, portionsTotal: 5, pickedUp: [2, 1], noShow: [1] },
  { daysAgo: 3, restaurantId: R.saborValluno, dish: SILPANCHO, portionsTotal: 5, pickedUp: [2, 2, 1] },
  { daysAgo: 4, restaurantId: R.saborValluno, dish: ALMUERZO, portionsTotal: 4, pickedUp: [1, 1] },
  { daysAgo: 5, restaurantId: R.saborValluno, dish: SILPANCHO, portionsTotal: 6, pickedUp: [3, 1] },
  { daysAgo: 6, restaurantId: R.saborValluno, dish: SOPA_DE_MANI, portionsTotal: 4, pickedUp: [2, 2] },
];

const OTHER_BUYERS = ['usr-b2', 'usr-b3', 'usr-b4'];

export function createSeed(today: Date): Db {
  const listings = todaysListings(today);
  const orders: Order[] = [];
  const payments: Payment[] = [];
  const ratings: Rating[] = [];
  let orderSeq = 0;
  let pastCode = 4600;

  const addOrder = (spec: OrderSpec): Order => {
    orderSeq += 1;
    const order = makeOrder(`ord-${orderSeq}`, spec);
    orders.push(order);
    payments.push({
      id: `pay-${orderSeq}`,
      orderId: order.id,
      amount: order.total,
      status: order.status === 'expired' ? 'failed' : 'confirmed',
      createdAt: addMinutes(order.reservedAt, 2),
    });
    return order;
  };
  const byId = (id: string): Listing => {
    const found = listings.find((l) => l.id === id);
    if (!found) throw new Error(`Seed listing ${id} missing`);
    return found;
  };

  // Today at Sabor Valluno: two silpancho orders to hand over, sopa de maní already handed over.
  addOrder({ listing: byId('lst-2'), buyerId: 'usr-b2', quantity: 3, code: 'ÑAM-4788', reservedAfter: 0, outcome: 'picked_up' });
  addOrder({ listing: byId('lst-2'), buyerId: 'usr-b4', quantity: 1, code: 'ÑAM-4790', reservedAfter: 1, outcome: 'picked_up' });
  addOrder({ listing: byId('lst-1'), buyerId: 'usr-b2', quantity: 1, code: 'ÑAM-4827', reservedAfter: 3, outcome: 'paid' });
  addOrder({ listing: byId('lst-1'), buyerId: 'usr-b3', quantity: 2, code: 'ÑAM-4831', reservedAfter: 10, outcome: 'paid' });

  // Past days.
  PAST_DAYS.forEach((day, dayIndex) => {
    const date = addDays(today, -day.daysAgo);
    const sold = [...day.pickedUp, ...(day.noShow ?? [])].reduce((a, b) => a + b, 0);
    const listing = makeListing(date, {
      id: `lst-p${dayIndex + 1}`,
      restaurantId: day.restaurantId,
      ...day.dish,
      portionsTotal: day.portionsTotal,
      portionsLeft: day.portionsTotal - sold,
      preparedAt: '12:30',
      visibleFrom: '14:30',
      pickupStart: '15:00',
      pickupEnd: '16:30',
    });
    listings.push(listing);
    day.pickedUp.forEach((quantity, i) => {
      // Yesterday's first silpancho was yours.
      const buyerId = day.daysAgo === 1 && i === 0 ? DEMO_BUYER_ID : (OTHER_BUYERS[i % OTHER_BUYERS.length] ?? 'usr-b2');
      pastCode += 1;
      const order = addOrder({ listing, buyerId, quantity, code: `ÑAM-${pastCode}`, reservedAfter: 5 + i * 7, outcome: 'picked_up' });
      if (buyerId === DEMO_BUYER_ID) {
        ratings.push({ id: 'rat-1', orderId: order.id, freshnessScore: 5, tags: ['was_warm', 'good_portion'], createdAt: addMinutes(order.reservedAt, 90) });
      }
    });
    (day.noShow ?? []).forEach((quantity, i) => {
      pastCode += 1;
      addOrder({ listing, buyerId: OTHER_BUYERS[(i + 1) % OTHER_BUYERS.length] ?? 'usr-b3', quantity, code: `ÑAM-${pastCode}`, reservedAfter: 30, outcome: 'no_show' });
    });
  });

  // Your other past orders: a pique macho you haven't rated yet, and a hold you let expire.
  const piqueDay = makeListing(addDays(today, -3), {
    id: 'lst-p7',
    restaurantId: R.rinconCochala,
    ...PIQUE_MACHO,
    portionsTotal: 4,
    portionsLeft: 1,
    preparedAt: '12:00',
    visibleFrom: '14:30',
    pickupStart: '15:00',
    pickupEnd: '16:00',
  });
  const polloDay = makeListing(addDays(today, -2), {
    id: 'lst-p8',
    restaurantId: R.pollosDonaRosa,
    ...POLLO_BROASTER,
    portionsTotal: 6,
    portionsLeft: 2,
    preparedAt: '12:45',
    visibleFrom: '14:30',
    pickupStart: '15:00',
    pickupEnd: '17:00',
  });
  listings.push(piqueDay, polloDay);
  addOrder({ listing: piqueDay, buyerId: DEMO_BUYER_ID, quantity: 1, code: 'ÑAM-4512', reservedAfter: 20, outcome: 'picked_up' });
  addOrder({ listing: polloDay, buyerId: DEMO_BUYER_ID, quantity: 1, code: 'ÑAM-4533', reservedAfter: 15, outcome: 'expired' });

  return {
    zones: [ZONE_UCB],
    users: USERS,
    restaurants: buildRestaurants(today),
    listings,
    orders,
    payments,
    ratings,
    subscriptions: [],
  };
}
