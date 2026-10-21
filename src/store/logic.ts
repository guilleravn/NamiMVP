// The fake backend. Pure functions: (db, args) → new db (or a typed error). No React, no clock
// reads, no randomness unless injected, so every rule here is unit-testable.

import { atTime, toHHMM } from '../lib/time';
import type {
  Db,
  FreshnessScore,
  Listing,
  ListingStatus,
  NotificationSubscription,
  Order,
  Payment,
  Rating,
  RatingTag,
  Restaurant,
  UnpaidOrder,
} from '../types';
import { hasErrors, validateListingInput, type ListingErrors, type ListingInput } from './listingInput';

export const HOLD_MINUTES = 10;

export type Outcome<E extends string, T = unknown> = ({ ok: true; db: Db } & T) | { ok: false; error: E };

// ---------- helpers ----------

function nextId(prefix: string, items: ReadonlyArray<{ id: string }>): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  const max = items.reduce((acc, item) => {
    const match = pattern.exec(item.id);
    return match?.[1] ? Math.max(acc, Number(match[1])) : acc;
  }, 0);
  return `${prefix}-${max + 1}`;
}

function replaceById<T extends { id: string }>(items: T[], next: T): T[] {
  return items.map((item) => (item.id === next.id ? next : item));
}

function ms(iso: string): number {
  return Date.parse(iso);
}

/** "ÑAM-4827": random 4 digits, never repeating an existing code. */
export function generatePickupCode({ taken, random }: { taken: ReadonlySet<string>; random: () => number }): string {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const code = `ÑAM-${1000 + Math.floor(random() * 9000)}`;
    if (!taken.has(code)) return code;
  }
  for (let n = 1000; n <= 9999; n += 1) {
    const code = `ÑAM-${n}`;
    if (!taken.has(code)) return code;
  }
  throw new Error('No pickup codes left');
}

/** Accepts "ÑAM-4827", "NAM 4827", "ñam4827" or just "4827". */
export function normalizePickupCode(input: string): string | null {
  const match = /^(?:[ÑN]AM-?)?(\d{4})$/.exec(input.toUpperCase().replace(/\s+/g, ''));
  return match?.[1] ? `ÑAM-${match[1]}` : null;
}

/** Fee for `quantity` dishes: Bs feePerDish each, or 0 while the restaurant is in its free month. */
export function orderFee({ restaurant, quantity, now }: { restaurant: Restaurant; quantity: number; now: Date }): number {
  if (restaurant.feeFreeUntil !== null && now.getTime() < ms(restaurant.feeFreeUntil)) return 0;
  return restaurant.feePerDish * quantity;
}

// ---------- listings ----------

/**
 * A listing is live only between visibleFrom and pickupEnd with portions left.
 * `paused` is the only status set by hand; everything else follows the clock.
 */
export function deriveListingStatus({ listing, now }: { listing: Listing; now: Date }): ListingStatus {
  const t = now.getTime();
  if (t >= ms(listing.pickupEnd)) return 'expired';
  if (listing.status === 'paused') return 'paused';
  if (t < ms(listing.visibleFrom)) return 'scheduled';
  if (listing.portionsLeft <= 0) return 'sold_out';
  return 'live';
}

function withStatus(listing: Listing, now: Date): Listing {
  const status = deriveListingStatus({ listing, now });
  return status === listing.status ? listing : { ...listing, status };
}

function buildListingTimes({ input, restaurant, now }: { input: ListingInput; restaurant: Restaurant; now: Date }) {
  return {
    preparedAt: atTime({ day: now, hhmm: input.preparedAt }),
    // Shown only after the restaurant's rush hour, so regulars don't wait for the discount.
    visibleFrom: atTime({ day: now, hhmm: restaurant.rushHourEndsAt }),
    pickupStart: atTime({ day: now, hhmm: input.pickupStart }),
    pickupEnd: atTime({ day: now, hhmm: input.pickupEnd }),
  };
}

export type ListingResult =
  | { ok: true; db: Db; listing: Listing }
  | { ok: false; error: 'invalid'; errors: ListingErrors }
  | { ok: false; error: 'not_found' };

