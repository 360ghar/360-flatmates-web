import { useMemo, useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { useAdminListings, useAdminModerate } from "@/hooks/queries";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { PageLayout, PageHeader } from "@/components/ui/Layout";
import { PriceText } from "@/components/ui/PriceText";
import { SearchBar } from "@/components/ui/SearchBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView, EmptyState } from "@/components/ui/StateViews";
import type { FlatmateListingAdmin } from "@/lib/api/types";

export function ModerationListingsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error, refetch } = useAdminListings({
    status: "pending_review"
  });
  const moderate = useAdminModerate();

  const filtered = useMemo(
    () => {
      const listings = data?.listings ?? [];
      return search
        ? listings.filter(
            (l: FlatmateListingAdmin) =>
              l.title.toLowerCase().includes(search.toLowerCase()) ||
              l.owner_name.toLowerCase().includes(search.toLowerCase()) ||
              l.locality.toLowerCase().includes(search.toLowerCase())
          )
        : listings;
    },
    [search, data]
  );

  function handleAction(
    listingId: number,
    action: "approve" | "reject"
  ) {
    moderate.mutate(
      { listingId, payload: { action } },
      { onSuccess: () => refetch() }
    );
  }

  return (
    <PageLayout>
      <PageHeader
        eyebrow="Moderation"
        title="Listing Review Queue"
        description="Review and moderate pending listings before they go live."
      />

      <div className="mt-6 flex flex-col gap-4">
        <SearchBar
          placeholder="Search by title, owner, or locality"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
        />

        <AsyncView
          data={data}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          isEmpty={(d) => !d.listings?.length}
          loading={
            <div className="flex flex-col gap-3">
              <Skeleton variant="listItem" count={5} />
            </div>
          }
          empty={
            <EmptyState
              title="No pending listings"
              description="All listings have been reviewed. Check back later."
            />
          }
        >
          {() => (
            <div className="flex flex-col gap-3">
              {filtered.map((listing: FlatmateListingAdmin) => (
                <ListingRow
                  key={listing.id}
                  listing={listing}
                  onApprove={() => handleAction(listing.id, "approve")}
                  onReject={() => handleAction(listing.id, "reject")}
                  isActing={moderate.isPending}
                />
              ))}
              {filtered.length === 0 && search && (
                <EmptyState
                  title="No matches"
                  description={`No listings match "${search}".`}
                />
              )}
            </div>
          )}
        </AsyncView>
      </div>
    </PageLayout>
  );
}

function ListingRow({
  listing,
  onApprove,
  onReject,
  isActing
}: {
  listing: FlatmateListingAdmin;
  onApprove: () => void;
  onReject: () => void;
  isActing: boolean;
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
              <span className="text-caption text-ink-3">
                {new Date(listing.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="compact"
              variant="primary"
              loading={isActing}
              leadingIcon={<CheckCircle2 aria-hidden="true" className="h-4 w-4" />}
              onClick={onApprove}
            >
              Approve
            </Button>
            <Button
              size="compact"
              variant="secondary"
              loading={isActing}
              leadingIcon={<XCircle aria-hidden="true" className="h-4 w-4" />}
              onClick={onReject}
            >
              Reject
            </Button>
            <Link to={`/admin/moderation/prescreen/${listing.id}`}>
              <Button
                size="compact"
                variant="tertiary"
                leadingIcon={<Eye aria-hidden="true" className="h-4 w-4" />}
              >
                Review
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
