import { describe, expect, it } from "vitest";
import { flatmatesProfileSchema } from "@/lib/schemas/profile";
import { profileCompletion } from "./profile-progress";

describe("profileCompletion", () => {
  it("is 100 for a completed onboarding", () => {
    expect(profileCompletion(flatmatesProfileSchema.parse({ id: 1, onboarding_completed: true }))).toBe(100);
  });

  it("is 0 for an empty profile and grows with each answer", () => {
    const empty = flatmatesProfileSchema.parse({ id: 1, full_name: null, mode: null });
    expect(profileCompletion(empty)).toBe(0);
    const some = flatmatesProfileSchema.parse({ id: 1, full_name: "Aditi", city: "Pune", mode: "seeker" });
    expect(profileCompletion(some)).toBeGreaterThan(0);
    expect(profileCompletion(some)).toBeLessThan(100);
  });
});