export function postListing({
  db,
  restaurantId,
  input,
  now,
}: {
  db: Db;
  restaurantId: string;
  input: ListingInput;
  now: Date;
}): ListingResult {
  const restaurant = db.restaurants.find((r) => r.id === restaurantId);
  if (!restaurant) return { ok: false, error: 'not_found' };
  const errors = validateListingInput({ input, nowHHMM: toHHMM(now) });
  if (hasErrors(errors)) return { ok: false, error: 'invalid', errors };

  const listing = withStatus(
    {
      id: nextId('lst', db.listings),
      restaurantId,
      format: input.format,
      title: input.title.trim(),
      description: input.description.trim(),
      photo: input.photo,
      regularPrice: input.regularPrice,
      price: input.price,
      portionsTotal: input.portionsTotal,
      portionsLeft: input.portionsTotal,
      ...buildListingTimes({ input, restaurant, now }),
      status: 'scheduled',
    },
    now,
  );
  return { ok: true, db: { ...db, listings: [...db.listings, listing] }, listing };
}

export function editListing({
  db,
  listingId,
  input,
  now,
}: {
  db: Db;
  listingId: string;
  input: ListingInput;
  now: Date;
}): ListingResult {
  const listing = db.listings.find((l) => l.id === listingId);
  const restaurant = listing && db.restaurants.find((r) => r.id === listing.restaurantId);
  if (!listing || !restaurant) return { ok: false, error: 'not_found' };

  const errors = validateListingInput({ input, nowHHMM: toHHMM(now) });
  const alreadySold = listing.portionsTotal - listing.portionsLeft;
  if (errors.portionsTotal === undefined && input.portionsTotal < alreadySold) {
    errors.portionsTotal = `Ya se reservaron ${alreadySold}; no puede ser menos.`;
  }
  if (hasErrors(errors)) return { ok: false, error: 'invalid', errors };

  const updated = withStatus(
    {
      ...listing,
      format: input.format,
      title: input.title.trim(),
      description: input.description.trim(),
      photo: input.photo,
      regularPrice: input.regularPrice,
      price: input.price,
      portionsTotal: input.portionsTotal,
      portionsLeft: input.portionsTotal - alreadySold,
      ...buildListingTimes({ input, restaurant, now }),
    },
    now,
  );
  return { ok: true, db: { ...db, listings: replaceById(db.listings, updated) }, listing: updated };
}

export function pauseListing({ db, listingId, now }: { db: Db; listingId: string; now: Date }): Outcome<'not_found' | 'already_over'> {
  const listing = db.listings.find((l) => l.id === listingId);
  if (!listing) return { ok: false, error: 'not_found' };
  if (deriveListingStatus({ listing, now }) === 'expired') return { ok: false, error: 'already_over' };
  return { ok: true, db: { ...db, listings: replaceById(db.listings, { ...listing, status: 'paused' }) } };
}

export function resumeListing({ db, listingId, now }: { db: Db; listingId: string; now: Date }): Outcome<'not_found' | 'not_paused'> {
  const listing = db.listings.find((l) => l.id === listingId);
  if (!listing) return { ok: false, error: 'not_found' };
  if (listing.status !== 'paused') return { ok: false, error: 'not_paused' };
  // Any non-paused value works here: withStatus recomputes it from the clock.
  return { ok: true, db: { ...db, listings: replaceById(db.listings, withStatus({ ...listing, status: 'live' }, now)) } };
}

// ---------- orders ----------

export type ReserveError = 'listing_not_found' | 'not_available' | 'invalid_quantity' | 'not_enough_portions';

