import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextArea, Input } from "@/components/ui/Input";
import type { ReportAdmin } from "@/lib/api/types";
import type { ReportAction } from "@/lib/data";

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
  return (
    <Modal
      open={open}
      title={action ? actionLabels[action] : "Confirm Action"}
      description={
        report
          ? `You are about to ${action ?? "act on"} the report by ${report.reporter_name} against ${report.reported_name}.`
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
          <div className="rounded-xl border border-error/30 bg-error-soft p-3 text-caption text-error">
            <p className="font-semibold">
              Suspending will hide {report.reported_name}'s account from
              discovery and prevent them from signing in.
            </p>
            <p className="mt-1 text-ink-2">
              To confirm, type{" "}
              <span className="font-sans font-semibold text-ink">
                {report.reported_name}
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
            placeholder={`Type "${report?.reported_name ?? "SUSPEND"}" or SUSPEND`}
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
