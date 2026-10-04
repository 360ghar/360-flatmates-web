import type { Visit } from "@/lib/api/types";

export type VisitTab = "upcoming" | "past" | "cancelled";

/** Local-time YYYY-MM-DD for a date-ish string, or null when it does not parse. */
export function dayKeyFromValue(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return dayKey(parsed);
}

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Upcoming: not finished and today or later. Past: completed, or not finished
 * and the date has gone. Cancelled: cancelled.
 */
export function filterVisitsByTab(visits: Visit[], tab: VisitTab, today = dayKey(new Date())): Visit[] {
  switch (tab) {
    case "upcoming":
      return visits.filter((v) => {
        if (v.status === "cancelled" || v.status === "completed") return false;
        const key = dayKeyFromValue(v.scheduled_date);
        return key === null || key >= today;
      });
    case "past":
      return visits.filter((v) => {
        if (v.status === "cancelled") return false;
        if (v.status === "completed") return true;
        const key = dayKeyFromValue(v.scheduled_date);
        return key !== null && key < today;
      });
    case "cancelled":
      return visits.filter((v) => v.status === "cancelled");
  }
}

/** Visits bucketed by local day. */
export function groupVisitsByDay(visits: Visit[]): Map<string, Visit[]> {
  const map = new Map<string, Visit[]>();
  for (const visit of visits) {
    const key = dayKeyFromValue(visit.scheduled_date);
    if (!key) continue;
    map.set(key, [...(map.get(key) ?? []), visit]);
  }
  return map;
}
