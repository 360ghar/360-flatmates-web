import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { CatalogEntry, CatalogCity, CatalogLocality, CatalogAmenity } from "@/lib/api/types";

export const catalogsOptions = queryOptions({
  queryKey: ["catalogs"],
  queryFn: () =>
    apiClient.request<CatalogEntry[]>({
      method: "GET",
      path: "/flatmates/catalogs"
    }),
  staleTime: 30 * 60 * 1000
});

function useAllCatalogs() {
  return useQuery(catalogsOptions);
}

export function useCities() {
  const { data = [], ...rest } = useAllCatalogs();
  const entry = data.find((c) => c.key === "cities");
  const cities = (entry?.payload ?? []) as unknown as CatalogCity[];
  return { ...rest, data: cities };
}

export function useLocalities(cityId: number) {
  const { data = [], ...rest } = useAllCatalogs();
  const entry = data.find((c) => c.key === "localities");
  const allLocalities = (entry?.payload ?? []) as unknown as CatalogLocality[];
  const localities = cityId > 0 ? allLocalities.filter((l) => l.city_id === cityId) : allLocalities;
  return { ...rest, data: localities };
}

export function useAmenities() {
  const { data = [], ...rest } = useAllCatalogs();
  const entry = data.find((c) => c.key === "amenities");
  const amenities = (entry?.payload ?? []) as unknown as CatalogAmenity[];
  return { ...rest, data: amenities };
}
