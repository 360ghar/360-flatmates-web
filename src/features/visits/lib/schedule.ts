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
  const noon = new Date(`${date}T12:00:00`);
  if (Number.isNaN(noon.getTime())) return null;
  if (noon.getTime() > now.getTime()) return noon.toISOString();
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  return nextHour.toDateString() === noon.toDateString() ? nextHour.toISOString() : null;
}
