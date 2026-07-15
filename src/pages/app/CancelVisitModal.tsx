import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function CancelVisitModal({
  open,
  submitting,
  onClose,
  onConfirm
}: {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      title="Cancel this visit?"
      description="This lets the other party know the visit is off. You can always schedule a new one."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keep visit
          </Button>
          <Button
            variant="primary"
            className="bg-error text-white shadow-none hover:bg-error/90"
            loading={submitting}
            onClick={onConfirm}
          >
            Cancel visit
          </Button>
        </>
      }
    />
  );
}
