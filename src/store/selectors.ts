// Read-only views over the database. Pure, like logic.ts.

import { addDays, isSameDay, startOfDay, toHHMM } from '../lib/time';
import type { Db, Listing, Order, OrderStatus, RatingSummary, Restaurant } from '../types';

export const LOW_STOCK_MAX = 3;

export function findListing(db: Db, id: string | undefined): Listing | undefined {
  return db.listings.find((l) => l.id === id);
}

export function findRestaurant(db: Db, id: string | undefined): Restaurant | undefined {
  return db.restaurants.find((r) => r.id === id);
}

export function findOrder(db: Db, id: string | undefined): Order | undefined {
  return db.orders.find((o) => o.id === id);
}

export function isLowStock(listing: Listing): boolean {
  return listing.status === 'live' && listing.portionsLeft <= LOW_STOCK_MAX;
}

/** Seed rating plus every rating sent in the app for this restaurant. null = no ratings yet. */
export function restaurantRating({ db, restaurantId }: { db: Db; restaurantId: string }): RatingSummary | null {
  const restaurant = findRestaurant(db, restaurantId);
  const listingIds = new Set(db.listings.filter((l) => l.restaurantId === restaurantId).map((l) => l.id));
  const orderIds = new Set(db.orders.filter((o) => listingIds.has(o.listingId)).map((o) => o.id));
  const scores = db.ratings.filter((r) => orderIds.has(r.orderId)).map((r) => r.freshnessScore);

  const seed = restaurant?.rating ?? null;
  const count = (seed?.count ?? 0) + scores.length;
  if (count === 0) return null;
  const sum = (seed ? seed.average * seed.count : 0) + scores.reduce<number>((a, b) => a + b, 0);
  return { average: Math.round((sum / count) * 10) / 10, count };
}

function isToday(listing: Listing, now: Date): boolean {
  return isSameDay(listing.pickupStart, now);
}

/** What buyers see on Home: today's live listings first, then sold-out ones (kept visible, greyed). */
export function buyerFeed({ db, now }: { db: Db; now: Date }): Listing[] {
  return db.listings
    .filter((l) => isToday(l, now) && (l.status === 'live' || l.status === 'sold_out'))
    .sort((a, b) => Number(a.status === 'sold_out') - Number(b.status === 'sold_out') || a.pickupStart.localeCompare(b.pickupStart));
}

const STATUS_ORDER: Record<Listing['status'], number> = { live: 0, sold_out: 1, scheduled: 2, paused: 3, expired: 4 };

export function restaurantListingsToday({ db, restaurantId, now }: { db: Db; restaurantId: string; now: Date }): Listing[] {
  return db.listings
    .filter((l) => l.restaurantId === restaurantId && isToday(l, now))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.pickupStart.localeCompare(b.pickupStart));
}

/** Portions currently held or sold for a listing (not expired/cancelled). */
export function reservedCount({ db, listingId }: { db: Db; listingId: string }): number {
  return db.orders.filter((o) => o.listingId === listingId && countsAsSale(o.status)).reduce((sum, o) => sum + o.quantity, 0);
}

