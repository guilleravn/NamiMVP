// Money and distance formatting for Bolivia (bolivianos, metric, comma decimals).

/** "Bs 14" or, with `cents`, "Bs 14,00". */
export function formatBs(amount: number, { cents = false }: { cents?: boolean } = {}): string {
  const value = amount.toLocaleString('es-BO', {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `Bs ${value}`;
}

/** Whole-number discount: 35 → 14 is 60. */
export function discountPercent({ regularPrice, price }: { regularPrice: number; price: number }): number {
  if (regularPrice <= 0) return 0;
  return Math.round((1 - price / regularPrice) * 100);
}

const EARTH_RADIUS_M = 6_371_000;

export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Rounded to 50 m: "300 m", "1,2 km". */
export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toLocaleString('es-BO', { maximumFractionDigits: 1 })} km`;
  return `${Math.max(50, Math.round(meters / 50) * 50)} m`;
}

/** At ~80 m per minute. */
export function walkMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / 80));
}
