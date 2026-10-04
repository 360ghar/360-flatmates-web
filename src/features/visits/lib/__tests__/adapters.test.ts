import { describe, it, expect } from "vitest";
import { visitToVisitCardProps } from "../adapters";
import type { Visit as ApiVisit } from "@/lib/api/types";

describe("visitToVisitCardProps", () => {
  it("converts number ID to string", () => {
    const visit = {
      id: 10,
      property_id: 301,
      visit_context: "property_tour",
      scheduled_date: "2026-06-01",
      status: "confirmed"
    } as ApiVisit;

    const result = visitToVisitCardProps(visit);
    expect(result.id).toBe("10");
    expect(typeof result.id).toBe("string");
  });

  it("maps status correctly", () => {
    const confirmed = { id: 1, property_id: 1, visit_context: "property_tour", scheduled_date: "2026-06-01", status: "confirmed" } as ApiVisit;
    expect(visitToVisitCardProps(confirmed).status).toBe("confirmed");

    const requested = { id: 2, property_id: 1, visit_context: "property_tour", scheduled_date: "2026-06-01", status: "requested" } as ApiVisit;
    expect(visitToVisitCardProps(requested).status).toBe("pending");

    const cancelled = { id: 3, property_id: 1, visit_context: "property_tour", scheduled_date: "2026-06-01", status: "cancelled" } as ApiVisit;
    expect(visitToVisitCardProps(cancelled).status).toBe("cancelled");

    const completed = { id: 4, property_id: 1, visit_context: "property_tour", scheduled_date: "2026-06-01", status: "completed" } as ApiVisit;
    expect(visitToVisitCardProps(completed).status).toBe("completed");

    const reschedule = { id: 5, property_id: 1, visit_context: "property_tour", scheduled_date: "2026-06-01", status: "reschedule_suggested" } as ApiVisit;
    expect(visitToVisitCardProps(reschedule).status).toBe("pending");
  });

  it("maps visit_context to type", () => {
    const tour = { id: 1, property_id: 1, visit_context: "property_tour", scheduled_date: "2026-06-01", status: "confirmed" } as ApiVisit;
    expect(visitToVisitCardProps(tour).type).toBe("Property tour");

    const meet = { id: 2, property_id: 1, visit_context: "flatmate_meet", scheduled_date: "2026-06-01", status: "confirmed" } as ApiVisit;
    expect(visitToVisitCardProps(meet).type).toBe("Flatmate meet");
  });
});
