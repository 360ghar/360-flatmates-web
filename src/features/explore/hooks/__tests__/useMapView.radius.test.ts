import { describe, expect, it } from "vitest";
import { clampLat, radiusForZoom, wrapLng } from "@/features/explore/hooks/useMapView";

// W6 regression: radius follows the zoom level instead of a fixed 10 km.
describe("radiusForZoom", () => {
  it("shrinks as the map zooms in and stays within 1..100 km", () => {
    expect(radiusForZoom(10, 28.6)).toBeGreaterThan(radiusForZoom(14, 28.6));
    expect(radiusForZoom(3, 28.6)).toBe(100);
    expect(radiusForZoom(19, 28.6)).toBe(1);
    expect(radiusForZoom(undefined)).toBe(10);
  });
});

// The backend answers 422 outside lat -90..90 and lng -180..180.
describe("map centre in the backend range", () => {
  it("wraps a longitude past the date line and keeps one inside the range", () => {
    expect(wrapLng(77.59)).toBe(77.59);
    expect(wrapLng(190)).toBeCloseTo(-170);
    expect(wrapLng(-190)).toBeCloseTo(170);
    expect(wrapLng(540)).toBeCloseTo(-180);
    expect(wrapLng(180)).toBe(180);
  });

  it("clamps a latitude", () => {
    expect(clampLat(95)).toBe(90);
    expect(clampLat(-95)).toBe(-90);
    expect(clampLat(12.9)).toBe(12.9);
  });
});
