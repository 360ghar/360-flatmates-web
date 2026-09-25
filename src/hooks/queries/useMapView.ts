import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { MapViewResponse, MapViewFilters, MapPin, Property, PropertyCursorPage } from "@/lib/api/types";
import type { QueryValue } from "@/lib/api/client";

function propertyToPin(p: Property): MapPin {
  return {
    id: p.id,
    lat: p.latitude ?? 0,
    lng: p.longitude ?? 0,
    title: p.title,
    locality: p.locality,
    monthly_rent: p.monthly_rent,
    main_image_url: p.main_image_url,
    sharing_type: p.sharing_type,
    is_available: p.is_available,
  };
}

const EARTH_CIRCUMFERENCE_KM = 40_075;
const ASSUMED_VIEWPORT_TILES = 4; // ~1000 px wide map at 256 px tiles

/** Search radius (km) that covers roughly the visible map at a zoom level. */
export function radiusForZoom(zoom: number | undefined, lat = 20): number {
  if (zoom === undefined) return 10;
  const widthKm =
    (EARTH_CIRCUMFERENCE_KM * Math.cos((lat * Math.PI) / 180) * ASSUMED_VIEWPORT_TILES) / 2 ** zoom;
  return Math.min(50, Math.max(1, Math.round(widthKm / 2)));
}

export function mapViewOptions(filters: MapViewFilters) {
  return queryOptions({
    queryKey: ["map", filters],
    // Pass the per-query AbortSignal so stale viewport fetches (rapid pan/zoom)
    // are cancelled instead of racing to resolve over the freshest request.
    queryFn: async ({ signal }) => {
      const response = await apiClient.request<PropertyCursorPage>({
        method: "GET",
        path: "/properties",
        auth: false,
        signal,
        query: {
          lat: filters.lat,
          lng: filters.lng,
          radius: filters.radius ?? radiusForZoom(filters.zoom_level, filters.lat),
          property_type: filters.property_type,
          move_in: filters.move_in?.[0],
          price_min: filters.price_min,
          price_max: filters.price_max,
          sharing_type: filters.sharing_type?.[0],
          gender_preference: filters.gender_preference?.[0],
          amenities: filters.amenities,
          furnishing: filters.furnishing,
          kitchen_type: filters.kitchen_type,
          ventilation_type: filters.ventilation_type,
          windows_min: filters.windows_min,
          has_lift: filters.has_lift,
          limit: 100,
        } as Record<string, QueryValue>,
      });

      const pins: MapPin[] = (response.items ?? [])
        .filter((p) => p.latitude != null && p.longitude != null)
        .map(propertyToPin);

      return {
        clusters: [],
        pins,
        total_listings: response.total ?? 0,
      } satisfies MapViewResponse;
    },
    // Viewport results stay fresh briefly so micro-pans don't trigger a refetch storm.
    staleTime: 30_000,
    enabled:
      filters.lat !== undefined &&
      filters.lng !== undefined,
  });
}

export function useMapView(filters: MapViewFilters) {
  return useQuery({
    ...mapViewOptions(filters),
    // Keep the previous viewport's pins on screen while a new one loads so the
    // map doesn't flash blank on every pan/zoom (smooth refetch).
    placeholderData: keepPreviousData
  });
}
