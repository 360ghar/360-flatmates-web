import { describe, expect, it } from "vitest";
import {
  calculateCompatibility,
  getCompatibilityColor,
  rankPeersByCompatibility
} from "@/lib/compatibility";
import type { CompatibilityProfile } from "@/lib/compatibility";

const baseProfile = {
  id: 1,
  sleep_schedule: "early_bird",
  cleanliness: "tidy",
  food_habits: "vegetarian",
  smoking_drinking: "neither",
  guests_policy: "occasional_ok",
  work_style: "wfh"
} satisfies CompatibilityProfile;

describe("compatibility engine", () => {
  it("scores an exact lifestyle match at 100 with green status", () => {
    const result = calculateCompatibility(baseProfile, {
      ...baseProfile,
      id: 2
    });

    expect(result.overall_percentage).toBe(100);
    expect(result.color).toBe("green");
    expect(result.dimensions).toHaveLength(6);
    expect(result.dimensions.every((dimension) => dimension.match)).toBe(true);
  });

  it("weights strict lifestyle gaps into a red compatibility score", () => {
    const result = calculateCompatibility(baseProfile, {
      id: 3,
      sleep_schedule: "night_owl",
      cleanliness: "minimal",
      food_habits: "non_vegetarian",
      smoking_drinking: "smoke_outside",
      guests_policy: "open_house",
      work_style: "office"
    });

    expect(result.overall_percentage).toBe(32);
    expect(result.color).toBe("red");
    expect(result.dimensions.find((item) => item.name === "food_habits")?.score).toBe(0);
    expect(result.summary).toContain("Food Habits: preference gap");
  });

  it("ranks peers by calculated compatibility without mutating input order", () => {
    const peers = [
      {
        id: 4,
        full_name: "Low Match",
        mode: "room_poster",
        sleep_schedule: "night_owl",
        cleanliness: "minimal",
        food_habits: "non_vegetarian",
        smoking_drinking: "smoke_outside",
        guests_policy: "open_house",
        work_style: "office"
      },
      {
        id: 5,
        full_name: "High Match",
        mode: "co_hunter",
        sleep_schedule: "early_bird",
        cleanliness: "tidy",
        food_habits: "vegetarian",
        smoking_drinking: "neither",
        guests_policy: "occasional_ok",
        work_style: "wfh"
      }
    ] as const;

    const ranked = rankPeersByCompatibility(baseProfile, peers);

    expect(ranked.map((peer) => peer.id)).toEqual([5, 4]);
    expect(peers.map((peer) => peer.id)).toEqual([4, 5]);
    expect(ranked[0]?.match_percentage).toBe(100);
  });

  it("uses DESIGN.md compatibility thresholds", () => {
    expect(getCompatibilityColor(70)).toBe("green");
    expect(getCompatibilityColor(40)).toBe("amber");
    expect(getCompatibilityColor(39)).toBe("red");
  });
});
