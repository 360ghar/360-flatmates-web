import { Chip } from "@/components/ui/Chip";
import { SearchBar } from "@/components/ui/SearchBar";

export function AdminStatusFilterBar<T extends string>({
  statusChips,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  onSearchClear,
  searchPlaceholder,
  totalCount,
  filteredCount,
  noun
}: {
  statusChips: { value: T; label: string }[];
  statusFilter: T;
  onStatusFilterChange: (value: T) => void;
  search: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchClear: () => void;
  searchPlaceholder: string;
  totalCount: number;
  filteredCount: number;
  /** Singular noun used in the count line, e.g. "listing" or "report". */
  noun: string;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
        {statusChips.map((chip) => (
          <Chip
            key={chip.value}
            variant="choice"
            selected={statusFilter === chip.value}
            onClick={() => onStatusFilterChange(chip.value)}
          >
            {chip.label}
          </Chip>
        ))}
      </div>

      <SearchBar
        placeholder={searchPlaceholder}
        value={search}
        onChange={onSearchChange}
        onClear={onSearchClear}
      />

      <div className="flex items-center justify-between text-caption text-ink-3">
        <span>
          {totalCount > 0
            ? `${filteredCount} of ${totalCount} ${noun}${totalCount === 1 ? "" : "s"}`
            : `No ${noun}s`}
        </span>
      </div>
    </>
  );
}
