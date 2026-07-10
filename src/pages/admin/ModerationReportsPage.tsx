import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2
} from "lucide-react";
import { useInfiniteAdminReports, useAdminReportAction } from "@/hooks/queries";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { TextArea, Input } from "@/components/ui/Input";
import { PageLayout, PageHeader } from "@/components/ui/Layout";
import { SearchBar } from "@/components/ui/SearchBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView, EmptyState, ErrorState } from "@/components/ui/StateViews";
import { uiStore } from "@/lib/stores/ui-store";
import type { ReportAdmin, ReportStatus } from "@/lib/api/types";
import { REPORT_STATUS_VALUES, type ReportAction } from "@/lib/data";

const STATUS_CHIP_LABELS: Record<ReportStatus, string> = {
  open: "Open",
  under_review: "Under Review",
  resolved: "Resolved",
  dismissed: "Dismissed"
};

const STATUS_OPTIONS: ReportStatus[] = [...REPORT_STATUS_VALUES];

type StatusFilter = ReportStatus | "all";

export function ModerationReportsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const filters = useMemo(
    () =>
      statusFilter === "all"
        ? undefined
        : { status: statusFilter as ReportStatus },
    [statusFilter]
  );
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch
  } = useInfiniteAdminReports(filters);
  const reportAction = useAdminReportAction();

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportAdmin | null>(null);
  const [pendingAction, setPendingAction] = useState<ReportAction | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  // Confirmation token — for destructive actions (suspend) the admin must type
  // the reported user's name OR the literal word SUSPEND before the Confirm
  // button enables. This prevents accidental account suspensions.
  const [suspendConfirmation, setSuspendConfirmation] = useState("");
  // Id of the report currently mutating, so only its row buttons are disabled.
  const [actingId, setActingId] = useState<number | null>(null);

  // Flatten the paginated pages into a single array.
  const allReports = useMemo<ReportAdmin[]>(
    () => (data?.pages ?? []).flatMap((page) => page.items),
    [data]
  );
  const totalCount = data?.pages?.[0]?.total ?? 0;

  // If the target report scrolls out of the queue while a modal is open, treat
  // it as closed. (Avoids the need for a useEffect to reset the state.)
  const liveSelectedReport =
    selectedReport && allReports.some((r) => r.id === selectedReport.id)
      ? selectedReport
      : null;

  const filtered = useMemo(
    () => {
      if (!search) return allReports;
      const needle = search.toLowerCase();
      return allReports.filter(
        (r) =>
          r.reporter_name.toLowerCase().includes(needle) ||
          r.reported_name.toLowerCase().includes(needle) ||
          r.reason.toLowerCase().includes(needle)
      );
    },
    [search, allReports]
  );

  function openActionModal(report: ReportAdmin, action: ReportAction) {
    setSelectedReport(report);
    setPendingAction(action);
    setActionNotes("");
    setSuspendConfirmation("");
    setActionModalOpen(true);
  }

  function handleConfirmAction() {
    if (!liveSelectedReport || !pendingAction || reportAction.isPending) return;
    if (pendingAction === "suspend") {
      // Defence-in-depth: the button is also disabled in the UI, but block
      // here too in case the disabled state is bypassed (e.g. dev tools).
      const token = suspendConfirmation.trim();
      const expected = liveSelectedReport.reported_name.trim();
      if (!actionNotes.trim() || (token !== "SUSPEND" && token !== expected)) {
        return;
      }
    }
    const report = liveSelectedReport;
    const action = pendingAction;
    setActingId(report.id);
    reportAction.mutate(
      {
        reportId: report.id,
        payload: {
          action,
          notes: actionNotes.trim() || undefined
        }
      },
      {
        onSuccess: () => {
          setActionModalOpen(false);
          setSelectedReport(null);
          setPendingAction(null);
          setActionNotes("");
          setSuspendConfirmation("");
          uiStore.getState().pushToast({
            type: "success",
            title: `Report ${actionPastTense[action]}`,
            description: `Action taken on the report against ${report.reported_name}.`
          });
        },
        onError: () => {
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not complete action",
            description: "Please try again."
          });
        },
        onSettled: () => setActingId(null)
      }
    );
  }

  const actionLabels: Record<ReportAction, string> = {
    dismiss: "Dismiss",
    warn: "Warn User",
    suspend: "Suspend User"
  };

  const actionPastTense: Record<ReportAction, string> = {
    dismiss: "dismissed",
    warn: "resolved with a warning",
    suspend: "resolved, user suspended"
  };

  const actionVariantMap: Record<ReportAction, "primary" | "secondary" | "tertiary"> = {
    suspend: "primary",
    warn: "secondary",
    dismiss: "tertiary",
  };

  const statusBadgeMap: Record<string, "pending" | "confirmed" | "rejected"> = {
    open: "pending",
    under_review: "pending",
    resolved: "confirmed",
    dismissed: "rejected"
  };

  // Status-filter chip labels. NOTE: when A-2/A-3 are resolved
  // (REPORT_STATUS and REPORT_ACTION divergence), the labels here will need
  // to be re-evaluated against the new values from the backend.
  const statusChips: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    ...STATUS_OPTIONS.map((status) => ({
      value: status as StatusFilter,
      label: STATUS_CHIP_LABELS[status]
    }))
  ];

  const isSuspend = pendingAction === "suspend";
  const suspendTokenMatches =
    liveSelectedReport &&
    (suspendConfirmation.trim() === "SUSPEND" ||
      suspendConfirmation.trim() === liveSelectedReport.reported_name.trim());
  const canConfirm =
    !!pendingAction &&
    !reportAction.isPending &&
    (isSuspend
      ? suspendTokenMatches && !!actionNotes.trim()
      : true);

  const hasSearch = search.trim().length > 0;
  const emptyTitle = hasSearch
    ? "No matches"
    : statusFilter === "open"
      ? "No open reports"
      : "No reports";
  const emptyDescription = hasSearch
    ? `No reports match "${search}".`
    : statusFilter === "open"
      ? "All reports have been reviewed. Check back later."
      : "Try a different status filter.";

  return (
    <PageLayout>
      <PageHeader
        eyebrow="Moderation"
        title="Report Review Queue"
        description="Review and act on user-submitted reports."
      />

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
          {statusChips.map((chip) => (
            <Chip
              key={chip.value}
              variant="choice"
              selected={statusFilter === chip.value}
              onClick={() => setStatusFilter(chip.value)}
            >
              {chip.label}
            </Chip>
          ))}
        </div>

        <SearchBar
          placeholder="Search by reporter, reported user, or reason"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
        />

        <div className="flex items-center justify-between text-caption text-ink-3">
          <span>
            {totalCount > 0
              ? `${filtered.length} of ${totalCount} report${totalCount === 1 ? "" : "s"}`
              : "No reports"}
          </span>
        </div>

        <AsyncView
          data={allReports}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          isEmpty={(d) => d.length === 0}
          loading={<Skeleton variant="moderationRow" count={5} />}
          empty={
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              actionLabel={hasSearch ? "Clear search" : undefined}
              onAction={hasSearch ? () => setSearch("") : undefined}
            />
          }
          errorView={
            <Card className="flex items-center justify-center p-6">
              <ErrorState
                title="Could not load reports"
                description="Please try again."
                onRetry={() => refetch()}
              />
            </Card>
          }
        >
          {() => (
            <>
              <ul className="flex flex-col gap-3">
                {filtered.map((report: ReportAdmin) => (
                  <li key={report.id}>
                    <ReportRow
                      report={report}
                      statusBadgeMap={statusBadgeMap}
                      onAction={(action) => openActionModal(report, action)}
                      isActing={actingId === report.id}
                      actionsDisabled={actingId !== null}
                    />
                  </li>
                ))}
              </ul>
              {hasNextPage ? (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="secondary"
                    size="compact"
                    onClick={() => fetchNextPage()}
                    loading={isFetchingNextPage}
                  >
                    Load more
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </AsyncView>
      </div>

      {/* Action Confirmation Modal */}
      <Modal
        open={actionModalOpen}
        title={pendingAction ? actionLabels[pendingAction] : "Confirm Action"}
        description={
          selectedReport
            ? `You are about to ${pendingAction ?? "act on"} the report by ${selectedReport.reporter_name} against ${selectedReport.reported_name}.`
            : ""
        }
        onClose={() => {
          if (reportAction.isPending) return;
          setActionModalOpen(false);
        }}
        size="wide"
        footer={
          <>
            <Button
              size="compact"
              variant="secondary"
              onClick={() => setActionModalOpen(false)}
              disabled={reportAction.isPending}
            >
              Cancel
            </Button>
            <Button
              size="compact"
              variant={pendingAction ? actionVariantMap[pendingAction] : "tertiary"}
              loading={reportAction.isPending}
              onClick={handleConfirmAction}
              disabled={!canConfirm}
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {isSuspend && selectedReport ? (
            <div className="rounded-xl border border-error/30 bg-error-soft p-3 text-caption text-error">
              <p className="font-semibold">
                Suspending will hide {selectedReport.reported_name}'s account from
                discovery and prevent them from signing in.
              </p>
              <p className="mt-1 text-ink-2">
                To confirm, type{" "}
                <span className="font-sans font-semibold text-ink">
                  {selectedReport.reported_name}
                </span>{" "}
                or{" "}
                <span className="font-sans font-semibold text-ink">SUSPEND</span>{" "}
                below.
              </p>
            </div>
          ) : null}
          {isSuspend ? (
            <Input
              label="Confirm suspension"
              placeholder={`Type "${selectedReport?.reported_name ?? "SUSPEND"}" or SUSPEND`}
              value={suspendConfirmation}
              onChange={(e) => setSuspendConfirmation(e.target.value)}
              autoComplete="off"
            />
          ) : null}
          <TextArea
            label={isSuspend ? "Notes (required)" : "Notes (optional)"}
            placeholder="Add any internal notes about this action..."
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </PageLayout>
  );
}

function ReportRow({
  report,
  statusBadgeMap,
  onAction,
  isActing,
  actionsDisabled
}: {
  report: ReportAdmin;
  statusBadgeMap: Record<string, "pending" | "confirmed" | "rejected">;
  onAction: (action: ReportAction) => void;
  isActing: boolean;
  actionsDisabled: boolean;
}) {
  return (
    <Card as="div" variant="compact">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-body-lg font-semibold text-ink">{report.reason}</h3>
            <p className="mt-1 text-caption text-ink-2">
              <span className="font-semibold text-ink">{report.reporter_name}</span> reported{" "}
              <span className="font-semibold text-ink">{report.reported_name}</span>
            </p>
          </div>
          <Badge
            variant="status"
            status={statusBadgeMap[report.status] ?? "pending"}
          />
        </div>

        <div className="flex items-center gap-3 text-caption text-ink-3">
          {report.created_at && (
            <span suppressHydrationWarning>{new Date(report.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          )}
          {report.property_id && (
            <span>Property #{report.property_id}</span>
          )}
          {report.conversation_id && (
            <span>Conversation #{report.conversation_id}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="compact"
            variant="tertiary"
            loading={isActing}
            disabled={actionsDisabled && !isActing}
            leadingIcon={<CheckCircle2 aria-hidden="true" className="h-4 w-4" />}
            onClick={() => onAction("dismiss")}
          >
            Dismiss
          </Button>
          <Button
            size="compact"
            variant="secondary"
            disabled={actionsDisabled}
            leadingIcon={<AlertTriangle aria-hidden="true" className="h-4 w-4" />}
            onClick={() => onAction("warn")}
          >
            Warn
          </Button>
          <Button
            size="compact"
            variant="destructive"
            disabled={actionsDisabled}
            leadingIcon={<Ban aria-hidden="true" className="h-4 w-4" />}
            onClick={() => onAction("suspend")}
          >
            Suspend
          </Button>
        </div>
      </div>
    </Card>
  );
}
