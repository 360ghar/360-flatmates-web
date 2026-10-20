import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { MAX_PAGE_LIMIT } from "@/lib/api/pagination";
import { readListingPreferences } from "@/lib/api/property-fields";
import type { MapViewResponse, MapViewFilters, MapPin, Property, PropertyCursorPage } from "@/lib/api/types";

function propertyToPin(p: Property & { latitude: number; longitude: number }): MapPin {
  return {
    id: p.id,
    lat: p.latitude,
    lng: p.longitude,
    title: p.title,
    locality: p.locality,
    monthly_rent: p.monthly_rent,
    main_image_url: p.main_image_url,
    sharing_type: readListingPreferences(p).sharingType,
    is_available: p.is_available,
  };
}

function hasCoordinates(p: Property): p is Property & { latitude: number; longitude: number } {
  return p.latitude != null && p.longitude != null;
}

const EARTH_CIRCUMFERENCE_KM = 40_075;
const ASSUMED_VIEWPORT_TILES = 4; // ~1000 px wide map at 256 px tiles

/** Search radius (km) that covers roughly the visible map at a zoom level. */
export function radiusForZoom(zoom: number | undefined, lat = 20): number {
  if (zoom === undefined) return 10;
  const widthKm =
    (EARTH_CIRCUMFERENCE_KM * Math.cos((lat * Math.PI) / 180) * ASSUMED_VIEWPORT_TILES) / 2 ** zoom;
  return Math.min(100, Math.max(1, Math.round(widthKm / 2)));
}

/**
 * A panned map can leave the world's own range (the centre longitude passes 180
 * when the user crosses the date line). The backend answers 422 outside lat
 * -90..90 and lng -180..180, so the centre goes out wrapped into range.
 */
export function wrapLng(lng: number): number {
  if (lng >= -180 && lng <= 180) return lng;
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

export function clampLat(lat: number): number {
  return Math.min(90, Math.max(-90, lat));
}

export function mapViewOptions(filters: MapViewFilters) {
  return queryOptions({
    queryKey: ["map", filters],
    // Pass the per-query AbortSignal so stale viewport fetches (rapid pan/zoom)
    // are cancelled instead of racing to resolve over the freshest request.
    queryFn: async ({ signal }) => {
      const query = {
        lat: clampLat(filters.lat),
        lng: wrapLng(filters.lng),
        radius: filters.radius ?? radiusForZoom(filters.zoom_level, filters.lat),
        property_type: filters.property_type,
        move_in: filters.move_in,
        price_min: filters.price_min,
        price_max: filters.price_max,
        sharing_type: filters.sharing_type,
        gender_preference: filters.gender_preference,
        amenities: filters.amenities,
        furnishing: filters.furnishing,
        kitchen_type: filters.kitchen_type,
        ventilation_type: filters.ventilation_type,
        windows_min: filters.windows_min,
        has_lift: filters.has_lift,
        limit: MAX_PAGE_LIMIT,
        // The viewport count shown on the map is the real total, not the page size.
        include_total: true,
      };
      // One page per viewport: each pan or zoom is a new query, so following
      // `next_cursor` would chain requests before any pin shows.
      // ponytail: 100 pins at most per viewport; page on demand if dense areas need more.
      const response = await apiClient.request<PropertyCursorPage>({
        method: "GET",
        path: "/properties",
        auth: false,
        signal,
        query,
      });

      const pins: MapPin[] = response.items.filter(hasCoordinates).map(propertyToPin);

      return {
        clusters: [],
        pins,
        total_listings: response.total ?? response.items.length,
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
