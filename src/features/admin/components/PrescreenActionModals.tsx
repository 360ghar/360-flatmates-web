import { ApproveRejectListingModals } from "./ApproveRejectListingModals";

export function PrescreenActionModals({
  approveModalOpen,
  rejectModalOpen,
  rejectReason,
  onRejectReasonChange,
  isPending,
  onCancelApprove,
  onConfirmApprove,
  onCancelReject,
  onConfirmReject
}: {
  approveModalOpen: boolean;
  rejectModalOpen: boolean;
  rejectReason: string;
  onRejectReasonChange: (value: string) => void;
  isPending: boolean;
  onCancelApprove: () => void;
  onConfirmApprove: () => void;
  onCancelReject: () => void;
  onConfirmReject: () => void;
}) {
  return (
    <ApproveRejectListingModals
      approveOpen={approveModalOpen}
      rejectOpen={rejectModalOpen}
      approveDescription="This listing will become visible to all users."
      rejectDescription="Please provide a reason for rejecting this listing."
      rejectReason={rejectReason}
      onRejectReasonChange={onRejectReasonChange}
      isPending={isPending}
      onCancelApprove={onCancelApprove}
      onConfirmApprove={onConfirmApprove}
      onCancelReject={onCancelReject}
      onConfirmReject={onConfirmReject}
    />
  );
}
