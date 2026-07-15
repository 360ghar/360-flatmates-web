import { useCallback, useMemo, useState } from "react";
import { useStore } from "zustand";
import { searchStore } from "@/lib/stores/search-store";
import type { SearchFilters } from "@/lib/api/types";
import {
  LISTING_SHARING_TYPE_OPTIONS,
  GENDER_PREFERENCE_VALUES,
  MOVE_IN_TIMELINE_OPTIONS,
  PROPERTY_TYPE_VALUES
} from "@/lib/data";
import type { FilterSection } from "@/components/molecules/FilterPanel";

export function useExploreFilters() {
  const filters = useStore(searchStore, (s) => s.filters);
  const setFilter = useStore(searchStore, (s) => s.setFilter);
  const setFilters = useStore(searchStore, (s) => s.setFilters);
  const resetFilters = useStore(searchStore, (s) => s.resetFilters);

  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

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
    [filters.property_type, filters.sharing_type, filters.gender_preference, filters.move_in, filters.price_min, filters.price_max]
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

      const currentArray = filters[sectionId as keyof SearchFilters];
      if (!Array.isArray(currentArray)) return;
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
