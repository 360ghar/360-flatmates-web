import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextArea, Input } from "@/components/ui/Input";
import type { ReportAdmin } from "@/lib/api/types";
import type { ReportAction } from "@/lib/data";
import { adminUserName } from "@/lib/api/admin-fields";

const actionLabels: Record<ReportAction, string> = {
  dismiss: "Dismiss",
  warn_user: "Warn User",
  suspend_user: "Suspend User",
  escalate: "Escalate"
};

const actionVariantMap: Record<ReportAction, "primary" | "secondary" | "tertiary"> = {
  suspend_user: "primary",
  warn_user: "secondary",
  escalate: "secondary",
  dismiss: "tertiary",
};

export function ModerationReportActionModal({
  open,
  action,
  report,
  notes,
  suspendConfirmation,
  isPending,
  canConfirm,
  isSuspend,
  onClose,
  onNotesChange,
  onSuspendConfirmationChange,
  onConfirm
}: {
  open: boolean;
  action: ReportAction | null;
  report: ReportAdmin | null;
  notes: string;
  suspendConfirmation: string;
  isPending: boolean;
  canConfirm: boolean;
  isSuspend: boolean;
  onClose: () => void;
  onNotesChange: (value: string) => void;
  onSuspendConfirmationChange: (value: string) => void;
  onConfirm: () => void;
}) {
  const reporterName = report ? adminUserName(report.reporter, report.reporter_user_id) : "";
  const reportedName = report ? adminUserName(report.reported_user, report.reported_user_id) : "";

  return (
    <Modal
      open={open}
      title={action ? actionLabels[action] : "Confirm Action"}
      description={
        report
          ? `You are about to ${action ? actionLabels[action].toLowerCase() : "act on"} the report by ${reporterName} against ${reportedName}.`
          : ""
      }
      onClose={() => {
        if (isPending) return;
        onClose();
      }}
      size="wide"
      footer={
        <>
          <Button
            size="compact"
            variant="secondary"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            size="compact"
            variant={action ? actionVariantMap[action] : "tertiary"}
            loading={isPending}
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            Confirm
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {isSuspend && report ? (
          <div className="rounded-cut-md border border-error/30 bg-error-soft p-3 text-caption text-error">
            <p className="font-semibold">
              Suspending will hide {reportedName}'s account from
              discovery and prevent them from signing in.
            </p>
            <p className="mt-1 text-ink-2">
              To confirm, type{" "}
              <span className="font-sans font-semibold text-ink">
                {reportedName}
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
            placeholder={`Type "${report ? reportedName : "SUSPEND"}" or SUSPEND`}
            value={suspendConfirmation}
            onChange={(e) => onSuspendConfirmationChange(e.target.value)}
            autoComplete="off"
          />
        ) : null}
        <TextArea
          label={isSuspend ? "Notes (required)" : "Notes (optional)"}
          placeholder="Add any internal notes about this action..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
        />
      </div>
    </Modal>
  );
}
