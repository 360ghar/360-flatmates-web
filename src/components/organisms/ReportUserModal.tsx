import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import type { ChatReportReason } from "./ChatThread";

const REPORT_REASONS: { value: ChatReportReason; label: string }[] = [
  { value: "spam", label: "Spam or scam" },
  { value: "fake_profile", label: "Fake profile" },
  { value: "abuse", label: "Harassment or abuse" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Something else" }
];

export function ReportUserModal({
  open,
  participantName,
  reportReason,
  onReportReasonChange,
  reportNotes,
  onReportNotesChange,
  onClose,
  onSubmit
}: {
  open: boolean;
  participantName: string;
  reportReason: ChatReportReason;
  onReportReasonChange: (reason: ChatReportReason) => void;
  reportNotes: string;
  onReportNotesChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      open={open}
      title={`Report ${participantName}`}
      description="Tell us what's wrong. Reports are confidential and reviewed by our team."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" className="bg-error hover:bg-error" onClick={onSubmit}>
            Submit report
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-label-md text-ink-2">Reason</legend>
          {REPORT_REASONS.map((reason) => (
            <label
              key={reason.value}
              className="flex cursor-pointer items-center gap-2 text-body-md text-ink"
            >
              <input
                type="radio"
                name="report-reason"
                value={reason.value}
                checked={reportReason === reason.value}
                onChange={() => onReportReasonChange(reason.value)}
                className="h-4 w-4 accent-accent"
              />
              {reason.label}
            </label>
          ))}
        </fieldset>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="report-notes" className="text-label-md text-ink-2">
            Details (optional)
          </label>
          <textarea
            id="report-notes"
            rows={3}
            placeholder="Add any context that helps us review this..."
            value={reportNotes}
            onChange={(e) => onReportNotesChange(e.target.value)}
            className="w-full resize-y rounded-[8px] border border-line bg-surface px-3 py-3 text-body-md text-ink placeholder:text-ink-3 focus:border-accent focus:focus:outline-none"
          />
        </div>
      </div>
    </Modal>
  );
}
