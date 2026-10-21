import { describe, expect, it } from "vitest";
import { optionalNumberValue } from "../format";

describe("optionalNumberValue", () => {
  it("reads input strings", () => {
    expect(optionalNumberValue("26")).toBe(26);
    expect(optionalNumberValue("  ")).toBeUndefined();
    expect(optionalNumberValue("abc")).toBeUndefined();
  });

  // Regression: Edit profile crashed ("raw.trim is not a function") when the
  // saved profile already had a numeric age or budget.
  it("accepts a numeric default value", () => {
    expect(optionalNumberValue(26)).toBe(26);
    expect(optionalNumberValue(Number.NaN)).toBeUndefined();
    expect(optionalNumberValue(undefined)).toBeUndefined();
  });
});
