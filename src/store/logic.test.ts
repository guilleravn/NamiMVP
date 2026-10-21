import { describe, expect, it } from 'vitest';
import { addMinutes, atTime } from '../lib/time';
import { DEMO_BUYER_ID } from '../mocks/people';
import { RESTAURANT_IDS } from '../mocks/restaurants';
import { createSeed } from '../mocks/seed';
import type { Db, Listing, Order } from '../types';
import { validateListingInput, type ListingInput } from './listingInput';
import {
  deriveListingStatus,
  expire,
  handOver,
  markPaid,
  markPaymentPending,
  normalizePickupCode,
  orderFee,
  postListing,
  refresh,
  reserve,
} from './logic';
import { northStar } from './selectors';

// Fixed local day so the seed (built relative to "today") is deterministic.
const TODAY = new Date(2026, 9, 21);
const at = (hhmm: string) => new Date(atTime({ day: TODAY, hhmm }));
const THREE_PM = at('15:00');

function seededDb(now = THREE_PM): Db {
  return refresh(createSeed(TODAY), now);
}

function listing(db: Db, id: string): Listing {
  const found = db.listings.find((l) => l.id === id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
}

function order(db: Db, id: string): Order {
  const found = db.orders.find((o) => o.id === id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
}

/** Reserve that must succeed; returns the new db and order. */
function mustReserve(db: Db, listingId: string, quantity: number, now = THREE_PM) {
  const result = reserve({ db, listingId, buyerId: DEMO_BUYER_ID, quantity, now, random: () => 0.5 });
  if (!result.ok) throw new Error(`reserve failed: ${result.error}`);
  return result;
}

describe('reserve', () => {
  it('decrements portionsLeft and holds the order for 10 minutes with a ÑAM-#### code', () => {
    const db = seededDb();
    expect(listing(db, 'lst-4').portionsLeft).toBe(5);

    const { db: next, order: created } = mustReserve(db, 'lst-4', 2);

    expect(listing(next, 'lst-4').portionsLeft).toBe(3);
    expect(created.status).toBe('reserved');
    expect(created.total).toBe(36);
    expect(Date.parse(created.reservedUntil) - Date.parse(created.reservedAt)).toBe(10 * 60_000);
    expect(created.pickupCode).toMatch(/^ÑAM-\d{4}$/);
  });

  it('never repeats an existing pickup code', () => {
    let db = seededDb();
    const codes = new Set<string>();
    for (let i = 0; i < 3; i += 1) {
      const result = mustReserve(db, 'lst-7', 1);
      codes.add(result.order.pickupCode);
      db = result.db;
    }
    expect(codes.size).toBe(3);
  });

  it('marks the listing sold_out when the last portion is taken', () => {
    const { db } = mustReserve(seededDb(), 'lst-1', 3);
    expect(listing(db, 'lst-1').status).toBe('sold_out');
  });

  it('rejects more portions than are left, and listings that are not live', () => {
    const db = seededDb();
    expect(reserve({ db, listingId: 'lst-1', buyerId: DEMO_BUYER_ID, quantity: 4, now: THREE_PM })).toEqual({ ok: false, error: 'not_enough_portions' });
    // Café Tunari only shows its listings after 16:00.
    expect(reserve({ db, listingId: 'lst-9', buyerId: DEMO_BUYER_ID, quantity: 1, now: THREE_PM })).toEqual({ ok: false, error: 'not_available' });
  });
});

describe('expire', () => {
  it('returns the held portions to the listing', () => {
    const { db, order: held } = mustReserve(seededDb(), 'lst-1', 3);
    expect(listing(db, 'lst-1').portionsLeft).toBe(0);

    const result = expire({ db, orderId: held.id, now: THREE_PM });
    if (!result.ok) throw new Error(result.error);

    expect(order(result.db, held.id).status).toBe('expired');
    expect(listing(result.db, 'lst-1').portionsLeft).toBe(3);
    expect(listing(result.db, 'lst-1').status).toBe('live');
  });

  it('happens automatically once the 10-minute hold runs out', () => {
    const { db, order: held } = mustReserve(seededDb(), 'lst-4', 1);
    const stillHeld = refresh(db, at('15:09'));
    expect(order(stillHeld, held.id).status).toBe('reserved');

    const after = refresh(db, at('15:10'));
    expect(order(after, held.id).status).toBe('expired');
    expect(listing(after, 'lst-4').portionsLeft).toBe(5);
  });

  it('does not touch paid orders', () => {
    const { db, order: held } = mustReserve(seededDb(), 'lst-4', 1);
    const paid = markPaid({ db, orderId: held.id, now: THREE_PM });
    if (!paid.ok) throw new Error(paid.error);
    expect(expire({ db: paid.db, orderId: held.id, now: THREE_PM })).toEqual({ ok: false, error: 'not_holding' });
  });
});

describe('payment', () => {
  it('payment_pending keeps the hold, and markPaid confirms the pending payment', () => {
    const { db, order: held } = mustReserve(seededDb(), 'lst-4', 1);
    const pending = markPaymentPending({ db, orderId: held.id, now: THREE_PM });
    if (!pending.ok) throw new Error(pending.error);
    expect(order(pending.db, held.id).status).toBe('payment_pending');
    expect(listing(pending.db, 'lst-4').portionsLeft).toBe(4);

    const paid = markPaid({ db: pending.db, orderId: held.id, now: addMinutesDate(THREE_PM, 2) });
    if (!paid.ok) throw new Error(paid.error);
    expect(order(paid.db, held.id).status).toBe('paid');
    expect(paid.db.payments.filter((p) => p.orderId === held.id).map((p) => p.status)).toEqual(['confirmed']);
  });

  it('cannot be paid after the hold expired', () => {
    const { db, order: held } = mustReserve(seededDb(), 'lst-4', 1);
    expect(markPaid({ db, orderId: held.id, now: at('15:11') })).toEqual({ ok: false, error: 'hold_expired' });
  });
});

describe('handOver', () => {
  // ÑAM-4827 is a paid silpancho order in the seed.
  const paidOrderId = () => {
    const found = seededDb().orders.find((o) => o.pickupCode === 'ÑAM-4827');
    if (!found) throw new Error('seed changed');
    return found.id;
  };

  it('rejects a wrong code and leaves the order paid', () => {
    const db = seededDb();
    const id = paidOrderId();
    expect(handOver({ db, orderId: id, code: 'ÑAM-1234', now: THREE_PM })).toEqual({ ok: false, error: 'wrong_code' });
    expect(handOver({ db, orderId: id, code: '', now: THREE_PM })).toEqual({ ok: false, error: 'wrong_code' });
    expect(order(db, id).status).toBe('paid');
  });

  it('marks the order picked_up with the matching code (full or just the digits)', () => {
    const db = seededDb();
    const id = paidOrderId();
    for (const code of ['ÑAM-4827', 'nam 4827', '4827']) {
      const result = handOver({ db, orderId: id, code, now: THREE_PM });
      if (!result.ok) throw new Error(`${code}: ${result.error}`);
      expect(order(result.db, id).status).toBe('picked_up');
    }
  });

  it('rejects orders that are not paid yet', () => {
    const { db, order: held } = mustReserve(seededDb(), 'lst-4', 1);
    expect(handOver({ db, orderId: held.id, code: held.pickupCode, now: THREE_PM })).toEqual({ ok: false, error: 'not_paid' });
  });

  it('normalizes codes', () => {
    expect(normalizePickupCode(' ñam-4827 ')).toBe('ÑAM-4827');
    expect(normalizePickupCode('XYZ-4827')).toBeNull();
    expect(normalizePickupCode('482')).toBeNull();
  });
});

describe('fees', () => {
  it('is 0 while the restaurant is inside its free first month', () => {
    const db = seededDb();
    const laEspiga = db.restaurants.find((r) => r.id === RESTAURANT_IDS.laEspiga);
    if (!laEspiga) throw new Error('seed changed');
    expect(orderFee({ restaurant: laEspiga, quantity: 3, now: THREE_PM })).toBe(0);

    const { order: bag } = mustReserve(db, 'lst-6', 2);
    expect(bag.feeAmount).toBe(0);
  });

  it('is Bs 2 per dish otherwise, including after the free month ends', () => {
    const db = seededDb();
    const { order: silpancho } = mustReserve(db, 'lst-1', 2);
    expect(silpancho.feeAmount).toBe(4);

    const laEspiga = db.restaurants.find((r) => r.id === RESTAURANT_IDS.laEspiga);
    if (!laEspiga?.feeFreeUntil) throw new Error('seed changed');
    const afterFreeMonth = new Date(Date.parse(laEspiga.feeFreeUntil) + 1);
    expect(orderFee({ restaurant: laEspiga, quantity: 3, now: afterFreeMonth })).toBe(6);
  });
});

describe('northStar', () => {
  it('counts only picked_up quantities', () => {
    const db = seededDb();
    const from = at('00:00');
    const to = at('23:59');
    // Seed today: sopa de maní ×3 and ×1 picked up; silpancho ×1 and ×2 paid but not picked up.
    expect(northStar({ db, from, to })).toBe(4);

    const { db: withReservation } = mustReserve(db, 'lst-4', 2);
    expect(northStar({ db: withReservation, from, to })).toBe(4);

    const paid = db.orders.find((o) => o.pickupCode === 'ÑAM-4831');
    if (!paid) throw new Error('seed changed');
    const handed = handOver({ db, orderId: paid.id, code: '4831', now: THREE_PM });
    if (!handed.ok) throw new Error(handed.error);
    expect(northStar({ db: handed.db, from, to })).toBe(6);
  });

  it('ignores no_show orders', () => {
    // At 17:00 silpancho's pickup window (until 16:30) is over: its paid orders become no_show.
    const db = seededDb(at('17:00'));
    expect(db.orders.filter((o) => o.status === 'no_show' && o.listingId === 'lst-1')).toHaveLength(2);
    expect(northStar({ db, from: at('00:00'), to: at('23:59') })).toBe(4);
  });
});

describe('listing status follows the clock', () => {
  it('is scheduled before visibleFrom, live after, and expired after pickupEnd', () => {
    const silpancho = listing(createSeed(TODAY), 'lst-1');
    expect(deriveListingStatus({ listing: silpancho, now: at('11:00') })).toBe('scheduled');
    expect(deriveListingStatus({ listing: silpancho, now: at('14:30') })).toBe('live');
    expect(deriveListingStatus({ listing: silpancho, now: at('16:30') })).toBe('expired');
    expect(deriveListingStatus({ listing: { ...silpancho, portionsLeft: 0 }, now: at('15:00') })).toBe('sold_out');
  });
});

describe('postListing', () => {
  const input: ListingInput = {
    format: 'dish',
    title: 'Pollo al horno',
    description: '',
    photo: 'pollo',
    portionsTotal: 4,
    preparedAt: '12:00',
    regularPrice: 30,
    price: 12,
    pickupStart: '15:30',
    pickupEnd: '17:00',
  };

  it('is visible only from the end of the restaurant rush hour', () => {
    const result = postListing({ db: seededDb(at('11:00')), restaurantId: RESTAURANT_IDS.saborValluno, input, now: at('11:00') });
    if (!result.ok) throw new Error(result.error);
    expect(result.listing.visibleFrom).toBe(atTime({ day: TODAY, hhmm: '14:30' }));
    expect(result.listing.status).toBe('scheduled');
    expect(result.listing.portionsLeft).toBe(4);
  });

  it('validates discount (30–70%), pickup window and portions', () => {
    expect(validateListingInput({ input })).toEqual({});
    expect(validateListingInput({ input: { ...input, price: 25 } }).price).toBeDefined(); // 17% off
    expect(validateListingInput({ input: { ...input, price: 8 } }).price).toBeDefined(); // 73% off
    expect(validateListingInput({ input: { ...input, price: 21 } }).price).toBeUndefined(); // exactly 30%
    expect(validateListingInput({ input: { ...input, price: 9 } }).price).toBeUndefined(); // exactly 70%
    expect(validateListingInput({ input: { ...input, pickupEnd: '15:30' } }).pickupEnd).toBeDefined();
    expect(validateListingInput({ input: { ...input, portionsTotal: 0 } }).portionsTotal).toBeDefined();
    expect(validateListingInput({ input: { ...input, title: '  ' } }).title).toBeDefined();
  });
});

function addMinutesDate(date: Date, minutes: number): Date {
  return new Date(addMinutes(date.toISOString(), minutes));
}
