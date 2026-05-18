import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { MapViewResponse, MapViewFilters, MapPin, Property, PaginatedPropertyResponse } from "@/lib/api/types";
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

export function mapViewOptions(filters: MapViewFilters) {
  return queryOptions({
    queryKey: ["map", filters],
    queryFn: async () => {
      const response = await apiClient.request<PaginatedPropertyResponse>({
        method: "GET",
        path: "/properties",
        query: {
          lat: filters.lat,
          lng: filters.lng,
          radius: filters.radius ?? 10,
          price_min: filters.price_min,
          price_max: filters.price_max,
          sharing_type: filters.sharing_type?.[0],
          limit: 100,
        } as Record<string, QueryValue>,
      });

      const pins: MapPin[] = (response.properties ?? [])
        .filter((p) => p.latitude != null && p.longitude != null)
        .map(propertyToPin);

      return {
        clusters: [],
        pins,
        total_listings: response.total,
      } satisfies MapViewResponse;
    },
    enabled:
      filters.lat !== undefined &&
      filters.lng !== undefined,
  });
}

export function useMapView(filters: MapViewFilters) {
  return useQuery({
    ...mapViewOptions(filters),
    placeholderData: {
      clusters: [],
      pins: [],
      total_listings: 0
    }
  });
}
