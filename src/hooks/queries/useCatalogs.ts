import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { CatalogEntry, CatalogCity } from "@/lib/api/types";
import { KITCHEN_TYPE_OPTIONS, VENTILATION_TYPE_OPTIONS } from "@/lib/data";
import { humanizeSnakeCase } from "@/lib/utils";
import type { DomainOption } from "@/lib/data";

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

/** Maps catalog payload items (either `{ name }` or `{ id, label }` /
 *  `{ value, label }` shape) to DomainOptions, falling back to the static
 *  option list when the catalog returns no usable entries. */
function catalogOptions(
  entry: CatalogEntry | undefined,
  fallback: readonly DomainOption[]
): DomainOption[] {
  const items = catalogItems<Record<string, unknown>>(entry);
  const mapped = items
    .map((item) => {
      const name = typeof item?.name === "string" ? item.name : "";
      const id = typeof item?.id === "string" ? item.id : "";
      const value =
        typeof item?.value === "string"
          ? item.value
          : id || name.toLowerCase().replace(/\s+/g, "_");
      if (!value) return null;
      return {
        value,
        label:
          typeof item?.label === "string"
            ? item.label
            : humanizeSnakeCase(name || value)
      };
    })
    .filter((o): o is DomainOption => o !== null);
  return mapped.length > 0 ? mapped : [...fallback];
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

/** Raw catalog entries (e.g. flatmates_smoking_options); components that need
 *  the full list use this and pick the entry by key themselves. */
export function useCatalogs() {
  return useAllCatalogs();
}

export function useCities() {
  const { data = [], ...rest } = useAllCatalogs();
  const entry = data.find((c) => c.key === "cities");
  const cities = catalogItems<CatalogCity>(entry);
  return { ...rest, data: cities };
}

/**
 * Catalog id -> Amenity.title value that GET /properties' amenities filter
 * resolves (it matches lower(Amenity.title)). Items without a resolvable
 * title are dropped so a selected amenity can never zero out the results.
 */
const AMENITY_TITLE_BY_ID: Record<string, string> = {
  wifi: "WiFi",
  parking: "Parking",
  security: "24/7 Security",
  lift: "Lift",
  ac: "Air Conditioning",
  power_backup: "Power Backup",
  nearby_parks: "Nearby Parks",
  gym: "Gym",
  cctv: "CCTV",
  intercom: "Intercom",
  garden: "Garden",
  clubhouse: "Clubhouse"
};

export function useAmenities() {
  const { data = [], ...rest } = useAllCatalogs();
  const entry = data.find((c) => c.key === "flatmates_listing_amenities");
  const items = catalogItems<{ id: string; label: string }>(entry);
  const amenities = items
    .map((item, index) => ({
      id: index + 1,
      name: AMENITY_TITLE_BY_ID[item.id] ?? ""
    }))
    .filter((a) => a.name.length > 0);
  return { ...rest, data: amenities };
}

export function useKitchenTypes() {
  const { data = [], ...rest } = useAllCatalogs();
  const entry = data.find((c) => c.key === "flatmates_kitchen_types");
  const options = catalogOptions(entry, KITCHEN_TYPE_OPTIONS);
  return { ...rest, data: options };
}

export function useVentilationOptions() {
  const { data = [], ...rest } = useAllCatalogs();
  const entry = data.find((c) => c.key === "flatmates_ventilation_options");
  const options = catalogOptions(entry, VENTILATION_TYPE_OPTIONS);
  return { ...rest, data: options };
}
