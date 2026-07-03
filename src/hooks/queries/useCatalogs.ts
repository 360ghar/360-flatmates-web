import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { CatalogEntry, CatalogCity, CatalogLocality, CatalogAmenity } from "@/lib/api/types";

function catalogItems<T>(entry: CatalogEntry | undefined): T[] {
  const payload = entry?.payload as unknown;
  if (Array.isArray(payload)) return payload as T[];
  if (
    typeof payload === "object"
    && payload !== null
    && Array.isArray((payload as { items?: unknown }).items)
  ) {
    return (payload as { items: T[] }).items;
  }
  return [];
}

export const catalogsOptions = queryOptions({
  queryKey: ["catalogs"],
  queryFn: () =>
    apiClient.request<CatalogEntry[]>({
      method: "GET",
      path: "/flatmates/catalogs",
      auth: false
    }).catch(() => [] as CatalogEntry[]),
  staleTime: 30 * 60 * 1000
});

function useAllCatalogs() {
  return useQuery(catalogsOptions);
}

export function useCities() {
  const { data = [], ...rest } = useAllCatalogs();
  const entry = data.find((c) => c.key === "cities");
  const cities = catalogItems<CatalogCity>(entry);
  return { ...rest, data: cities };
}

export function useLocalities(cityId: number) {
  const { data = [], ...rest } = useAllCatalogs();
  const entry = data.find((c) => c.key === "localities");
  const allLocalities = catalogItems<CatalogLocality>(entry);
  const localities = cityId > 0 ? allLocalities.filter((l) => l.city_id === cityId) : allLocalities;
  return { ...rest, data: localities };
}

export function useAmenities() {
  const { data = [], ...rest } = useAllCatalogs();
  const entry = data.find((c) => c.key === "amenities");
  const amenities = catalogItems<CatalogAmenity>(entry);
  return { ...rest, data: amenities };
}
