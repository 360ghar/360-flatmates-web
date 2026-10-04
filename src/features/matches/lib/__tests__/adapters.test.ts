import { describe, it, expect } from "vitest";
import { profileToProfileGridCardProps } from "../adapters";
import type { FlatmatesPeer } from "@/lib/api/types";

describe("profileToProfileGridCardProps", () => {
  it("converts number ID to string", () => {
    const profile = {
      id: 202,
      full_name: "Aditi Rao",
      mode: "open_to_both",
      city: "Bangalore",
      locality: "HSR Layout",
      age: 27,
      profession: "Designer",
      profile_image_url: "https://example.com/photo.jpg",
      match_percentage: 85
    } as FlatmatesPeer;

    const result = profileToProfileGridCardProps(profile);
    expect(result.id).toBe("202");
    expect(typeof result.id).toBe("string");
  });

  it("combines locality and city into location", () => {
    const profile = {
      id: 1,
      full_name: "Test User",
      mode: "co_hunter",
      city: "Bangalore",
      locality: "HSR Layout"
    } as FlatmatesPeer;

    const result = profileToProfileGridCardProps(profile);
    expect(result.location).toBe("HSR Layout, Bangalore");
  });

  it("uses match_percentage for matchScore", () => {
    const profile = {
      id: 1,
      full_name: "Test",
      mode: "co_hunter",
      match_percentage: 73
    } as FlatmatesPeer;

    const result = profileToProfileGridCardProps(profile);
    expect(result.matchScore).toBe(73);
  });
});
