// localStorage is a boundary: whatever is stored there is parsed with zod before the app
// trusts it. Each schema is checked against the hand-written domain type with `satisfies`.

import { z } from 'zod';
import type {
  Db,
  Listing,
  NotificationSubscription,
  Order,
  Payment,
  Rating,
  Restaurant,
  User,
  UserRole,
  Zone,
} from '../types';
import { PHOTO_KEYS, RATING_TAGS } from '../types';

const zone = z.object({ id: z.string(), name: z.string(), city: z.string(), lat: z.number(), lng: z.number() }) satisfies z.ZodType<Zone>;

const userRole = z.enum(['buyer', 'restaurant_owner']) satisfies z.ZodType<UserRole>;

const user = z.object({
  id: z.string(),
  role: userRole,
  fullName: z.string(),
  email: z.string(),
  zoneId: z.string(),
  isOutOfTown: z.boolean(),
}) satisfies z.ZodType<User>;

const restaurant = z.object({
  id: z.string(),
  ownerId: z.string(),
  zoneId: z.string(),
  name: z.string(),
  type: z.enum(['restaurant', 'bakery', 'cafe', 'fast_food']),
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  rushHourEndsAt: z.string(),
  feePerDish: z.number(),
  feeFreeUntil: z.string().nullable(),
  rating: z.object({ average: z.number(), count: z.number() }).nullable(),
}) satisfies z.ZodType<Restaurant>;

const listing = z.object({
  id: z.string(),
  restaurantId: z.string(),
  format: z.enum(['dish', 'surprise_bag']),
  title: z.string(),
  description: z.string(),
  photo: z.enum(PHOTO_KEYS),
  regularPrice: z.number(),
  price: z.number(),
  portionsTotal: z.number(),
  portionsLeft: z.number(),
  preparedAt: z.string(),
  visibleFrom: z.string(),
  pickupStart: z.string(),
  pickupEnd: z.string(),
  status: z.enum(['scheduled', 'live', 'sold_out', 'paused', 'expired']),
}) satisfies z.ZodType<Listing>;

const orderBase = z.object({
  id: z.string(),
  buyerId: z.string(),
  listingId: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  total: z.number(),
  feeAmount: z.number(),
  pickupCode: z.string(),
  reservedAt: z.string(),
  reservedUntil: z.string(),
});

const order = z.union([
  orderBase.extend({ status: z.enum(['reserved', 'payment_pending', 'expired', 'cancelled']) }),
  orderBase.extend({ status: z.enum(['paid', 'no_show']), paidAt: z.string() }),
  orderBase.extend({ status: z.literal('picked_up'), paidAt: z.string(), pickedUpAt: z.string() }),
]) satisfies z.ZodType<Order>;

const payment = z.object({
  id: z.string(),
  orderId: z.string(),
  amount: z.number(),
  status: z.enum(['pending', 'confirmed', 'failed', 'refunded']),
  createdAt: z.string(),
}) satisfies z.ZodType<Payment>;

const rating = z.object({
  id: z.string(),
  orderId: z.string(),
  freshnessScore: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  tags: z.array(z.enum(RATING_TAGS)),
  createdAt: z.string(),
}) satisfies z.ZodType<Rating>;

const subscription = z.union([
  z.object({ id: z.string(), userId: z.string(), kind: z.literal('zone'), zoneId: z.string() }),
  z.object({ id: z.string(), userId: z.string(), kind: z.literal('restaurant'), restaurantId: z.string() }),
]) satisfies z.ZodType<NotificationSubscription>;

const db = z.object({
  zones: z.array(zone),
  users: z.array(user),
  restaurants: z.array(restaurant),
  listings: z.array(listing),
  orders: z.array(order),
  payments: z.array(payment),
  ratings: z.array(rating),
  subscriptions: z.array(subscription),
}) satisfies z.ZodType<Db>;

const appState = z.object({
  version: z.literal(1),
  /** Local "YYYY-MM-DD" the seed was built for. A new day gets a fresh seed. */
  seedDay: z.string(),
  db,
  session: z.object({ role: userRole, userId: z.string() }).nullable(),
  dev: z.object({ clockOffsetMs: z.number(), forcePaymentPending: z.boolean() }),
});

export type AppState = z.infer<typeof appState>;
export type Session = NonNullable<AppState['session']>;
export type DevSettings = AppState['dev'];

const STORAGE_KEY = 'nami-demo-v1';

export function loadState(): AppState | null {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (text === null) return null;
    const raw: unknown = JSON.parse(text);
    const parsed = appState.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or full storage: the demo still works, it just won't survive a reload.
  }
}
