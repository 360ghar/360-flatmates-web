import { userMessage } from "@/lib/api/errors";
import { Page, PageHeader } from "@/components/ui/Layout";
import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Pause, Pencil, Play, Trash2 } from "lucide-react";
import { useMyProperty, useDeleteProperty, useSetListingStatus } from "@/features/listings/hooks/useProperties";
import { ownerListingStatus } from "@/lib/api/property-fields";
import type { ListingModerationStatus } from "@/lib/data";
import { propertyToListingCardProps } from "@/features/listings/lib/adapters";
import { uiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, InlineError } from "@/components/ui/StateViews";
import { ListingCard } from "@/features/listings/components/ListingCard";

const LISTING_STATUS_LABEL: Record<ListingModerationStatus, string> = {
  live: "Published",
  pending_review: "In review",
  paused: "Paused",
  rejected: "Rejected"
};

export function MyListingDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const listingId = params.id as string;
  const propertyId = Number(listingId);

  const { data: property, isLoading, error, refetch } = useMyProperty(propertyId);
  const deleteProperty = useDeleteProperty(propertyId);
  const setStatus = useSetListingStatus(propertyId);

  const [confirmDelete, setConfirmDelete] = useState(false);

  /** Pause a live listing or resume a paused one. The server refuses any other state with 409. */
  function handleToggleStatus(target: "live" | "paused") {
    if (setStatus.isPending) return;
    setStatus.mutate(target, {
      onSuccess: () =>
        uiStore.getState().pushToast({
          type: "success",
          title: target === "paused" ? "Listing paused" : "Listing resumed",
          description:
            target === "paused"
              ? "It is hidden from search until you resume it."
              : "It is visible in search again."
        }),
      onError: (err) =>
        uiStore.getState().pushToast({
          type: "error",
          title: target === "paused" ? "Could not pause listing" : "Could not resume listing",
          description: userMessage(err, "Please try again.")
        })
    });
  }

  function handleDelete() {
    if (deleteProperty.isPending) return;
    deleteProperty.mutate(undefined, {
      onSuccess: () => {
        setConfirmDelete(false);
        uiStore.getState().pushToast({ type: "success", title: "Listing deleted" });
        navigate("/manage");
      },
      onError: (err) => {
        setConfirmDelete(false);
        uiStore.getState().pushToast({
          type: "error",
          title: "Could not delete listing",
          description: userMessage(err, "Please try again.")
        });
      }
    });
  }

  if (isLoading) {
    return (
      <Page width="default">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48 rounded-cut-md" />
          <Skeleton className="h-11 w-32 rounded-cut-md" />
        </div>
        {/* Loaded layout is ListingCard + status/manage cards — not public listingDetail */}
        <Skeleton variant="listingCard" />
        <div className="rounded-hand bg-surface paper-grain shadow-sm p-5">
          <Skeleton className="mb-3 h-5 w-28 rounded-full" />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="mb-2 flex flex-col gap-1">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-4 w-32 rounded-full" />
            </div>
          ))}
        </div>
        <div className="rounded-hand bg-surface paper-grain shadow-sm p-5">
          <Skeleton className="mb-3 h-5 w-32 rounded-full" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-10 w-24 rounded-cut-md" />
            <Skeleton className="h-10 w-24 rounded-cut-md" />
            <Skeleton className="h-10 w-24 rounded-cut-md" />
          </div>
        </div>
      </Page>
    );
  }

  const status = property ? ownerListingStatus(property) : "pending_review";

  return (
    <Page width="default">
      <PageHeader
        title={property?.title ?? "Your listing"}
        actions={
          property ? (
            <Button
              variant="secondary"
              size="compact"
              leadingIcon={<Pencil aria-hidden="true" className="h-4 w-4" />}
              onClick={() => navigate(`/my-listings/${listingId}/edit`)}
            >
              Edit listing
            </Button>
          ) : undefined
        }
      />

      {error ? (
        <InlineError onRetry={() => refetch()} title="Could not load listing" description="Please try again." />
      ) : !property ? (
        <EmptyState
          scene="house"
          title="Listing not found"
          description="This listing may have been removed or you don't have access."
        />
      ) : (
        <>
          <ListingCard listing={propertyToListingCardProps(property)} layout="horizontal" />

          <Card className="p-5">
            <h2 className="mb-3 text-h3 text-ink">Listing Status</h2>
            <div className="flex flex-col gap-2 text-body-md text-ink-2">
              <p>
                <span className="font-semibold text-ink">Status:</span>{" "}
                {LISTING_STATUS_LABEL[status]}
              </p>
              <p>
                <span className="font-semibold text-ink">Views:</span> {property.view_count ?? 0}
              </p>
              <p>
                <span className="font-semibold text-ink">Interested:</span> {property.interest_count ?? 0}
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-h3 text-ink">Manage Listing</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {status === "live" ? (
                <Button
                  variant="secondary"
                  leadingIcon={<Pause aria-hidden="true" className="h-4 w-4" />}
                  loading={setStatus.isPending}
                  onClick={() => handleToggleStatus("paused")}
                >
                  Pause listing
                </Button>
              ) : null}
              {status === "paused" ? (
                <Button
                  variant="secondary"
                  leadingIcon={<Play aria-hidden="true" className="h-4 w-4" />}
                  loading={setStatus.isPending}
                  onClick={() => handleToggleStatus("live")}
                >
                  Resume listing
                </Button>
              ) : null}
              <Button
                variant="tertiary"
                leadingIcon={<Trash2 aria-hidden="true" className="h-4 w-4" />}
                className="text-error sm:ml-auto"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            </div>
          </Card>
        </>
      )}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this listing?"
        description="This permanently removes the listing and its photos. This cannot be undone."
        footer={
          <>
            <Button variant="tertiary" onClick={() => setConfirmDelete(false)}>
              Keep listing
            </Button>
            <Button variant="destructive"
              
              loading={deleteProperty.isPending}
              onClick={handleDelete}
>
              Delete listing
            </Button>
          </>
        }
      />

    </Page>
  );
}
