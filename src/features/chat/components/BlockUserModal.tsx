import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function BlockUserModal({
  open,
  participantName,
  onClose,
  onConfirm
}: {
  open: boolean;
  participantName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      title={`Block ${participantName}?`}
      description="They won't be able to message you or see your profile, and this conversation will close. You can unblock them later from Settings."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive"  onClick={onConfirm}>
            Block
          </Button>
        </>
      }
    >
      <p className="text-body-md text-ink-2">
        Blocking is a safety action. If you also feel unsafe, consider reporting them.
      </p>
    </Modal>
  );
}
