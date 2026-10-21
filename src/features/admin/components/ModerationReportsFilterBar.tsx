import { AdminStatusFilterBar } from "./AdminStatusFilterBar";
import { REPORT_STATUS_VALUES, type ReportStatus } from "@/lib/data";

const STATUS_CHIP_LABELS: Record<ReportStatus, string> = {
  open: "Open",
  reviewed: "Reviewed",
  dismissed: "Dismissed",
  actioned: "Actioned"
};

const STATUS_OPTIONS: ReportStatus[] = [...REPORT_STATUS_VALUES];

// The route has no "all": it lists one status at a time and answers `open` when none is sent.
export type ReportsStatusFilter = ReportStatus;

// Status-filter chips: the four `UserReportStatus` values the backend stores.
const statusChips: { value: ReportsStatusFilter; label: string }[] = [
  ...STATUS_OPTIONS.map((status) => ({
    value: status,
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
