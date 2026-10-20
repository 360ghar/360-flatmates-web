/**
 * The visit forms collect a date (`YYYY-MM-DD`). The backend wants an instant
 * with a UTC offset, in the future (`POST /visits` and `POST /visits/{id}/reschedule`
 * give 422 for a time with no offset). A visit is set for noon on the chosen
 * local day. When that noon has already gone (today, after midday) the next full
 * hour is used, so "today" stays a valid choice. Returns null for a malformed
 * date, a past day, or today when no full hour is left: the caller asks for
 * another date instead of booking a different day.
 */
export function visitDateToUtcIso(date: string, now: Date = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const noon = new Date(year, month - 1, day, 12);
  // `2025-02-31` rolls over to March: reject a date that does not round-trip.
  if (noon.getFullYear() !== year || noon.getMonth() !== month - 1 || noon.getDate() !== day) return null;
  if (noon.getTime() > now.getTime()) return noon.toISOString();
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  return nextHour.toDateString() === noon.toDateString() ? nextHour.toISOString() : null;
}
