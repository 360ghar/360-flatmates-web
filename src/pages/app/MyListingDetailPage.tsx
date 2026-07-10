import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Pencil, Rocket, RefreshCw, Trash2 } from "lucide-react";
import {
  useMyProperty,
  useBoostListing,
  useRenewListing,
  useDeleteProperty
} from "@/hooks/queries";
import { propertyToListingCardProps } from "@/lib/api/adapters";
import { uiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { ListingCard } from "@/components/molecules/ListingCard";

const PROPERTY_STATUS_LABEL: Record<string, string> = {
  approved: "Published",
  pending_review: "Under Review",
  rejected: "Rejected",
  // TODO: F5 — A-20 will broaden the API enum to include these lifecycle
  // states. Pre-declaring the labels now means the UI will render them the
  // moment the backend returns them, without a follow-up patch.
  draft: "Draft",
  paused: "Paused",
  expired: "Expired"
};

/** Format a Date as a YYYY-MM-DD string in the user's local timezone (for
 *  date-input values and the renew payload). Using `toISOString` here would
 *  shift the date in non-UTC timezones — e.g. IST at 23:30 would become the
 *  next day. */
function localISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function MyListingDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const listingId = params.id as string;
  const propertyId = Number(listingId);

  const { data: property, isLoading, error, refetch } = useMyProperty(propertyId);
  const boostListing = useBoostListing();
  const renewListing = useRenewListing();
  const deleteProperty = useDeleteProperty(propertyId);

  // TODO: F5 — no Pause/Resume action. A-4 unifies lifecycle × moderation;
  // until that's unblocked we surface only the actions the API supports today.
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmBoost, setConfirmBoost] = useState(false);
  const [confirmRenew, setConfirmRenew] = useState(false);

  function handleBoost() {
    if (boostListing.isPending) return;
    setConfirmBoost(false);
    boostListing.mutate(
      { propertyId, payload: { duration: "7d" } },
      {
        onSuccess: () =>
          uiStore.getState().pushToast({
            type: "success",
            title: "Listing boosted",
            description: "Your listing will be promoted for 7 days."
          }),
        onError: (err) =>
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not boost listing",
            description: err instanceof Error ? err.message : "Please try again."
          })
      }
    );
  }

  function handleRenew() {
    if (renewListing.isPending) return;
    setConfirmRenew(false);
    const now = new Date();
    const expires = new Date(now);
    expires.setDate(expires.getDate() + 30);
    renewListing.mutate(
      { propertyId, payload: { available_from: localISODate(now), expires_at: localISODate(expires) } },
      {
        onSuccess: () =>
          uiStore.getState().pushToast({
            type: "success",
            title: "Listing renewed",
            description: "Your listing is active again for 30 days."
          }),
        onError: (err) =>
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not renew listing",
            description: err instanceof Error ? err.message : "Please try again."
          })
      }
    );
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
          description: err instanceof Error ? err.message : "Please try again."
        });
      }
    });
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 page-fade">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-9 rounded-[8px]" />
          <Skeleton className="h-8 w-16 rounded-[8px]" />
        </div>
        {/* Loaded layout is ListingCard + status/manage cards — not public listingDetail */}
        <Skeleton variant="listingCard" />
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <Skeleton className="mb-3 h-5 w-28 rounded-full" />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="mb-2 flex flex-col gap-1">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-4 w-32 rounded-full" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <Skeleton className="mb-3 h-5 w-32 rounded-full" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-10 w-24 rounded-[8px]" />
            <Skeleton className="h-10 w-24 rounded-[8px]" />
            <Skeleton className="h-10 w-24 rounded-[8px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 page-fade">
      <div className="flex items-center justify-between">
        <Button
          variant="icon"
          size="icon"
          onClick={() => navigate("/manage")}
          aria-label="Back to listings"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        {property && (
          <Button
            variant="secondary"
            size="compact"
            leadingIcon={<Pencil aria-hidden="true" className="h-4 w-4" />}
            onClick={() => navigate(`/my-listings/${listingId}/edit`)}
          >
            Edit
          </Button>
        )}
      </div>

      {error ? (
        <Card className="flex items-center justify-center p-8">
          <ErrorState onRetry={() => refetch()} title="Could not load listing" description="Please try again." />
        </Card>
      ) : !property ? (
        <EmptyState
          title="Listing not found"
          description="This listing may have been removed or you don't have access."
        />
      ) : (
        <>
          <ListingCard
            listing={propertyToListingCardProps(property)}
            onOpen={() => {}}
          />

          <Card className="p-5">
            <h2 className="text-h3 mb-3">Listing Status</h2>
            <div className="flex flex-col gap-2 text-body-md text-ink-2">
              <p>
                <span className="font-semibold text-ink">Status:</span>{" "}
                {PROPERTY_STATUS_LABEL[property.property_status ?? ""] ?? "Draft"}
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
            <h2 className="text-h3 mb-3">Manage Listing</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                variant="secondary"
                leadingIcon={<Rocket aria-hidden="true" className="h-4 w-4" />}
                onClick={() => setConfirmBoost(true)}
              >
                Boost
              </Button>
              <Button
                variant="secondary"
                leadingIcon={<RefreshCw aria-hidden="true" className="h-4 w-4" />}
                onClick={() => setConfirmRenew(true)}
              >
                Renew
              </Button>
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
            <Button
              variant="primary"
              className="bg-error hover:bg-error focus-visible:outline-error"
              loading={deleteProperty.isPending}
              onClick={handleDelete}
            >
              Delete listing
            </Button>
          </>
        }
      />

      {/* Boost confirmation (limited/paid slots — confirm before spending) */}
      <Modal
        open={confirmBoost}
        onClose={() => setConfirmBoost(false)}
        title="Boost this listing?"
        description="Your listing will be promoted for 7 days. Boost slots are limited — only use this when you want maximum visibility."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmBoost(false)} className="w-full md:w-auto">
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={boostListing.isPending}
              onClick={handleBoost}
              className="w-full md:w-auto"
            >
              Boost for 7 days
            </Button>
          </>
        }
      />

      {/* Renew confirmation */}
      <Modal
        open={confirmRenew}
        onClose={() => setConfirmRenew(false)}
        title="Renew this listing?"
        description="Your listing will become active again for 30 days, starting today."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmRenew(false)} className="w-full md:w-auto">
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={renewListing.isPending}
              onClick={handleRenew}
              className="w-full md:w-auto"
            >
              Renew for 30 days
            </Button>
          </>
        }
      />
    </div>
  );
}
