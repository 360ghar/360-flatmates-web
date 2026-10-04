import { useCallback, useMemo, useState } from "react";
import { useStore } from "zustand";
import { searchStore } from "@/lib/stores/search-store";
import type { SearchFilters } from "@/lib/api/types";
import {
  FURNISHING_LEVEL_OPTIONS,
  GENDER_PREFERENCE_VALUES,
  KITCHEN_TYPE_OPTIONS,
  LISTING_SHARING_TYPE_OPTIONS,
  MOVE_IN_TIMELINE_OPTIONS,
  PROPERTY_TYPE_VALUES,
  VENTILATION_TYPE_OPTIONS
} from "@/lib/data";
import { useAmenities } from "@/hooks/queries/useCatalogs";
import type { FilterSection } from "@/features/listings/components/FilterPanel";

/** Fallback amenity set (values the backend amenity filter resolves, i.e.
 *  Amenity.title values) used until the amenities catalog loads. */
const FALLBACK_AMENITIES = [
  "Air Conditioning",
  "Lift",
  "Parking",
  "Power Backup",
  "Nearby Parks",
  "Gym",
  "24/7 Security",
  "WiFi",
  "CCTV"
];

const WINDOW_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" }
] as const;

export function useExploreFilters() {
  const filters = useStore(searchStore, (s) => s.filters);
  const setFilter = useStore(searchStore, (s) => s.setFilter);
  const setFilters = useStore(searchStore, (s) => s.setFilters);
  const resetFilters = useStore(searchStore, (s) => s.resetFilters);

  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const { data: amenities, isLoading: amenitiesLoading } = useAmenities();

  const amenityOptions = useMemo(() => {
    if (amenitiesLoading || amenities.length === 0) {
      return FALLBACK_AMENITIES.map((a) => ({
        value: a,
        label: a,
        selected: filters.amenities?.includes(a) ?? false
      }));
    }
    return amenities.map((a) => ({
      value: a.name,
      label: a.name,
      selected: filters.amenities?.includes(a.name) ?? false
    }));
  }, [amenities, amenitiesLoading, filters.amenities]);

  const filterSections: FilterSection[] = useMemo(
    () => [
      {
        id: "property_type",
        title: "Property Type",
        options: PROPERTY_TYPE_VALUES.map((pt) => ({
          value: pt,
          label: pt === "pg" ? "PG" : "Flatmate",
          selected: filters.property_type?.includes(pt) ?? false,
        })),
      },
      {
        id: "sharing_type",
        title: "Sharing Type",
        options: LISTING_SHARING_TYPE_OPTIONS.map((st) => ({
          value: st.value,
          label: st.label,
          selected: filters.sharing_type?.includes(st.value as SearchFilters["sharing_type"] extends (infer U)[] | undefined ? U : never) ?? false,
        })),
      },
      {
        id: "gender_preference",
        title: "Gender Preference",
        options: GENDER_PREFERENCE_VALUES.map((gp) => ({
          value: gp,
          label: gp.charAt(0).toUpperCase() + gp.slice(1),
          selected: filters.gender_preference?.includes(gp as SearchFilters["gender_preference"] extends (infer U)[] | undefined ? U : never) ?? false,
        })),
      },
      {
        id: "furnishing",
        title: "Furnishing",
        options: FURNISHING_LEVEL_OPTIONS.map((f) => ({
          value: f.value,
          label: f.label,
          selected: filters.furnishing?.includes(f.value as SearchFilters["furnishing"] extends (infer U)[] | undefined ? U : never) ?? false,
        })),
      },
      {
        id: "kitchen_type",
        title: "Kitchen Type",
        options: KITCHEN_TYPE_OPTIONS.map((k) => ({
          value: k.value,
          label: k.label,
          selected: filters.kitchen_type?.includes(k.value as SearchFilters["kitchen_type"] extends (infer U)[] | undefined ? U : never) ?? false,
        })),
      },
      {
        id: "ventilation_type",
        title: "Ventilation",
        options: VENTILATION_TYPE_OPTIONS.map((v) => ({
          value: v.value,
          label: v.label,
          selected: filters.ventilation_type?.includes(v.value as SearchFilters["ventilation_type"] extends (infer U)[] | undefined ? U : never) ?? false,
        })),
      },
      {
        id: "amenities",
        title: "Amenities",
        options: amenityOptions,
      },
      {
        id: "has_lift",
        title: "Lift Availability",
        options: [{ value: "has_lift", label: "Has Lift", selected: filters.has_lift === true }],
      },
      {
        id: "windows",
        title: "Windows",
        options: WINDOW_OPTIONS.map((w) => ({
          value: w.value,
          label: w.label,
          selected:
            w.value === "any"
              ? filters.windows_min == null
              : filters.windows_min === Number(w.value),
        })),
      },
      {
        id: "move_in",
        title: "Move-in Timeline",
        options: MOVE_IN_TIMELINE_OPTIONS.map((mo) => ({
          value: mo.value,
          label: mo.label,
          selected: filters.move_in?.includes(mo.value as SearchFilters["move_in"] extends (infer U)[] | undefined ? U : never) ?? false,
        })),
      },
      {
        id: "budget",
        title: "Budget",
        options: [
          { value: "under5k", label: "Under ₹5,000", selected: filters.price_max !== undefined && filters.price_max <= 5000 },
          { value: "5k-10k", label: "₹5,000 - ₹10,000", selected: filters.price_min === 5000 && filters.price_max === 10000 },
          { value: "10k-20k", label: "₹10,000 - ₹20,000", selected: filters.price_min === 10000 && filters.price_max === 20000 },
          { value: "20k-30k", label: "₹20,000 - ₹30,000", selected: filters.price_min === 20000 && filters.price_max === 30000 },
          { value: "30k+", label: "₹30,000+", selected: filters.price_min === 30000 && filters.price_max === undefined },
        ],
      },
    ],
    [filters.property_type, filters.sharing_type, filters.gender_preference, filters.furnishing, filters.kitchen_type, filters.ventilation_type, filters.move_in, filters.price_min, filters.price_max, filters.has_lift, filters.windows_min, amenityOptions]
  );

  const handleFilterToggle = useCallback(
    (sectionId: string, value: string) => {
      if (sectionId === "budget") {
        const budgetMap: Record<string, { price_min?: number; price_max?: number }> = {
          under5k: { price_max: 5000 },
          "5k-10k": { price_min: 5000, price_max: 10000 },
          "10k-20k": { price_min: 10000, price_max: 20000 },
          "20k-30k": { price_min: 20000, price_max: 30000 },
          "30k+": { price_min: 30000 },
        };
        const budget = budgetMap[value];
        if (!budget) return;
        // Toggle: if already selected with this budget, clear it
        const isSelected =
          (budget.price_min === filters.price_min || (budget.price_min === undefined && filters.price_min === undefined)) &&
          (budget.price_max === filters.price_max || (budget.price_max === undefined && filters.price_max === undefined));
        if (isSelected) {
          setFilters({ price_min: undefined, price_max: undefined });
        } else {
          setFilters({ ...budget });
        }
        return;
      }

      if (sectionId === "has_lift") {
        setFilter("has_lift", filters.has_lift === true ? undefined : true);
        return;
      }

      if (sectionId === "windows") {
        if (value === "any") {
          setFilter("windows_min", undefined);
        } else if (filters.windows_min === Number(value)) {
          setFilter("windows_min", undefined);
        } else {
          setFilter("windows_min", Number(value));
        }
        return;
      }

      // Default an uninitialized multi-select section to [] so the first
      // click selects instead of being silently swallowed.
      const currentArray = filters[sectionId as keyof SearchFilters] ?? [];
      const currentStrings = currentArray as string[];
      const next = currentStrings.includes(value)
        ? currentStrings.filter((v) => v !== value)
        : [...currentStrings, value];
      setFilter(sectionId as keyof SearchFilters, next as unknown as SearchFilters[keyof SearchFilters]);
    },
    [filters, setFilter, setFilters]
  );

  const handleClearFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  const handleApplyFilters = useCallback(() => {
    setFilterPanelOpen(false);
  }, []);

  return {
    filters,
    filterPanelOpen,
    setFilterPanelOpen,
    filterSections,
    handleFilterToggle,
    handleClearFilters,
    handleApplyFilters,
  };
}
