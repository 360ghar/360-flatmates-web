import { createStore } from "zustand/vanilla";

export interface MapViewport {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapFilters {
  propertyType?: string[];
  priceMin?: number;
  priceMax?: number;
}

export interface MapStoreState {
  center: MapViewport;
  zoom: number;
  selectedPinId: number | null;
  filters: MapFilters;
  bounds: MapBounds | null;
  /** True once the Explore page has seeded the viewport from the user's city. */
  hasSeededCenter: boolean;
  setCenter: (center: MapViewport) => void;
  setZoom: (zoom: number) => void;
  setSelectedPin: (id: number) => void;
  clearSelectedPin: () => void;
  setFilters: (filters: MapFilters) => void;
  clearFilters: () => void;
  setBounds: (bounds: MapBounds) => void;
  clearBounds: () => void;
  /** Mark the center as seeded so we stop overwriting the user's pan/zoom. */
  markCenterSeeded: () => void;
}

export const DEFAULT_CENTER: MapViewport = { lat: 28.4595, lng: 77.0266 }; // Gurgaon (primary market)
const DEFAULT_ZOOM = 12;
const EMPTY_FILTERS: MapFilters = {};

/**
 * Compare two MapFilters objects without JSON.stringify.
 * NOTE (F10 #29): this comparison is correct for the current MapFilters
 * shape. It short-circuits on identity, then on price, then on propertyType
 * element-wise. If the filter shape gains nested objects in the future,
 * this needs to grow accordingly.
 */
function mapFiltersEqual(a: MapFilters, b: MapFilters): boolean {
  if (a.priceMin !== b.priceMin || a.priceMax !== b.priceMax) return false;
  const aTypes = a.propertyType;
  const bTypes = b.propertyType;
  if (aTypes === bTypes) return true;
  if (!aTypes || !bTypes || aTypes.length !== bTypes.length) return false;
  return aTypes.every((v, i) => v === bTypes[i]);
}

export const mapStore = createStore<MapStoreState>()((set) => ({
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
  selectedPinId: null,
  filters: { ...EMPTY_FILTERS },
  bounds: null,
  hasSeededCenter: false,

  setCenter: (center) =>
    set((state) => (state.center.lat === center.lat && state.center.lng === center.lng ? state : { center })),
  setZoom: (zoom) =>
    set((state) => (state.zoom === zoom ? state : { zoom })),

  setSelectedPin: (id) => set({ selectedPinId: id }),
  clearSelectedPin: () => set({ selectedPinId: null }),

  setFilters: (filters) =>
    set((state) => {
      if (mapFiltersEqual(filters, state.filters)) return state;
      return { filters: { ...filters } };
    }),
  clearFilters: () =>
    set((state) => {
      if (mapFiltersEqual(state.filters, EMPTY_FILTERS)) return state;
      return { filters: { ...EMPTY_FILTERS } };
    }),

  setBounds: (bounds) =>
    set((state) => {
      // Mirror `setCenter`'s early-return: skip the update when the new
      // bounds are identical to the current ones. This prevents re-renders
      // fired by pointer-move events on the map that don't actually change
      // the visible region.
      if (
        state.bounds &&
        state.bounds.north === bounds.north &&
        state.bounds.south === bounds.south &&
        state.bounds.east === bounds.east &&
        state.bounds.west === bounds.west
      ) return state;
      return { bounds };
    }),
  clearBounds: () => set({ bounds: null }),
  markCenterSeeded: () => set({ hasSeededCenter: true })
}));
