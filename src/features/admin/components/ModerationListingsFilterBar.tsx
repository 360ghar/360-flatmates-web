import { AdminStatusFilterBar } from "./AdminStatusFilterBar";
import { LISTING_MODERATION_STATUS_VALUES, type ListingModerationStatus } from "@/lib/data";

const STATUS_CHIP_LABELS: Record<ListingModerationStatus, string> = {
  pending_review: "Pending",
  live: "Live",
  paused: "Paused",
  rejected: "Rejected"
};

const STATUS_OPTIONS: ListingModerationStatus[] = [...LISTING_MODERATION_STATUS_VALUES];

// The route has no "all": it lists one status at a time and answers `pending_review` when none is sent.
export type ListingStatusFilter = ListingModerationStatus;

// Status-filter chips: the four `ListingModerationStatus` values the backend stores.
const statusChips: { value: ListingStatusFilter; label: string }[] = [
  ...STATUS_OPTIONS.map((status) => ({
    value: status,
    label: STATUS_CHIP_LABELS[status]
  }))
];

export function ModerationListingsFilterBar({
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  onSearchClear,
  totalCount,
  filteredCount
}: {
  statusFilter: ListingStatusFilter;
  onStatusFilterChange: (value: ListingStatusFilter) => void;
  search: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchClear: () => void;
  totalCount: number;
  filteredCount: number;
}) {
  return (
    <AdminStatusFilterBar
      statusChips={statusChips}
      statusFilter={statusFilter}
      onStatusFilterChange={onStatusFilterChange}
      search={search}
      onSearchChange={onSearchChange}
      onSearchClear={onSearchClear}
      searchPlaceholder="Search by title, owner, or locality"
      totalCount={totalCount}
      filteredCount={filteredCount}
      noun="listing"
    />
  );
}
