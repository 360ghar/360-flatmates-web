import { describe, it, expect, beforeEach } from "vitest";
import { mapStore } from "../map-store";

describe("mapStore", () => {
  beforeEach(() => {
    mapStore.setState(mapStore.getInitialState());
  });

  it("should have correct initial state", () => {
    const state = mapStore.getState();
    expect(state.center).toEqual({ lat: 28.6139, lng: 77.209 });
    expect(state.zoom).toBe(12);
    expect(state.selectedPinId).toBeNull();
    expect(state.filters).toEqual({});
    expect(state.bounds).toBeNull();
  });

  it("setCenter updates center coordinates", () => {
    mapStore.getState().setCenter({ lat: 19.076, lng: 72.8777 });
    expect(mapStore.getState().center).toEqual({ lat: 19.076, lng: 72.8777 });
  });

  it("setZoom updates zoom level", () => {
    mapStore.getState().setZoom(15);
    expect(mapStore.getState().zoom).toBe(15);
  });

  it("setSelectedPin sets selectedPinId", () => {
    mapStore.getState().setSelectedPin(99);
    expect(mapStore.getState().selectedPinId).toBe(99);
  });

  it("clearSelectedPin sets selectedPinId to null", () => {
    mapStore.getState().setSelectedPin(99);
    mapStore.getState().clearSelectedPin();
    expect(mapStore.getState().selectedPinId).toBeNull();
  });

  it("setFilters updates filters", () => {
    mapStore.getState().setFilters({ propertyType: ["apartment"], priceMin: 5000 });
    const filters = mapStore.getState().filters;
    expect(filters.propertyType).toEqual(["apartment"]);
    expect(filters.priceMin).toBe(5000);
  });

  it("clearFilters resets filters to empty", () => {
    mapStore.getState().setFilters({ propertyType: ["house"], priceMax: 20000 });
    mapStore.getState().clearFilters();
    expect(mapStore.getState().filters).toEqual({});
  });

  it("setBounds updates bounds", () => {
    const bounds = { north: 29, south: 28, east: 78, west: 76 };
    mapStore.getState().setBounds(bounds);
    expect(mapStore.getState().bounds).toEqual(bounds);
  });

  it("clearBounds sets bounds to null", () => {
    mapStore.getState().setBounds({ north: 29, south: 28, east: 78, west: 76 });
    mapStore.getState().clearBounds();
    expect(mapStore.getState().bounds).toBeNull();
  });
});
