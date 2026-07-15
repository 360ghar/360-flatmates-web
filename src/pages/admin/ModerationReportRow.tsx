import {
  AlertTriangle,
  Ban,
  CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ReportAdmin } from "@/lib/api/types";
import type { ReportAction } from "@/lib/data";

export function ModerationReportRow({
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
