import { describe, expect, it } from "vitest";
import { formatDateOnly } from "../format";

describe("formatDateOnly", () => {
  it("shows the stored calendar day whatever the time zone", () => {
    expect(formatDateOnly("2026-07-15")).toBe("15 Jul 2026");
    expect(formatDateOnly("2026-01-01")).toBe("1 Jan 2026");
  });

  it("is empty for an invalid value", () => {
    expect(formatDateOnly("soon")).toBe("");
  });
});
