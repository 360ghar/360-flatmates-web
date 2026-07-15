import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/components/ui/component-utils";

export function RescheduleVisitModal({
  open,
  newDate,
  minDate,
  rescheduleInvalid,
  isMutating,
  submitting,
  onClose,
  onDateChange,
  onConfirm
}: {
  open: boolean;
  newDate: string;
  minDate: string;
  rescheduleInvalid: boolean;
  isMutating: boolean;
  submitting: boolean;
  onClose: () => void;
  onDateChange: (value: string) => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      title="Reschedule Visit"
      description="Pick a new date for your visit."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keep current date
          </Button>
          <Button
            disabled={!newDate || rescheduleInvalid || isMutating}
            loading={submitting}
            onClick={onConfirm}
          >
            Confirm Reschedule
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="reschedule-date" className="text-label-md text-ink-2">
          New Date
        </label>
        <input
          id="reschedule-date"
          type="date"
          className={cn(
            "h-12 w-full rounded-[8px] border bg-surface px-3 text-body-md text-ink focus:focus:outline-none",
            rescheduleInvalid ? "border-error focus:border-error" : "border-line focus:border-accent"
          )}
          value={newDate}
          min={minDate}
          aria-invalid={rescheduleInvalid}
          aria-describedby={rescheduleInvalid ? "reschedule-date-error" : undefined}
          onChange={(e) => onDateChange(e.target.value)}
        />
        {rescheduleInvalid ? (
          <p id="reschedule-date-error" className="text-caption text-error">
            Pick a date today or later.
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
