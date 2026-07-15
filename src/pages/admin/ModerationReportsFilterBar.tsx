import { AdminStatusFilterBar } from "./AdminStatusFilterBar";
import type { ReportStatus } from "@/lib/api/types";
import { REPORT_STATUS_VALUES } from "@/lib/data";

const STATUS_CHIP_LABELS: Record<ReportStatus, string> = {
  open: "Open",
  under_review: "Under Review",
  resolved: "Resolved",
  dismissed: "Dismissed"
};

const STATUS_OPTIONS: ReportStatus[] = [...REPORT_STATUS_VALUES];

export type ReportsStatusFilter = ReportStatus | "all";

// Status-filter chip labels. NOTE: when A-2/A-3 are resolved
// (REPORT_STATUS and REPORT_ACTION divergence), the labels here will need
// to be re-evaluated against the new values from the backend.
const statusChips: { value: ReportsStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...STATUS_OPTIONS.map((status) => ({
    value: status as ReportsStatusFilter,
    label: STATUS_CHIP_LABELS[status]
  }))
];

export function ModerationReportsFilterBar({
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  onSearchClear,
  totalCount,
  filteredCount
}: {
  statusFilter: ReportsStatusFilter;
  onStatusFilterChange: (value: ReportsStatusFilter) => void;
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
      searchPlaceholder="Search by reporter, reported user, or reason"
      totalCount={totalCount}
      filteredCount={filteredCount}
      noun="report"
    />
  );
}
