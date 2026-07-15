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
  amenitiesCount,
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
  amenitiesCount: number;
  onOpenFilters: () => void;
  showClear: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border border-line bg-surface p-3 rounded-2xl mb-6 shadow-xs">
      <form onSubmit={onSearchSubmit} role="search" className="flex-1 min-w-[280px]">
        <Input
          type="search"
          aria-label="Search listings by city, locality, or keyword"
          value={localSearch}
          onChange={(e) => onLocalSearchChange(e.target.value)}
          placeholder="Search by city, locality, or keyword (e.g. 1BHK, WiFi)..."
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
            { value: "0", label: "All Cities" },
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
          className="h-9 rounded-xl border-line text-body-sm font-semibold text-ink-2"
          onClick={onOpenFilters}
        >
          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
          Filters {amenitiesCount > 0 ? `(${amenitiesCount})` : ""}
        </Button>

        {/* Clear Filters */}
        {showClear && (
          <Button
            variant="icon"
            size="compact"
            className="text-body-sm text-accent hover:text-accent font-semibold px-2"
            onClick={onClearFilters}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
