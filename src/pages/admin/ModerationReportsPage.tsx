import { useMemo, useReducer, useState } from "react";
import { useInfiniteAdminReports, useAdminReportAction } from "@/hooks/queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageLayout, PageHeader } from "@/components/ui/Layout";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView, EmptyState, ErrorState } from "@/components/ui/StateViews";
import { uiStore } from "@/lib/stores/ui-store";
import type { ReportAdmin, ReportStatus } from "@/lib/api/types";
import type { ReportAction } from "@/lib/data";
import { ModerationReportActionModal } from "./ModerationReportActionModal";
import { ModerationReportRow } from "./ModerationReportRow";
import { ModerationReportsFilterBar, type ReportsStatusFilter } from "./ModerationReportsFilterBar";

const actionPastTense: Record<ReportAction, string> = {
  dismiss: "dismissed",
  warn: "resolved with a warning",
  suspend: "resolved, user suspended"
};

const statusBadgeMap: Record<string, "pending" | "confirmed" | "rejected"> = {
  open: "pending",
  under_review: "pending",
  resolved: "confirmed",
  dismissed: "rejected"
};

interface ActionModalState {
  open: boolean;
  report: ReportAdmin | null;
  action: ReportAction | null;
  notes: string;
  suspendConfirmation: string;
}

const initialActionModalState: ActionModalState = {
  open: false,
  report: null,
  action: null,
  notes: "",
  suspendConfirmation: ""
};

type ActionModalDispatch =
  | { type: "open"; report: ReportAdmin; action: ReportAction }
  | { type: "close" }
  | { type: "reset" }
  | { type: "setNotes"; value: string }
  | { type: "setSuspendConfirmation"; value: string };

function actionModalReducer(state: ActionModalState, action: ActionModalDispatch): ActionModalState {
  switch (action.type) {
    case "open":
      return { open: true, report: action.report, action: action.action, notes: "", suspendConfirmation: "" };
    case "close":
      return { ...state, open: false };
    case "reset":
      return initialActionModalState;
    case "setNotes":
      return { ...state, notes: action.value };
    case "setSuspendConfirmation":
      return { ...state, suspendConfirmation: action.value };
    default:
      return state;
  }
}

export function ModerationReportsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportsStatusFilter>("open");
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

  // Action modal state — the fields below (open/report/action/notes/
  // suspend-confirmation token) all transition together (opened, confirmed,
  // reset), so they live in one reducer instead of five separate useStates.
  // Confirmation token — for destructive actions (suspend) the admin must type
  // the reported user's name OR the literal word SUSPEND before the Confirm
  // button enables. This prevents accidental account suspensions.
  const [actionModal, dispatchActionModal] = useReducer(actionModalReducer, initialActionModalState);
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
    actionModal.report && allReports.some((r) => r.id === actionModal.report?.id)
      ? actionModal.report
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
    dispatchActionModal({ type: "open", report, action });
  }

  function handleConfirmAction() {
    if (!liveSelectedReport || !actionModal.action || reportAction.isPending) return;
    if (actionModal.action === "suspend") {
      // Defence-in-depth: the button is also disabled in the UI, but block
      // here too in case the disabled state is bypassed (e.g. dev tools).
      const token = actionModal.suspendConfirmation.trim();
      const expected = liveSelectedReport.reported_name.trim();
      if (!actionModal.notes.trim() || (token !== "SUSPEND" && token !== expected)) {
        return;
      }
    }
    const report = liveSelectedReport;
    const action = actionModal.action;
    setActingId(report.id);
    reportAction.mutate(
      {
        reportId: report.id,
        payload: {
          action,
          notes: actionModal.notes.trim() || undefined
        }
      },
      {
        onSuccess: () => {
          dispatchActionModal({ type: "reset" });
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

  const isSuspend = actionModal.action === "suspend";
  const suspendTokenMatches =
    liveSelectedReport &&
    (actionModal.suspendConfirmation.trim() === "SUSPEND" ||
      actionModal.suspendConfirmation.trim() === liveSelectedReport.reported_name.trim());
  const canConfirm = Boolean(
    actionModal.action &&
    !reportAction.isPending &&
    (isSuspend
      ? suspendTokenMatches && actionModal.notes.trim()
      : true)
  );

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
        <ModerationReportsFilterBar
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          onSearchClear={() => setSearch("")}
          totalCount={totalCount}
          filteredCount={filtered.length}
        />

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
                    <ModerationReportRow
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
      <ModerationReportActionModal
        open={actionModal.open}
        action={actionModal.action}
        report={actionModal.report}
        notes={actionModal.notes}
        suspendConfirmation={actionModal.suspendConfirmation}
        isPending={reportAction.isPending}
        canConfirm={canConfirm}
        isSuspend={isSuspend}
        onClose={() => dispatchActionModal({ type: "close" })}
        onNotesChange={(value) => dispatchActionModal({ type: "setNotes", value })}
        onSuspendConfirmationChange={(value) => dispatchActionModal({ type: "setSuspendConfirmation", value })}
        onConfirm={handleConfirmAction}
      />
    </PageLayout>
  );
}
