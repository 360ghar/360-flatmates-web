import { describe, expect, it } from "vitest";
import { radiusForZoom } from "@/features/explore/hooks/useMapView";

// W6 regression: radius follows the zoom level instead of a fixed 10 km.
describe("radiusForZoom", () => {
  it("shrinks as the map zooms in and stays within 1..50 km", () => {
    expect(radiusForZoom(10, 28.6)).toBeGreaterThan(radiusForZoom(14, 28.6));
    expect(radiusForZoom(3, 28.6)).toBe(50);
    expect(radiusForZoom(19, 28.6)).toBe(1);
    expect(radiusForZoom(undefined)).toBe(10);
  });
});
