import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export function ScheduleVisitModal({
  open,
  participantName,
  visitDate,
  onVisitDateChange,
  visitNotes,
  onVisitNotesChange,
  onClose,
  onSubmit
}: {
  open: boolean;
  participantName: string;
  visitDate: string;
  onVisitDateChange: (value: string) => void;
  visitNotes: string;
  onVisitNotesChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      open={open}
      title="Schedule a Visit"
      description={`Schedule a visit with ${participantName}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!visitDate} onClick={onSubmit}>
            Schedule
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="visit-date" className="text-label-md text-ink-2">
            Date
          </label>
          <input
            id="visit-date"
            type="date"
            className="h-12 w-full rounded-[8px] border border-line bg-surface px-3 text-body-md text-ink focus:border-accent focus:focus:outline-none"
            value={visitDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => onVisitDateChange(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="visit-notes" className="text-label-md text-ink-2">
            Special requirements (optional)
          </label>
          <textarea
            id="visit-notes"
            rows={3}
            placeholder="Any special requests or notes..."
            value={visitNotes}
            onChange={(e) => onVisitNotesChange(e.target.value)}
            className="w-full rounded-[8px] border border-line bg-surface px-3 py-3 text-body-md text-ink placeholder:text-ink-3 focus:border-accent focus:focus:outline-none resize-y"
          />
        </div>
      </div>
    </Modal>
  );
}
