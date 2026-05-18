import { create } from "zustand";

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
  setCenter: (center: MapViewport) => void;
  setZoom: (zoom: number) => void;
  setSelectedPin: (id: number) => void;
  clearSelectedPin: () => void;
  setFilters: (filters: MapFilters) => void;
  clearFilters: () => void;
  setBounds: (bounds: MapBounds) => void;
  clearBounds: () => void;
}

export const DEFAULT_CENTER: MapViewport = { lat: 28.6139, lng: 77.209 }; // New Delhi
const DEFAULT_ZOOM = 12;
const EMPTY_FILTERS: MapFilters = {};

export const useMapStore = create<MapStoreState>()((set) => ({
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
  selectedPinId: null,
  filters: { ...EMPTY_FILTERS },
  bounds: null,

  setCenter: (center) =>
    set((state) => (state.center.lat === center.lat && state.center.lng === center.lng ? state : { center })),
  setZoom: (zoom) =>
    set((state) => (state.zoom === zoom ? state : { zoom })),

  setSelectedPin: (id) => set({ selectedPinId: id }),
  clearSelectedPin: () => set({ selectedPinId: null }),

  setFilters: (filters) =>
    set((state) => {
      const next = { ...filters };
      if (JSON.stringify(next) === JSON.stringify(state.filters)) return state;
      return { filters: next };
    }),
  clearFilters: () =>
    set((state) => {
      if (JSON.stringify(state.filters) === JSON.stringify(EMPTY_FILTERS)) return state;
      return { filters: { ...EMPTY_FILTERS } };
    }),

  setBounds: (bounds) =>
    set((state) => {
      if (!state.bounds) return { bounds };
      if (
        state.bounds.north === bounds.north &&
        state.bounds.south === bounds.south &&
        state.bounds.east === bounds.east &&
        state.bounds.west === bounds.west
      ) return state;
      return { bounds };
    }),
  clearBounds: () => set({ bounds: null })
}));
