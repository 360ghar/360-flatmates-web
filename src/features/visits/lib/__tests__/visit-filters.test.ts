import { describe, expect, it } from "vitest";
import type { Visit } from "@/lib/api/types";
import { filterVisitsByTab, groupVisitsByDay } from "../visit-filters";

const visit = (id: number, status: Visit["status"], scheduled_date: string) => ({ id, status, scheduled_date }) as Visit;
const visits = [
  visit(1, "confirmed", "2026-09-30T11:00:00"),
  visit(2, "requested", "2026-09-01T11:00:00"),
  visit(3, "completed", "2026-10-02T11:00:00"),
  visit(4, "cancelled", "2026-09-30T15:00:00")
];

describe("visit filters", () => {
  it("splits visits into upcoming, past and cancelled", () => {
    const ids = (tab: Parameters<typeof filterVisitsByTab>[1]) => filterVisitsByTab(visits, tab, "2026-09-25").map((v) => v.id);
    expect(ids("upcoming")).toEqual([1]);
    expect(ids("past")).toEqual([2, 3]);
    expect(ids("cancelled")).toEqual([4]);
  });

  it("groups visits by local day", () => {
    expect(groupVisitsByDay(visits).get("2026-09-30")?.map((v) => v.id)).toEqual([1, 4]);
  });
});
