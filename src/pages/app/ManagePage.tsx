import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useMyProperties } from "@/hooks/queries";
import { propertyToListingCardProps } from "@/lib/api/adapters";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView } from "@/components/ui/StateViews";
import { ListingCard } from "@/components/molecules/ListingCard";
import { humanizeSnakeCase } from "@/lib/utils";

/* Client-side status buckets. The OpenAPI /properties/me endpoint does not
   support status filters or sort, so we derive these from the response. */
type StatusFilter = "all" | "approved" | "pending_review" | "rejected" | "draft" | "paused" | "expired";
type SortKey = "newest" | "oldest" | "rent_low" | "rent_high";

const STATUS_FILTERS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "approved", label: "Published" },
  { value: "pending_review", label: "Under review" },
  { value: "rejected", label: "Rejected" },
  { value: "draft", label: "Draft" },
  { value: "paused", label: "Paused" },
  { value: "expired", label: "Expired" }
];

const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "rent_low", label: "Rent: low to high" },
  { value: "rent_high", label: "Rent: high to low" }
];

export function ManagePage() {
  const navigate = useNavigate();
  const { data: properties, isLoading, error, refetch } = useMyProperties();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  const filteredProperties = useMemo(() => {
    if (!properties) return [];
    const filtered =
      statusFilter === "all"
        ? properties
        : properties.filter((p) => (p.property_status ?? "draft") === statusFilter);

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sortKey) {
        case "oldest":
          return (a.created_at ?? "").localeCompare(b.created_at ?? "");
        case "rent_low":
          return (a.monthly_rent ?? 0) - (b.monthly_rent ?? 0);
        case "rent_high":
          return (b.monthly_rent ?? 0) - (a.monthly_rent ?? 0);
        case "newest":
        default:
          return (b.created_at ?? "").localeCompare(a.created_at ?? "");
      }
    });
    return sorted;
  }, [properties, statusFilter, sortKey]);

  return (
    <div className="flex flex-col gap-5 page-fade">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-h1">Post & Manage</h1>
        <Button
          size="compact"
          leadingIcon={<Plus aria-hidden="true" className="h-4 w-4" />}
          onClick={() => navigate("/post")}
        >
          New Listing
        </Button>
      </div>

      {/* Filters (client-side: /properties/me has no status/sort params) */}
      {properties && properties.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2" aria-label="Filter by status">
            {STATUS_FILTERS.map((opt) => (
              <Chip
                key={opt.value}
                selected={statusFilter === opt.value}
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="manage-sort" className="text-caption text-ink-3">
              Sort
            </label>
            <select
              id="manage-sort"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-9 rounded-[8px] border border-line bg-surface px-3 text-body-md text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {statusFilter !== "all" ? (
              <span className="text-caption text-ink-3">
                {filteredProperties.length} of {properties.length} {humanizeSnakeCase(statusFilter)}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <AsyncView
        data={filteredProperties}
        isLoading={isLoading}
        error={error}
        isEmpty={(data) => data.length === 0}
        loading={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton variant="listingCard" count={3} />
          </div>
        }
        empty={
          <Card className="flex flex-col items-center gap-3 p-8 text-center">
            {statusFilter === "all" ? (
              <>
                <p className="text-body-md text-ink-2">You have not posted any listings yet.</p>
                <Button onClick={() => navigate("/post")}>Post your first listing</Button>
              </>
            ) : (
              <>
                <p className="text-body-md text-ink-2">
                  No listings match the current filter.
                </p>
                <Button variant="secondary" onClick={() => setStatusFilter("all")}>
                  Show all listings
                </Button>
              </>
            )}
          </Card>
        }
        onRetry={() => refetch()}
      >
        {(data) => (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.map((property) => (
              <ListingCard
                key={property.id}
                listing={propertyToListingCardProps(property)}
                ctaLabel="Manage"
                onOpen={(id) => {
                  navigate(`/my-listings/${id}`);
                }}
              />
            ))}
          </div>
        )}
      </AsyncView>
    </div>
  );
}
