import { ApproveRejectListingModals } from "./ApproveRejectListingModals";
import type { FlatmateListingAdmin } from "@/lib/api/types";

export function ModerationListingActionModals({
  approveTarget,
  rejectTarget,
  rejectReason,
  onRejectReasonChange,
  isPending,
  onCancelApprove,
  onConfirmApprove,
  onCancelReject,
  onConfirmReject
}: {
  approveTarget: FlatmateListingAdmin | null;
  rejectTarget: FlatmateListingAdmin | null;
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
      approveOpen={approveTarget !== null}
      rejectOpen={rejectTarget !== null}
      approveDescription={
        approveTarget
          ? `"${approveTarget.title}" will be marked as approved and become visible to all users.`
          : ""
      }
      rejectDescription={
        rejectTarget
          ? `Provide a reason for rejecting "${rejectTarget.title}". The owner will see this.`
          : ""
      }
      approveConfirmVariant="destructive"
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
