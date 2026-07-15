import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useAdminProperty, useAdminModerate } from "@/hooks/queries";
import { Card } from "@/components/ui/Card";
import { PageLayout, PageHeader } from "@/components/ui/Layout";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView, ErrorState } from "@/components/ui/StateViews";
import { uiStore } from "@/lib/stores/ui-store";
import { PrescreenPropertyDetails } from "./PrescreenPropertyDetails";
import { PrescreenActionBar } from "./PrescreenActionBar";
import { PrescreenActionModals } from "./PrescreenActionModals";

export function PrescreenPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const listingId = id !== undefined ? Number(id) : Number.NaN;

  // If `:id` is missing or not a positive integer, the property query is
  // meaningless and would spin forever. Bounce back to the listing queue
  // immediately with a toast explaining what happened.
  const idIsValid = Number.isInteger(listingId) && listingId > 0;
  useEffect(() => {
    if (idIsValid) return;
    uiStore.getState().pushToast({
      type: "error",
      title: "Invalid listing",
      description: "That listing could not be opened for pre-screening."
    });
    navigate("/admin/moderation/listings", { replace: true });
  }, [idIsValid, navigate]);

  const { data, isLoading, error, refetch } = useAdminProperty(
    idIsValid ? listingId : 0
  );
  const moderate = useAdminModerate();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approveModalOpen, setApproveModalOpen] = useState(false);

  if (!idIsValid) {
    // Render a minimal placeholder while the redirect effect fires.
    return null;
  }

  function handleApprove() {
    if (moderate.isPending) return;
    moderate.mutate(
      { listingId, payload: { action: "approve" } },
      {
        onSuccess: () => {
          uiStore.getState().pushToast({
            type: "success",
            title: "Listing approved",
            description: "The listing is now live."
          });
          navigate("/admin/moderation/listings");
        },
        onError: () => {
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not approve listing",
            description: "Please try again."
          });
        }
      }
    );
  }

  function handleReject() {
    if (!rejectReason.trim() || moderate.isPending) return;
    moderate.mutate(
      {
        listingId,
        payload: { action: "reject", reason: rejectReason.trim() }
      },
      {
        onSuccess: () => {
          setRejectModalOpen(false);
          setRejectReason("");
          uiStore.getState().pushToast({
            type: "success",
            title: "Listing rejected",
            description: "The owner will see your reason."
          });
          navigate("/admin/moderation/listings");
        },
        onError: () => {
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not reject listing",
            description: "Please try again."
          });
        }
      }
    );
  }

  return (
    <PageLayout>
      <PageHeader
        eyebrow="Moderation"
        title="Listing Review"
        onBack={() => navigate("/admin/moderation/listings")}
      />

      <div className="mt-6">
        <AsyncView
          data={data}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          loading={<Skeleton variant="listingDetail" />}
          errorView={
            <Card className="flex items-center justify-center p-6">
              <ErrorState
                title="Could not load listing"
                description="The listing may have been removed or you may not have access."
                onRetry={() => refetch()}
              />
            </Card>
          }
        >
          {(property) => <PrescreenPropertyDetails property={property} />}
        </AsyncView>
      </div>

      <PrescreenActionBar
        disabled={moderate.isPending}
        onReject={() => setRejectModalOpen(true)}
        onApprove={() => setApproveModalOpen(true)}
      />

      <PrescreenActionModals
        approveModalOpen={approveModalOpen}
        rejectModalOpen={rejectModalOpen}
        rejectReason={rejectReason}
        onRejectReasonChange={setRejectReason}
        isPending={moderate.isPending}
        onCancelApprove={() => setApproveModalOpen(false)}
        onConfirmApprove={() => {
          setApproveModalOpen(false);
          handleApprove();
        }}
        onCancelReject={() => setRejectModalOpen(false)}
        onConfirmReject={handleReject}
      />
    </PageLayout>
  );
}
