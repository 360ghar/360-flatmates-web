import { describe, expect, it } from "vitest";
import { readEnum, readEnumList } from "../schema";

const LEVELS = ["furnished", "semi_furnished", "unfurnished"] as const;

describe("readEnum", () => {
  it("returns a known value and null for anything else", () => {
    expect(readEnum(LEVELS, "furnished")).toBe("furnished");
    expect(readEnum(LEVELS, "luxury")).toBeNull();
    expect(readEnum(LEVELS, null)).toBeNull();
    expect(readEnum(LEVELS, 3)).toBeNull();
  });
});

describe("readEnumList", () => {
  it("keeps the known values in order and drops the rest", () => {
    expect(readEnumList(LEVELS, ["unfurnished", "luxury", "furnished"])).toEqual(["unfurnished", "furnished"]);
    expect(readEnumList(LEVELS, ["luxury"])).toEqual([]);
  });
});
