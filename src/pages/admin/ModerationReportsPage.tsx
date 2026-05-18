import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2
} from "lucide-react";
import { useAdminReports, useAdminReportAction } from "@/hooks/queries";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { TextArea } from "@/components/ui/Input";
import { PageLayout, PageHeader } from "@/components/ui/Layout";
import { SearchBar } from "@/components/ui/SearchBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView, EmptyState } from "@/components/ui/StateViews";
import type { ReportAdmin, ReportAction } from "@/lib/api/types";

export function ModerationReportsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error, refetch } = useAdminReports({
    status: "open"
  });
  const reportAction = useAdminReportAction();

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportAdmin | null>(null);
  const [pendingAction, setPendingAction] = useState<ReportAction | null>(null);
  const [actionNotes, setActionNotes] = useState("");

  const filtered = useMemo(
    () => {
      const reports = data?.reports ?? [];
      return search
        ? reports.filter(
            (r: ReportAdmin) =>
              r.reporter_name.toLowerCase().includes(search.toLowerCase()) ||
              r.reported_name.toLowerCase().includes(search.toLowerCase()) ||
              r.reason.toLowerCase().includes(search.toLowerCase())
          )
        : reports;
    },
    [search, data]
  );

  function openActionModal(report: ReportAdmin, action: ReportAction) {
    setSelectedReport(report);
    setPendingAction(action);
    setActionNotes("");
    setActionModalOpen(true);
  }

  function handleConfirmAction() {
    if (!selectedReport || !pendingAction) return;
    reportAction.mutate(
      {
        reportId: selectedReport.id,
        payload: {
          action: pendingAction,
          notes: actionNotes.trim() || undefined
        }
      },
      {
        onSuccess: () => {
          setActionModalOpen(false);
          setSelectedReport(null);
          setPendingAction(null);
          setActionNotes("");
          refetch();
        }
      }
    );
  }

  const actionLabels: Record<ReportAction, string> = {
    dismiss: "Dismiss",
    warn: "Warn User",
    suspend: "Suspend User"
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

  return (
    <PageLayout>
      <PageHeader
        eyebrow="Moderation"
        title="Report Review Queue"
        description="Review and act on user-submitted reports."
      />

      <div className="mt-6 flex flex-col gap-4">
        <SearchBar
          placeholder="Search by reporter, reported user, or reason"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
        />

        <AsyncView
          data={data}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          isEmpty={(d) => !d.reports?.length}
          loading={
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex flex-col gap-1.5">
                        <Skeleton className="h-5 w-3/5" />
                        <Skeleton className="h-3 w-2/5" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-1/3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20 rounded-[10px]" />
                      <Skeleton className="h-8 w-16 rounded-[10px]" />
                      <Skeleton className="h-8 w-20 rounded-[10px]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          }
          empty={
            <EmptyState
              title="No open reports"
              description="All reports have been reviewed. Check back later."
            />
          }
        >
          {() => (
            <div className="flex flex-col gap-3">
              {filtered.map((report: ReportAdmin) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  statusBadgeMap={statusBadgeMap}
                  onAction={(action) => openActionModal(report, action)}
                  isActing={reportAction.isPending}
                />
              ))}
              {filtered.length === 0 && search && (
                <EmptyState
                  title="No matches"
                  description={`No reports match "${search}".`}
                />
              )}
            </div>
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
        onClose={() => setActionModalOpen(false)}
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
            >
              Confirm
            </Button>
          </>
        }
      >
        <TextArea
          label="Notes (optional)"
          placeholder="Add any internal notes about this action..."
          value={actionNotes}
          onChange={(e) => setActionNotes(e.target.value)}
          rows={3}
        />
      </Modal>
    </PageLayout>
  );
}

function ReportRow({
  report,
  statusBadgeMap,
  onAction,
  isActing
}: {
  report: ReportAdmin;
  statusBadgeMap: Record<string, "pending" | "confirmed" | "rejected">;
  onAction: (action: ReportAction) => void;
  isActing: boolean;
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

        <div className="flex items-center gap-2">
          <Button
            size="compact"
            variant="tertiary"
            disabled={isActing}
            leadingIcon={<CheckCircle2 aria-hidden="true" className="h-4 w-4" />}
            onClick={() => onAction("dismiss")}
          >
            Dismiss
          </Button>
          <Button
            size="compact"
            variant="secondary"
            disabled={isActing}
            leadingIcon={<AlertTriangle aria-hidden="true" className="h-4 w-4" />}
            onClick={() => onAction("warn")}
          >
            Warn
          </Button>
          <Button
            size="compact"
            variant="primary"
            disabled={isActing}
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
