// Domain types. They mirror docs/nami-erd.dbml (ids are strings and times are ISO strings
// so the whole database serializes to localStorage as-is).

export interface Zone {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
}

export type UserRole = 'buyer' | 'restaurant_owner';

export interface User {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  zoneId: string;
  /** Out-of-town student: the main segment. */
  isOutOfTown: boolean;
}

export type RestaurantType = 'restaurant' | 'bakery' | 'cafe' | 'fast_food';

/** Freshness rating collected before the demo. Ratings sent during the demo are added on top. */
export interface RatingSummary {
  average: number;
  count: number;
}

export interface Restaurant {
  id: string;
  ownerId: string;
  zoneId: string;
  name: string;
  type: RestaurantType;
  address: string;
  lat: number;
  lng: number;
  /** "HH:MM". Listings are only shown from this time on, so regulars don't wait for the discount. */
  rushHourEndsAt: string;
  /** Bs per dish sold. */
  feePerDish: number;
  /** ISO. No fee is charged before this moment (first month free). */
  feeFreeUntil: string | null;
  /** null = new restaurant, no ratings yet. */
  rating: RatingSummary | null;
}

export type ListingFormat = 'dish' | 'surprise_bag';

export type ListingStatus = 'scheduled' | 'live' | 'sold_out' | 'paused' | 'expired';

export const PHOTO_KEYS = [
  'silpancho',
  'pique',
  'sopa-de-mani',
  'pan',
  'chicharron',
  'pollo',
  'saltenas',
  'masitas',
  'torta',
  'almuerzo',
] as const;

export type PhotoKey = (typeof PHOTO_KEYS)[number];

export interface Listing {
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
  /** All times are ISO strings. */
  preparedAt: string;
  visibleFrom: string;
  pickupStart: string;
  pickupEnd: string;
  /** Kept in sync with the clock by `refresh()`; see `deriveListingStatus`. */
  status: ListingStatus;
}

interface OrderBase {
  id: string;
  buyerId: string;
  listingId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  /** feePerDish × quantity, or 0 inside the restaurant's free month. */
  feeAmount: number;
  /** e.g. "ÑAM-4827" */
  pickupCode: string;
  reservedAt: string;
  /** reservedAt + 10 min. */
  reservedUntil: string;
}

export type UnpaidOrder = OrderBase & { status: 'reserved' | 'payment_pending' | 'expired' | 'cancelled' };
export type PaidOrder = OrderBase & { status: 'paid' | 'no_show'; paidAt: string };
export type PickedUpOrder = OrderBase & { status: 'picked_up'; paidAt: string; pickedUpAt: string };

/** paidAt / pickedUpAt exist exactly on the statuses that have them. */
export type Order = UnpaidOrder | PaidOrder | PickedUpOrder;

export type OrderStatus = Order['status'];

export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
}

export const RATING_TAGS = ['was_warm', 'good_portion', 'same_as_in_store'] as const;

export type RatingTag = (typeof RATING_TAGS)[number];

export type FreshnessScore = 1 | 2 | 3 | 4 | 5;

export interface Rating {
  id: string;
  orderId: string;
  freshnessScore: FreshnessScore;
  tags: RatingTag[];
  createdAt: string;
}

/** "Notify me": either for a whole zone (empty state) or for one restaurant (sold-out card). */
export type NotificationSubscription =
  | { id: string; userId: string; kind: 'zone'; zoneId: string }
  | { id: string; userId: string; kind: 'restaurant'; restaurantId: string };

/** The whole fake backend: one serializable object. */
export interface Db {
  zones: Zone[];
  users: User[];
  restaurants: Restaurant[];
  listings: Listing[];
  orders: Order[];
  payments: Payment[];
  ratings: Rating[];
  subscriptions: NotificationSubscription[];
}
