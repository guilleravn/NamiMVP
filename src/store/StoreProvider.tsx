import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { atTime, dayKey } from '../lib/time';
import { DEMO_BUYER_ID, DEMO_OWNER_ID } from '../mocks/people';
import { createSeed } from '../mocks/seed';
import type { Db, FreshnessScore, RatingTag, Restaurant, User, UserRole } from '../types';
import type { ListingInput } from './listingInput';
import * as logic from './logic';
import { loadState, saveState, type AppState, type Session } from './persistence';

/** The demo opens at 15:00: after rush hour, with live, low-stock, sold-out and scheduled listings. */
export const DEMO_START_TIME = '15:00';

function offsetTo(hhmm: string): number {
  return Date.parse(atTime({ day: new Date(), hhmm })) - Date.now();
}

function freshState(session: Session | null): AppState {
  const clockOffsetMs = offsetTo(DEMO_START_TIME);
  const now = new Date(Date.now() + clockOffsetMs);
  return {
    version: 1,
    seedDay: dayKey(new Date()),
    db: logic.refresh(createSeed(new Date()), now),
    session,
    dev: { clockOffsetMs, forcePaymentPending: false },
  };
}

function initialState(): AppState {
  const saved = loadState();
  // A demo saved on another day would be all expired: start that day fresh.
  return saved && saved.seedDay === dayKey(new Date()) ? saved : freshState(saved?.session ?? null);
}

export function userIdForRole(role: UserRole): string {
  switch (role) {
    case 'buyer':
      return DEMO_BUYER_ID;
    case 'restaurant_owner':
      return DEMO_OWNER_ID;
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

function useStoreValue() {
  const [state, setState] = useState<AppState>(initialState);
  const [realNow, setRealNow] = useState(() => Date.now());

  // Actions read and write through this ref so two actions in a row never see stale data.
  const stateRef = useRef(state);
  const commit = useCallback((next: AppState) => {
    stateRef.current = next;
    setState(next);
  }, []);
  const commitDb = useCallback((db: Db) => commit({ ...stateRef.current, db }), [commit]);
  const currentNow = useCallback(() => new Date(Date.now() + stateRef.current.dev.clockOffsetMs), []);

  useEffect(() => {
    const id = window.setInterval(() => setRealNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const now = useMemo(() => new Date(realNow + state.dev.clockOffsetMs), [realNow, state.dev.clockOffsetMs]);

  // The "cron": expire holds, mark no-shows and move listing statuses along with the clock.
  useEffect(() => {
    const refreshed = logic.refresh(stateRef.current.db, now);
    if (refreshed !== stateRef.current.db) commitDb(refreshed);
  }, [now, commitDb]);

  useEffect(() => saveState(state), [state]);

  const actions = useMemo(() => {
    const db = () => stateRef.current.db;
    const userId = () => stateRef.current.session?.userId ?? DEMO_BUYER_ID;
    /** Runs a pure store function and commits its db when it succeeds. */
    const run = <R extends { ok: true; db: Db } | { ok: false }>(result: R): R => {
      if (result.ok) commitDb(result.db);
      return result;
    };

    return {
      chooseRole(role: UserRole) {
        const current = stateRef.current.session;
        if (current?.role === role) return;
        commit({ ...stateRef.current, session: { role, userId: userIdForRole(role) } });
      },
      reserve: ({ listingId, quantity }: { listingId: string; quantity: number }) =>
        run(logic.reserve({ db: db(), listingId, quantity, buyerId: userId(), now: currentNow() })),
      markPaid: (orderId: string) => run(logic.markPaid({ db: db(), orderId, now: currentNow() })),
      markPaymentPending: (orderId: string) => run(logic.markPaymentPending({ db: db(), orderId, now: currentNow() })),
      /** The buyer confirms they got the food: same rule as the restaurant handing it over. */
      confirmPickup(orderId: string) {
        const order = db().orders.find((o) => o.id === orderId);
        return run(logic.handOver({ db: db(), orderId, code: order?.pickupCode ?? '', now: currentNow() }));
      },
      handOver: ({ orderId, code }: { orderId: string; code: string }) =>
        run(logic.handOver({ db: db(), orderId, code, now: currentNow() })),
      rate: ({ orderId, score, tags }: { orderId: string; score: FreshnessScore; tags: RatingTag[] }) =>
        run(logic.rate({ db: db(), orderId, score, tags, now: currentNow() })),
      postListing: ({ restaurantId, input }: { restaurantId: string; input: ListingInput }) =>
        run(logic.postListing({ db: db(), restaurantId, input, now: currentNow() })),
      editListing: ({ listingId, input }: { listingId: string; input: ListingInput }) =>
        run(logic.editListing({ db: db(), listingId, input, now: currentNow() })),
      pauseListing: (listingId: string) => run(logic.pauseListing({ db: db(), listingId, now: currentNow() })),
      resumeListing: (listingId: string) => run(logic.resumeListing({ db: db(), listingId, now: currentNow() })),
      toggleSubscription: (target: logic.SubscriptionTarget) =>
        commitDb(logic.toggleSubscription({ db: db(), userId: userId(), target })),

      // ---- dev menu ----
      /** Jump the fake clock to "HH:MM" today, or back to real time with null. */
      setClock(hhmm: string | null) {
        const clockOffsetMs = hhmm === null ? 0 : offsetTo(hhmm);
        commit({ ...stateRef.current, dev: { ...stateRef.current.dev, clockOffsetMs } });
      },
      advanceClock(minutes: number) {
        const dev = stateRef.current.dev;
        commit({ ...stateRef.current, dev: { ...dev, clockOffsetMs: dev.clockOffsetMs + minutes * 60_000 } });
      },
      setForcePaymentPending(forcePaymentPending: boolean) {
        commit({ ...stateRef.current, dev: { ...stateRef.current.dev, forcePaymentPending } });
      },
      /** Fresh seed and clock back to 15:00; keeps the current role. */
      resetDemo() {
        commit(freshState(stateRef.current.session));
      },
    };
  }, [commit, commitDb, currentNow]);

  const currentUser: User | null = state.session ? (state.db.users.find((u) => u.id === state.session?.userId) ?? null) : null;
  const ownRestaurant: Restaurant | null = state.db.restaurants.find((r) => r.ownerId === DEMO_OWNER_ID) ?? null;
  /** Read the latest dev flags inside timers (e.g. the fake payment delay). */
  const readDev = useCallback(() => stateRef.current.dev, []);

  return { db: state.db, now, session: state.session, dev: state.dev, currentUser, ownRestaurant, actions, readDev };
}

export type Store = ReturnType<typeof useStoreValue>;

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  return store;
}
