import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, SelectField } from "@/components/ui/Input";
import type { CatalogCity } from "@/lib/api/types";

export function SearchQuickFilterBar({
  localSearch,
  onLocalSearchChange,
  onSearchSubmit,
  cities,
  cityId,
  onCityChange,
  bedrooms,
  onBedroomsChange,
  filterCount,
  onOpenFilters,
  showClear,
  onClearFilters
}: {
  localSearch: string;
  onLocalSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  cities?: CatalogCity[];
  cityId: number;
  onCityChange: (id: number) => void;
  bedrooms: string;
  onBedroomsChange: (value: string) => void;
  filterCount: number;
  onOpenFilters: () => void;
  showClear: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="paper-grain flex flex-col gap-3 rounded-hand bg-surface p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
      <form onSubmit={onSearchSubmit} role="search" className="min-w-0 flex-1 sm:min-w-[260px]">
        <Input
          type="search"
          aria-label="Search listings by city, locality, or keyword"
          value={localSearch}
          onChange={(e) => onLocalSearchChange(e.target.value)}
          placeholder="Area, society or keyword, like 1BHK or WiFi"
          leadingIcon={<Search className="h-4.5 w-4.5" />}
        />
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {/* City Dropdown */}
        <SelectField
          aria-label="Filter by city"
          value={String(cityId)}
          onChange={(e) => onCityChange(Number(e.target.value))}
          fullWidth={false}
          options={[
            { value: "0", label: "All cities" },
            ...(cities?.map((c) => ({ value: String(c.id), label: c.name })) ?? []),
          ]}
        />

        {/* Bedrooms Dropdown */}
        <SelectField
          aria-label="Filter by bedrooms"
          value={bedrooms}
          onChange={(e) => onBedroomsChange(e.target.value)}
          fullWidth={false}
          options={[
            { value: "", label: "All BHKs" },
            { value: "1", label: "1 BHK" },
            { value: "2", label: "2 BHK" },
            { value: "3", label: "3 BHK" },
            { value: "4+", label: "4+ BHK" },
          ]}
        />

        {/* Amenities dialog button */}
        <Button
          variant="secondary"
          size="compact"
          onClick={onOpenFilters}
          leadingIcon={<SlidersHorizontal aria-hidden="true" className="h-4 w-4" />}
        >
          Filters{filterCount > 0 ? ` (${filterCount})` : ""}
        </Button>

        {/* Clear Filters */}
        {showClear && (
          <Button variant="tertiary" size="compact" onClick={onClearFilters}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
