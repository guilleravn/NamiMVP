// Time helpers. Everything runs in the browser's local time (Cochabamba for real users).

const MINUTE = 60_000;

/** ISO string for `hhmm` ("14:30") on the same local day as `day`. */
export function atTime({ day, hhmm }: { day: Date; hhmm: string }): string {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export function addMinutes(iso: string, minutes: number): string {
  return new Date(Date.parse(iso) + minutes * MINUTE).toISOString();
}

export function addDays(day: Date, days: number): Date {
  const d = new Date(day);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfDay(day: Date): Date {
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** "YYYY-MM-DD" in local time. */
export function dayKey(day: Date): string {
  const y = day.getFullYear();
  const m = String(day.getMonth() + 1).padStart(2, '0');
  const d = String(day.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isSameDay(iso: string, day: Date): boolean {
  return dayKey(new Date(iso)) === dayKey(day);
}

/** "HH:MM", 24 h. */
export function toHHMM(source: string | Date): string {
  const d = typeof source === 'string' ? new Date(source) : source;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function isBefore(a: string, b: Date): boolean {
  return Date.parse(a) < b.getTime();
}

/** "09:42" from a duration in ms (never negative). */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const weekdayFormat = new Intl.DateTimeFormat('es-BO', { weekday: 'short', day: 'numeric' });

/** "hoy", "ayer" or "lun 20". */
export function relativeDay({ iso, now }: { iso: string; now: Date }): string {
  if (isSameDay(iso, now)) return 'hoy';
  if (isSameDay(iso, addDays(now, -1))) return 'ayer';
  return weekdayFormat.format(new Date(iso));
}