/** Holds `quantity` portions for 10 minutes while the buyer pays. */
export function reserve({
  db,
  listingId,
  buyerId,
  quantity,
  now,
  random = Math.random,
}: {
  db: Db;
  listingId: string;
  buyerId: string;
  quantity: number;
  now: Date;
  random?: () => number;
}): Outcome<ReserveError, { order: Order }> {
  const listing = db.listings.find((l) => l.id === listingId);
  const restaurant = listing && db.restaurants.find((r) => r.id === listing.restaurantId);
  if (!listing || !restaurant) return { ok: false, error: 'listing_not_found' };
  if (deriveListingStatus({ listing, now }) !== 'live') return { ok: false, error: 'not_available' };
  if (!Number.isInteger(quantity) || quantity < 1) return { ok: false, error: 'invalid_quantity' };
  if (quantity > listing.portionsLeft) return { ok: false, error: 'not_enough_portions' };

  const reservedAt = now.toISOString();
  const order: Order = {
    id: nextId('ord', db.orders),
    buyerId,
    listingId,
    quantity,
    unitPrice: listing.price,
    total: listing.price * quantity,
    feeAmount: orderFee({ restaurant, quantity, now }),
    pickupCode: generatePickupCode({ taken: new Set(db.orders.map((o) => o.pickupCode)), random }),
    status: 'reserved',
    reservedAt,
    reservedUntil: new Date(now.getTime() + HOLD_MINUTES * 60_000).toISOString(),
  };
  const updatedListing = withStatus({ ...listing, portionsLeft: listing.portionsLeft - quantity }, now);

  return {
    ok: true,
    db: { ...db, orders: [...db.orders, order], listings: replaceById(db.listings, updatedListing) },
    order,
  };
}

type PaymentError = 'order_not_found' | 'not_awaiting_payment' | 'hold_expired';

function findAwaitingPayment(
  db: Db,
  orderId: string,
  now: Date,
): { ok: true; order: UnpaidOrder } | { ok: false; error: PaymentError } {
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, error: 'order_not_found' };
  if (order.status !== 'reserved' && order.status !== 'payment_pending') return { ok: false, error: 'not_awaiting_payment' };
  if (now.getTime() >= ms(order.reservedUntil)) return { ok: false, error: 'hold_expired' };
  return { ok: true, order };
}

/** The bank confirmed: the order is paid and gets its pickup code screen. */
export function markPaid({ db, orderId, now }: { db: Db; orderId: string; now: Date }): Outcome<PaymentError> {
  const found = findAwaitingPayment(db, orderId, now);
  if (!found.ok) return found;
  const { order } = found;
  const paidAt = now.toISOString();
  const paid: Order = { ...order, status: 'paid', paidAt };

  const pending = db.payments.find((p) => p.orderId === orderId && p.status === 'pending');
  const payments: Payment[] = pending
    ? replaceById(db.payments, { ...pending, status: 'confirmed' })
    : [...db.payments, { id: nextId('pay', db.payments), orderId, amount: order.total, status: 'confirmed', createdAt: paidAt }];

  return { ok: true, db: { ...db, orders: replaceById(db.orders, paid), payments } };
}

/** The buyer says they paid but the bank hasn't confirmed yet. The hold keeps running. */
export function markPaymentPending({ db, orderId, now }: { db: Db; orderId: string; now: Date }): Outcome<PaymentError> {
  const found = findAwaitingPayment(db, orderId, now);
  if (!found.ok) return found;
  const { order } = found;
  const hasPending = db.payments.some((p) => p.orderId === orderId && p.status === 'pending');
  const payments: Payment[] = hasPending
    ? db.payments
    : [...db.payments, { id: nextId('pay', db.payments), orderId, amount: order.total, status: 'pending', createdAt: now.toISOString() }];
  return { ok: true, db: { ...db, orders: replaceById(db.orders, { ...order, status: 'payment_pending' }), payments } };
}

/** The hold ran out without payment: the order expires and its portions go back to the listing. */
export function expire({ db, orderId, now }: { db: Db; orderId: string; now: Date }): Outcome<'order_not_found' | 'not_holding'> {
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, error: 'order_not_found' };
  if (order.status !== 'reserved' && order.status !== 'payment_pending') return { ok: false, error: 'not_holding' };

  const listings = db.listings.map((l) =>
    l.id === order.listingId ? withStatus({ ...l, portionsLeft: Math.min(l.portionsTotal, l.portionsLeft + order.quantity) }, now) : l,
  );
  const payments = db.payments.map((p): Payment => (p.orderId === orderId && p.status === 'pending' ? { ...p, status: 'failed' } : p));
  return { ok: true, db: { ...db, orders: replaceById(db.orders, { ...order, status: 'expired' }), listings, payments } };
}

