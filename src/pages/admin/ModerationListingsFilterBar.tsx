import { AdminStatusFilterBar } from "./AdminStatusFilterBar";
import type { PropertyModerationStatus } from "@/lib/api/types";
import { PROPERTY_MODERATION_STATUS_VALUES } from "@/lib/data";

const STATUS_CHIP_LABELS: Record<PropertyModerationStatus, string> = {
  pending_review: "Pending",
  approved: "Approved",
  rejected: "Rejected"
};

const STATUS_OPTIONS: PropertyModerationStatus[] = [
  ...PROPERTY_MODERATION_STATUS_VALUES
];

export type ListingStatusFilter = PropertyModerationStatus | "all";

// Status-filter chip labels. NOTE: when A-2/A-3 are resolved (REPORT_STATUS
// and REPORT_ACTION divergence), audit the label set for reports and listings
// together.
const statusChips: { value: ListingStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...STATUS_OPTIONS.map((status) => ({
    value: status as ListingStatusFilter,
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