/** Order still in progress for the buyer. */
export function isActiveOrder(status: OrderStatus): boolean {
  switch (status) {
    case 'reserved':
    case 'payment_pending':
    case 'paid':
      return true;
    case 'picked_up':
    case 'expired':
    case 'no_show':
    case 'cancelled':
      return false;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/** Held or paid: the portion is taken. */
function countsAsSale(status: OrderStatus): boolean {
  switch (status) {
    case 'reserved':
    case 'payment_pending':
    case 'paid':
    case 'picked_up':
    case 'no_show':
      return true;
    case 'expired':
    case 'cancelled':
      return false;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/** Money actually came in. */
function isPaidStatus(status: OrderStatus): boolean {
  return status === 'paid' || status === 'picked_up' || status === 'no_show';
}

export function buyerOrders({ db, buyerId }: { db: Db; buyerId: string }): Order[] {
  return db.orders.filter((o) => o.buyerId === buyerId).sort((a, b) => b.reservedAt.localeCompare(a.reservedAt));
}

export function hasRating({ db, orderId }: { db: Db; orderId: string }): boolean {
  return db.ratings.some((r) => r.orderId === orderId);
}

function ordersOfRestaurant(db: Db, restaurantId: string, keep: (listing: Listing) => boolean): Order[] {
  const ids = new Set(db.listings.filter((l) => l.restaurantId === restaurantId && keep(l)).map((l) => l.id));
  return db.orders.filter((o) => ids.has(o.listingId));
}

export function restaurantOrdersToday({ db, restaurantId, now }: { db: Db; restaurantId: string; now: Date }): Order[] {
  return ordersOfRestaurant(db, restaurantId, (l) => isToday(l, now)).sort((a, b) => a.reservedAt.localeCompare(b.reservedAt));
}

export interface MoneySummary {
  /** What buyers paid. */
  sales: number;
  /** Ñami's cut. */
  fees: number;
  /** sales − fees: what the restaurant keeps from food that used to bring in Bs 0. */
  recovered: number;
}

function money(orders: Order[]): MoneySummary {
  const paid = orders.filter((o) => isPaidStatus(o.status));
  const sales = paid.reduce((sum, o) => sum + o.total, 0);
  const fees = paid.reduce((sum, o) => sum + o.feeAmount, 0);
  return { sales, fees, recovered: sales - fees };
}

/** North Star: dishes rescued = quantity of orders picked up within [from, to). */
export function northStar({ db, from, to, restaurantId }: { db: Db; from: Date; to: Date; restaurantId?: string }): number {
  const listingIds = restaurantId ? new Set(db.listings.filter((l) => l.restaurantId === restaurantId).map((l) => l.id)) : null;
  return db.orders.reduce((sum, o) => {
    if (o.status !== 'picked_up') return sum;
    if (listingIds && !listingIds.has(o.listingId)) return sum;
    const t = Date.parse(o.pickedUpAt);
    return t >= from.getTime() && t < to.getTime() ? sum + o.quantity : sum;
  }, 0);
}

export function daySummary({ db, restaurantId, now }: { db: Db; restaurantId: string; now: Date }) {
  const from = startOfDay(now);
  return {
    ...money(restaurantOrdersToday({ db, restaurantId, now })),
    dishesRescued: northStar({ db, restaurantId, from, to: addDays(from, 1) }),
  };
}

/** Last 7 days including today. */
export function weekStats({ db, restaurantId, now }: { db: Db; restaurantId: string; now: Date }) {
  const from = startOfDay(addDays(now, -6));
  const to = addDays(startOfDay(now), 1);
  const inRange = (l: Listing) => Date.parse(l.pickupStart) >= from.getTime() && Date.parse(l.pickupStart) < to.getTime();
  const listings = db.listings.filter((l) => l.restaurantId === restaurantId && inRange(l));
  const orders = ordersOfRestaurant(db, restaurantId, inRange);

  const posted = listings.reduce((sum, l) => sum + l.portionsTotal, 0);
  const sold = orders.filter((o) => isPaidStatus(o.status)).reduce((sum, o) => sum + o.quantity, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const dayStart = addDays(from, i);
    return { day: dayStart, rescued: northStar({ db, restaurantId, from: dayStart, to: addDays(dayStart, 1) }) };
  });

  return {
    dishesRescued: northStar({ db, restaurantId, from, to }),
    ...money(orders),
    posted,
    sold,
    sellThrough: posted === 0 ? 0 : Math.round((sold / posted) * 100),
    days,
  };
}

/** When restaurants in the zone usually start posting: earliest and latest end of rush hour. */
export function postingWindow({ db, zoneId }: { db: Db; zoneId: string }): { from: string; to: string } | null {
  const times = db.restaurants.filter((r) => r.zoneId === zoneId).map((r) => r.rushHourEndsAt).sort();
  const from = times[0];
  const to = times[times.length - 1];
  return from && to ? { from, to } : null;
}

/** "15:00 – 16:30" */
export function pickupWindow(listing: Listing): string {
  return `${toHHMM(listing.pickupStart)} – ${toHHMM(listing.pickupEnd)}`;
}
