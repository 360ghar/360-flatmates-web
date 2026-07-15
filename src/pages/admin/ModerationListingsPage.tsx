import { useMemo, useState } from "react";
import { useInfiniteAdminListings, useAdminModerate } from "@/hooks/queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageLayout, PageHeader } from "@/components/ui/Layout";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView, EmptyState, ErrorState } from "@/components/ui/StateViews";
import { uiStore } from "@/lib/stores/ui-store";
import type { FlatmateListingAdmin, PropertyModerationStatus } from "@/lib/api/types";
import { ModerationListingRow } from "./ModerationListingRow";
import { ModerationListingsFilterBar, type ListingStatusFilter } from "./ModerationListingsFilterBar";
import { ModerationListingActionModals } from "./ModerationListingActionModals";

type StatusFilter = ListingStatusFilter;

export function ModerationListingsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending_review");
  const filters = useMemo(
    () =>
      statusFilter === "all"
        ? undefined
        : { status: statusFilter as PropertyModerationStatus },
    [statusFilter]
  );
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch
  } = useInfiniteAdminListings(filters);
  const moderate = useAdminModerate();

  // Track the listing id currently being actioned so only its row shows the
  // loading/disabled state (never the whole queue) and to prevent double-submit.
  const [actingId, setActingId] = useState<number | null>(null);
  const [approveTarget, setApproveTarget] = useState<FlatmateListingAdmin | null>(null);
  const [rejectTarget, setRejectTarget] = useState<FlatmateListingAdmin | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Flatten the paginated pages into a single array for rendering + search.
  const allListings = useMemo<FlatmateListingAdmin[]>(
    () => (data?.pages ?? []).flatMap((page) => page.items),
    [data]
  );
  const totalCount = data?.pages?.[0]?.total ?? 0;

  // If the target listing scrolls out of the queue (e.g. after pagination
  // or a status filter change) while a modal is open, treat it as closed.
  const liveApproveTarget =
    approveTarget && allListings.some((l) => l.id === approveTarget.id)
      ? approveTarget
      : null;
  const liveRejectTarget =
    rejectTarget && allListings.some((l) => l.id === rejectTarget.id)
      ? rejectTarget
      : null;

  const filtered = useMemo(
    () => {
      if (!search) return allListings;
      const needle = search.toLowerCase();
      return allListings.filter(
        (l) =>
          l.title.toLowerCase().includes(needle) ||
          l.owner_name.toLowerCase().includes(needle) ||
          l.locality.toLowerCase().includes(needle)
      );
    },
    [search, allListings]
  );

  function handleConfirmApprove() {
    if (!liveApproveTarget || actingId !== null) return;
    const target = liveApproveTarget;
    setActingId(target.id);
    moderate.mutate(
      { listingId: target.id, payload: { action: "approve" } },
      {
        onSuccess: () => {
          setApproveTarget(null);
          uiStore.getState().pushToast({
            type: "success",
            title: "Listing approved",
            description: `"${target.title}" is now live.`
          });
        },
        onError: () => {
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not approve listing",
            description: "Please try again."
          });
        },
        onSettled: () => setActingId(null)
      }
    );
  }

  function handleConfirmReject() {
    if (!liveRejectTarget || !rejectReason.trim() || actingId !== null) return;
    const target = liveRejectTarget;
    setActingId(target.id);
    moderate.mutate(
      { listingId: target.id, payload: { action: "reject", reason: rejectReason.trim() } },
      {
        onSuccess: () => {
          setRejectTarget(null);
          setRejectReason("");
          uiStore.getState().pushToast({
            type: "success",
            title: "Listing rejected",
            description: `"${target.title}" was rejected.`
          });
        },
        onError: () => {
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not reject listing",
            description: "Please try again."
          });
        },
        onSettled: () => setActingId(null)
      }
    );
  }

  const isFirstPageLoading = isLoading;
  const hasSearch = search.trim().length > 0;
  const emptyTitle = hasSearch
    ? "No matches"
    : statusFilter === "pending_review"
      ? "No pending listings"
      : "No listings";
  const emptyDescription = hasSearch
    ? `No listings match "${search}".`
    : statusFilter === "pending_review"
      ? "All listings have been reviewed. Check back later."
      : "Try a different status filter.";

  return (
    <PageLayout>
      <PageHeader
        eyebrow="Moderation"
        title="Listing Review Queue"
        description="Review and moderate listings before they go live."
      />

      <div className="mt-6 flex flex-col gap-4">
        <ModerationListingsFilterBar
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          onSearchClear={() => setSearch("")}
          totalCount={totalCount}
          filteredCount={filtered.length}
        />

        <AsyncView
          data={allListings}
          isLoading={isFirstPageLoading}
          error={error}
          onRetry={() => refetch()}
          isEmpty={(d) => d.length === 0}
          loading={<Skeleton variant="moderationRow" count={5} />}
          empty={
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              actionLabel={hasSearch ? "Clear search" : undefined}
              onAction={hasSearch ? () => setSearch("") : undefined}
            />
          }
          errorView={
            <Card className="flex items-center justify-center p-6">
              <ErrorState
                title="Could not load listings"
                description="Please try again."
                onRetry={() => refetch()}
              />
            </Card>
          }
        >
          {() => (
            <>
              <ul className="flex flex-col gap-3">
                {filtered.map((listing: FlatmateListingAdmin) => (
                  <li key={listing.id}>
                    <ModerationListingRow
                      listing={listing}
                      onApprove={() => setApproveTarget(listing)}
                      onReject={() => {
                        setRejectTarget(listing);
                        setRejectReason("");
                      }}
                      isActing={actingId === listing.id}
                      actionsDisabled={actingId !== null}
                    />
                  </li>
                ))}
              </ul>
              {hasNextPage ? (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="secondary"
                    size="compact"
                    onClick={() => fetchNextPage()}
                    loading={isFetchingNextPage}
                  >
                    Load more
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </AsyncView>
      </div>

      <ModerationListingActionModals
        approveTarget={liveApproveTarget}
        rejectTarget={liveRejectTarget}
        rejectReason={rejectReason}
        onRejectReasonChange={setRejectReason}
        isPending={moderate.isPending}
        onCancelApprove={() => setApproveTarget(null)}
        onConfirmApprove={handleConfirmApprove}
        onCancelReject={() => {
          setRejectTarget(null);
          setRejectReason("");
        }}
        onConfirmReject={handleConfirmReject}
      />
    </PageLayout>
  );
}
