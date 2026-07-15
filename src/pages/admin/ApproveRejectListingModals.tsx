import { Button, type ButtonVariant } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export function ApproveRejectListingModals({
  approveOpen,
  rejectOpen,
  approveDescription,
  rejectDescription,
  approveConfirmVariant = "primary",
  rejectReason,
  onRejectReasonChange,
  isPending,
  onCancelApprove,
  onConfirmApprove,
  onCancelReject,
  onConfirmReject
}: {
  approveOpen: boolean;
  rejectOpen: boolean;
  approveDescription: string;
  rejectDescription: string;
  approveConfirmVariant?: ButtonVariant;
  rejectReason: string;
  onRejectReasonChange: (value: string) => void;
  isPending: boolean;
  onCancelApprove: () => void;
  onConfirmApprove: () => void;
  onCancelReject: () => void;
  onConfirmReject: () => void;
}) {
  return (
    <>
      {/* Approve confirmation */}
      <Modal
        open={approveOpen}
        title="Approve Listing"
        description={approveDescription}
        onClose={() => {
          if (isPending) return;
          onCancelApprove();
        }}
        footer={
          <>
            <Button
              size="compact"
              variant="secondary"
              onClick={onCancelApprove}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              size="compact"
              variant={approveConfirmVariant}
              loading={isPending}
              onClick={onConfirmApprove}
            >
              Confirm Approval
            </Button>
          </>
        }
      >
        <p className="text-body-md text-ink-2">
          The owner will be notified that their listing is live.
        </p>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        open={rejectOpen}
        title="Reject Listing"
        description={rejectDescription}
        onClose={() => {
          if (isPending) return;
          onCancelReject();
        }}
        footer={
          <>
            <Button
              size="compact"
              variant="secondary"
              onClick={onCancelReject}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              size="compact"
              variant="primary"
              loading={isPending}
              onClick={onConfirmReject}
              disabled={!rejectReason.trim()}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <TextArea
          label="Reason"
          placeholder="Describe why this listing is being rejected..."
          value={rejectReason}
          onChange={(e) => onRejectReasonChange(e.target.value)}
          rows={3}
        />
      </Modal>
    </>
  );
}
