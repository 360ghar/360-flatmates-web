import { describe, expect, it } from "vitest";
import { visitDateToUtcIso } from "@/features/visits/lib/schedule";

const at = (local: string) => new Date(local);

describe("visitDateToUtcIso", () => {
  it("books noon on a future day", () => {
    expect(visitDateToUtcIso("2026-10-22", at("2026-10-21T09:00:00"))).toBe(
      new Date("2026-10-22T12:00:00").toISOString()
    );
  });

  it("books the next full hour today after midday", () => {
    expect(visitDateToUtcIso("2026-10-21", at("2026-10-21T15:20:00"))).toBe(
      new Date("2026-10-21T16:00:00").toISOString()
    );
  });

  it("refuses today when the next hour is tomorrow", () => {
    expect(visitDateToUtcIso("2026-10-21", at("2026-10-21T23:10:00"))).toBeNull();
  });

  it("refuses a past day and a malformed date", () => {
    expect(visitDateToUtcIso("2026-10-20", at("2026-10-21T09:00:00"))).toBeNull();
    expect(visitDateToUtcIso("2026-10-22T10:00", at("2026-10-21T09:00:00"))).toBeNull();
    expect(visitDateToUtcIso("2026-13-40", at("2026-10-21T09:00:00"))).toBeNull();
  });
});
