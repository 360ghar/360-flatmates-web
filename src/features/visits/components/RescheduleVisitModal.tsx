import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";

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
    <ConfirmModal
      open={open}
      title="Reschedule the visit"
      description="Pick a new date. We let the other person know."
      cancelLabel="Keep current date"
      confirmLabel="Reschedule"
      confirmDisabled={!newDate || rescheduleInvalid || isMutating}
      loading={submitting}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      <Input
        label="New date"
        type="date"
        value={newDate}
        min={minDate}
        error={rescheduleInvalid ? "Pick a date today or later." : undefined}
        onChange={(e) => onDateChange(e.target.value)}
      />
    </ConfirmModal>
  );
}