/** The restaurant hands the food over. Only works with the buyer's code. */
export function handOver({
  db,
  orderId,
  code,
  now,
}: {
  db: Db;
  orderId: string;
  code: string;
  now: Date;
}): Outcome<'order_not_found' | 'not_paid' | 'wrong_code'> {
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, error: 'order_not_found' };
  if (order.status !== 'paid') return { ok: false, error: 'not_paid' };
  if (normalizePickupCode(code) !== order.pickupCode) return { ok: false, error: 'wrong_code' };
  const pickedUp: Order = { ...order, status: 'picked_up', pickedUpAt: now.toISOString() };
  return { ok: true, db: { ...db, orders: replaceById(db.orders, pickedUp) } };
}

/** Freshness rating, once per picked-up order. */
export function rate({
  db,
  orderId,
  score,
  tags,
  now,
}: {
  db: Db;
  orderId: string;
  score: FreshnessScore;
  tags: RatingTag[];
  now: Date;
}): Outcome<'order_not_found' | 'not_picked_up' | 'already_rated'> {
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, error: 'order_not_found' };
  if (order.status !== 'picked_up') return { ok: false, error: 'not_picked_up' };
  if (db.ratings.some((r) => r.orderId === orderId)) return { ok: false, error: 'already_rated' };
  const rating: Rating = {
    id: nextId('rat', db.ratings),
    orderId,
    freshnessScore: score,
    tags: [...new Set(tags)],
    createdAt: now.toISOString(),
  };
  return { ok: true, db: { ...db, ratings: [...db.ratings, rating] } };
}

// ---------- notifications ----------

export type SubscriptionTarget = { kind: 'zone'; zoneId: string } | { kind: 'restaurant'; restaurantId: string };

function matchesTarget(sub: NotificationSubscription, target: SubscriptionTarget): boolean {
  switch (target.kind) {
    case 'zone':
      return sub.kind === 'zone' && sub.zoneId === target.zoneId;
    case 'restaurant':
      return sub.kind === 'restaurant' && sub.restaurantId === target.restaurantId;
    default: {
      const _exhaustive: never = target;
      return _exhaustive;
    }
  }
}

export function isSubscribed({ db, userId, target }: { db: Db; userId: string; target: SubscriptionTarget }): boolean {
  return db.subscriptions.some((s) => s.userId === userId && matchesTarget(s, target));
}

/** "Notify me" on/off. */
export function toggleSubscription({ db, userId, target }: { db: Db; userId: string; target: SubscriptionTarget }): Db {
  if (isSubscribed({ db, userId, target })) {
    return { ...db, subscriptions: db.subscriptions.filter((s) => !(s.userId === userId && matchesTarget(s, target))) };
  }
  const subscription: NotificationSubscription = { id: nextId('sub', db.subscriptions), userId, ...target };
  return { ...db, subscriptions: [...db.subscriptions, subscription] };
}

// ---------- clock ----------

/**
 * Brings the database up to `now`, like a backend cron would:
 * holds past reservedUntil expire (portions return), paid orders past pickupEnd become
 * no_show, and every listing status follows the clock. Returns the same object if nothing changed.
 */
export function refresh(db: Db, now: Date): Db {
  const t = now.getTime();
  let next = db;

  for (const order of db.orders) {
    if ((order.status === 'reserved' || order.status === 'payment_pending') && t >= ms(order.reservedUntil)) {
      const result = expire({ db: next, orderId: order.id, now });
      if (result.ok) next = result.db;
    }
  }

  const pickupEnd = new Map(next.listings.map((l) => [l.id, ms(l.pickupEnd)]));
  if (next.orders.some((o) => o.status === 'paid' && t >= (pickupEnd.get(o.listingId) ?? Infinity))) {
    next = {
      ...next,
      orders: next.orders.map((o): Order => (o.status === 'paid' && t >= (pickupEnd.get(o.listingId) ?? Infinity) ? { ...o, status: 'no_show' } : o)),
    };
  }

  const listings = next.listings.map((l) => withStatus(l, now));
  if (listings.some((l, i) => l !== next.listings[i])) next = { ...next, listings };

  return next;
}
