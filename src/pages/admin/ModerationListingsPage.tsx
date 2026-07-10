import { useMemo, useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { useInfiniteAdminListings, useAdminModerate } from "@/hooks/queries";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { TextArea } from "@/components/ui/Input";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { PageLayout, PageHeader } from "@/components/ui/Layout";
import { PriceText } from "@/components/ui/PriceText";
import { SearchBar } from "@/components/ui/SearchBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView, EmptyState, ErrorState } from "@/components/ui/StateViews";
import { uiStore } from "@/lib/stores/ui-store";
import type { FlatmateListingAdmin, PropertyModerationStatus } from "@/lib/api/types";
import { PROPERTY_MODERATION_STATUS_VALUES } from "@/lib/data";

const STATUS_CHIP_LABELS: Record<PropertyModerationStatus, string> = {
  pending_review: "Pending",
  approved: "Approved",
  rejected: "Rejected"
};

const STATUS_OPTIONS: PropertyModerationStatus[] = [
  ...PROPERTY_MODERATION_STATUS_VALUES
];

type StatusFilter = PropertyModerationStatus | "all";

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

  // Status-filter chip labels. NOTE: when A-2/A-3 are resolved (REPORT_STATUS
  // and REPORT_ACTION divergence), audit the label set for reports and listings
  // together.
  const statusChips: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    ...STATUS_OPTIONS.map((status) => ({
      value: status as StatusFilter,
      label: STATUS_CHIP_LABELS[status]
    }))
  ];

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
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
          {statusChips.map((chip) => (
            <Chip
              key={chip.value}
              variant="choice"
              selected={statusFilter === chip.value}
              onClick={() => setStatusFilter(chip.value)}
            >
              {chip.label}
            </Chip>
          ))}
        </div>

        <SearchBar
          placeholder="Search by title, owner, or locality"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
        />

        <div className="flex items-center justify-between text-caption text-ink-3">
          <span>
            {totalCount > 0
              ? `${filtered.length} of ${totalCount} listing${totalCount === 1 ? "" : "s"}`
              : "No listings"}
          </span>
        </div>

        <AsyncView
          data={allListings}
          isLoading={isFirstPageLoading}
          error={error}
          onRetry={() => refetch()}
          isEmpty={(d) => d.length === 0}
          loading={
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex flex-col gap-1">
                          <Skeleton className="h-5 w-3/5" />
                          <Skeleton className="h-3 w-2/5" />
                        </div>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-1/5" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-18 rounded-[8px]" />
                        <Skeleton className="h-8 w-16 rounded-[8px]" />
                        <Skeleton className="h-8 w-16 rounded-[8px]" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          }
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
                    <ListingRow
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

      {/* Approve confirmation (mirrors the Reject modal so admins don't approve by accident) */}
      <Modal
        open={liveApproveTarget !== null}
        title="Approve Listing"
        description={
          liveApproveTarget
            ? `"${liveApproveTarget.title}" will be marked as approved and become visible to all users.`
            : ""
        }
        onClose={() => {
          if (moderate.isPending) return;
          setApproveTarget(null);
        }}
        footer={
          <>
            <Button
              size="compact"
              variant="secondary"
              onClick={() => setApproveTarget(null)}
              disabled={moderate.isPending}
            >
              Cancel
            </Button>
            <Button
              size="compact"
              variant="destructive"
              loading={moderate.isPending}
              onClick={handleConfirmApprove}
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

      {/* Reject confirmation (destructive: requires a reason) */}
      <Modal
        open={liveRejectTarget !== null}
        title="Reject Listing"
        description={
          liveRejectTarget
            ? `Provide a reason for rejecting "${liveRejectTarget.title}". The owner will see this.`
            : ""
        }
        onClose={() => {
          if (moderate.isPending) return;
          setRejectTarget(null);
          setRejectReason("");
        }}
        footer={
          <>
            <Button
              size="compact"
              variant="secondary"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason("");
              }}
              disabled={moderate.isPending}
            >
              Cancel
            </Button>
            <Button
              size="compact"
              variant="primary"
              loading={moderate.isPending}
              onClick={handleConfirmReject}
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
          onChange={(e) => setRejectReason(e.target.value)}
          rows={3}
        />
      </Modal>
    </PageLayout>
  );
}

function ListingRow({
  listing,
  onApprove,
  onReject,
  isActing,
  actionsDisabled
}: {
  listing: FlatmateListingAdmin;
  onApprove: () => void;
  onReject: () => void;
  isActing: boolean;
  actionsDisabled: boolean;
}) {
  const statusMap: Record<string, "pending" | "confirmed" | "rejected"> = {
    pending_review: "pending",
    approved: "confirmed",
    rejected: "rejected"
  };

  return (
    <Card as="div" variant="compact">
      <div className="flex items-start gap-3">
        <NetworkImage
          src={listing.main_image_url}
          alt={listing.title}
          wrapperClassName="h-16 w-16 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-body-lg font-semibold text-ink">
                {listing.title}
              </h3>
              <p className="text-caption text-ink-2">
                by {listing.owner_name} &middot; {listing.locality},{" "}
                {listing.city}
              </p>
            </div>
            <Badge
              variant="status"
              status={statusMap[listing.moderation_status] ?? "pending"}
            />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <PriceText value={listing.monthly_rent} variant="inline" />
            {listing.created_at && (
              <span suppressHydrationWarning className="text-caption text-ink-3">
                {new Date(listing.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
          <div className="relative z-10 mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Button
              size="compact"
              variant="primary"
              className="w-full sm:w-auto"
              loading={isActing}
              disabled={actionsDisabled && !isActing}
              leadingIcon={<CheckCircle2 aria-hidden="true" className="h-4 w-4" />}
              onClick={onApprove}
            >
              Approve
            </Button>
            <Button
              size="compact"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={actionsDisabled}
              leadingIcon={<XCircle aria-hidden="true" className="h-4 w-4" />}
              onClick={onReject}
            >
              Reject
            </Button>
            <Link
              to={`/admin/moderation/prescreen/${listing.id}`}
              className={buttonClasses("tertiary", "compact", false) + " w-full sm:w-auto"}
            >
              <Eye aria-hidden="true" className="h-4 w-4" />
              <span className="truncate">Review</span>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
