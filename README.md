# Ñami — MVP (frontend only)

Restaurants in Cochabamba, Bolivia sell the food they have left over at the end of the day, still in good condition, at 50–70% off. Buyers (starting with students at UCB) reserve a dish, pay with a QR code and pick it up at the restaurant with a code.

This is a **clickable demo with no backend**: all data is mock data in TypeScript, state lives in React and is saved to `localStorage`, and payments are simulated. The app UI is in Spanish; code and docs are in English.

Design references live in [`docs/`](docs/): the v2 mockups, the ERD (`nami-erd.dbml`) and the business idea.

## Run it

Requires Node 20.19+.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Type-check, then build the static site into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit tests for the store (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |

### Deploy (Vercel)

Import the repo in Vercel; it detects Vite (build `npm run build`, output `dist`). [`vercel.json`](vercel.json) rewrites every path to `index.html` so deep links such as `/buyer/orders` work on reload.

## Demo flows

The demo opens at a **fake 15:00** (after lunch rush), when there are live, low-stock, sold-out and scheduled listings. The dark strip at the top shows the demo time and role and opens the **Menú demo**.

### Buyer: “Tengo hambre”

1. **Home** (`/buyer`): today's dishes near UCB Cochabamba. Filter *Todo · Platos · Bolsas*. Sold-out dishes stay visible, greyed, with *Avisarme*. La Espiga is new and shows *Nuevo · sin calificaciones*.
2. Tap **Reservar** on *Silpancho* → **detail** (`/buyer/listing/:id`): prepared time, pickup window, distance, portions left, quantity stepper.
3. **Reservar · Bs X** → **Pay with QR** (`/buyer/order/:id/pay`): the portion is held for 10 minutes (live countdown).
4. **Ya pagué** → after a short fake bank delay → **pickup code** (`/buyer/order/:id`), e.g. `ÑAM-4827`.
5. **Ya lo retiré** → **rate freshness** (`/buyer/order/:id/rate`): 1–5 plus optional tags.
6. **Pedidos** tab (`/buyer/orders`): active and past orders with status; past ones can still be rated.

### Restaurant: “Tengo un restaurante”

You are the owner of **Sabor Valluno**.

1. **Hoy** (`/restaurant`): today's listings with status (*En vivo*, *Agotado*, *Programado*, *Pausado*), reserved count, **Editar** and **Pausar/Reanudar**.
2. **Publicar más sobras** (`/restaurant/new`): dish or surprise bag, photo, portions, prices with a live “−60%” hint, pickup window. Ñami price must be 30–70% below the regular price; pickup end must be after the start.
3. **Pedidos** (`/restaurant/orders`): *Hoy recuperaste Bs X* (sales minus Ñami fee). Under *Por entregar*, tap **Entregar** and type the buyer's code: try `1234` (rejected), then `4827` or `ÑAM-4827` (accepted).
4. **Estadísticas** (`/restaurant/stats`): last 7 days. Dishes rescued (the North Star), money recovered, sell-through.

## Menú demo

| Control | Use it to show |
| --- | --- |
| **Ver como** Comprador / Restaurante | Jump between both sides mid-demo. |
| **Reloj falso** 11:00 | Empty state: nothing posted yet, with *Avisarme cuando publiquen*. |
| **Reloj falso** 15:00 | The normal demo: everything live. |
| **Reloj falso** 20:00 | End of day: pickups are over; paid orders not picked up become *No retirado*. |
| **+10 min** | Expire an unpaid reservation: the order expires and its portions go back to the listing. |
| **Hora real** | Use the device clock. |
| **Forzar “pago pendiente”** | With it on, *Ya pagué* shows *Todavía no vemos tu pago* (portion still held). Turn it off and tap *Revisar de nuevo* to confirm. |
| **Reiniciar datos de demo** | Back to the seed data and 15:00. |

Data also resets automatically on a new calendar day, since the seed is built relative to today.

## How it works

```
src/
  types.ts              Domain types mirroring docs/nami-erd.dbml
  tokens.ts             Design tokens: primitives → semantic tokens (by role)
  mocks/                Zone, users, 5 restaurants, ~10 listings today + past week, past orders
  store/
    logic.ts            The fake backend: pure functions (db, args) → new db | typed error
    selectors.ts        Read-only views: buyer feed, day summary, North Star, weekly stats
    listingInput.ts     Post/edit form input and its validation
    persistence.ts      localStorage, parsed with zod before it is trusted
    StoreProvider.tsx   React state, fake clock, persistence, actions for the screens
    logic.test.ts       Vitest
  components/           Small UI kit: Button, Badge, ListingCard, Stepper, QrCode, DevMenu…
  routes/buyer/         Home, ListingDetail, Pay, PickupCode, Rate, MyOrders
  routes/restaurant/    TodayListings, ListingForm, RestaurantOrders, Stats
```

**Store rules** (all in `store/logic.ts`):

- `reserve` holds portions for 10 minutes (`reservedUntil`), decrements `portionsLeft` and creates a unique `ÑAM-####` code.
- `markPaid`, `markPaymentPending`, and `expire` (which gives the portions back).
- `handOver(orderId, code)` sets `picked_up` only if the code matches (`ÑAM-4827`, `NAM 4827` or `4827`).
- `rate`, `postListing`, `editListing`, `pauseListing` / `resumeListing`, `toggleSubscription`.
- `refresh(db, now)` acts like a backend cron, and runs on every clock tick:
  - expired holds are released;
  - paid orders past `pickupEnd` become `no_show`;
  - listing status follows the clock: `scheduled` before `visibleFrom`, then `live`, `sold_out` at 0 portions, `expired` after `pickupEnd`. `paused` is the only status set by hand.
- `visibleFrom` is the restaurant's `rushHourEndsAt`, so regulars don't wait for the discount.
- Fee is Bs 2 per dish sold, or 0 inside the restaurant's free first month (La Espiga in the seed).
- **North Star**: dishes rescued = sum of `quantity` of `picked_up` orders.

**TypeScript:** strict mode with `noUncheckedIndexedAccess`. Statuses are discriminated unions handled with exhaustive switches (`const _exhaustive: never`). `Order` is a union, so `paidAt` / `pickedUpAt` exist exactly on the statuses that have them. There is no `any` and no type casts.

### Design and accessibility rules

- **Tokens:** Tailwind exposes only semantic tokens (`bg-action`, `text-secondary`, `bg-status-fresh`…). The default palette, spacing and type scale are removed, so raw hex values can't be used in components.
- **Color:** orange is only for actions. Status colors match their meaning (green fresh, amber heads-up, stone unavailable), and every status also has text or an icon.
- **Contrast:** text is at least 4.5:1 and input borders at least 3:1.
- **Sizing:** touch targets are at least 44 px. Spacing uses a 4 px scale and type uses 5 sizes (12/14/16/20/28). Prices use tabular numbers.
- **Focus:** every interactive element has a visible 3 px focus ring in the action color. After navigation, focus moves to the new page's `<h1>`.
- **Live regions:** `aria-live` covers the countdown (announced once per minute, not every second), the payment status, the filter results and the hand-over result.
- **Fonts:** Fraunces for the logo and display, Figtree for the UI.

### Photos

Listings use bundled photos from `public/img/` by name: `silpancho.jpg`, `pique.jpg`, `sopa-de-mani.jpg`, `pan.jpg`, `chicharron.jpg`, `pollo.jpg`, `saltenas.jpg`, `masitas.jpg`, `torta.jpg`, `almuerzo.jpg`. Until a file exists, an emoji placeholder is shown. Drop the real photo in with that name and it is picked up automatically.

## Not in this MVP

No real login, payments, notifications, map or delivery. *Avisarme* stores a subscription but nothing is sent. Refunds for orders that were paid but not picked up are still an open question.
