import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useMyProperties } from "@/features/listings/hooks/useProperties";
import { propertyToListingCardProps } from "@/features/listings/lib/adapters";
import { Button } from "@/components/ui/Button";
import { ChoiceChips } from "@/components/ui/ChoiceChips";
import { SelectField } from "@/components/ui/Input";
import { Page, PageHeader } from "@/components/ui/Layout";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView, EmptyState } from "@/components/ui/StateViews";
import { ListingCard } from "@/features/listings/components/ListingCard";

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
    <Page width="wide">
      <PageHeader
        title="Your listings"
        description="Rooms you have posted, with what needs your attention."
        actions={
          <Button size="compact" leadingIcon={<Plus aria-hidden="true" className="h-4 w-4" />} onClick={() => navigate("/post")}>
            New listing
          </Button>
        }
      />

      {/* Client-side: /properties/me has no status or sort params. */}
      {properties && properties.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto scrollbar-none bleed-x sm:mx-0 sm:px-0">
            <ChoiceChips label="Status" options={STATUS_FILTERS} value={statusFilter} onValueChange={setStatusFilter} className="flex-nowrap" />
          </div>
          <SelectField
            aria-label="Sort listings"
            fullWidth={false}
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>
      ) : null}

      <AsyncView
        data={filteredProperties}
        isLoading={isLoading}
        error={error}
        isEmpty={(data) => data.length === 0}
        loading={<Skeleton variant="listingCard" count={3} className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))]" />}
        empty={
          <div className="paper-grain rounded-hand bg-surface py-6 shadow-xs">
            {statusFilter === "all" ? (
              <EmptyState scene="house" title="No listings yet" description="Post a room and it shows up here with its views, likes and chats." actionLabel="Post your first room" onAction={() => navigate("/post")} />
            ) : (
              <EmptyState scene="magnifier" title={`Nothing ${STATUS_FILTERS.find((f) => f.value === statusFilter)?.label.toLowerCase() ?? "here"}`} description="Try another status." actionLabel="Show all listings" onAction={() => setStatusFilter("all")} />
            )}
          </div>
        }
        onRetry={() => refetch()}
      >
        {(data) => (
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))]">
            {data.map((property) => (
              <ListingCard
                key={property.id}
                listing={propertyToListingCardProps(property)}
                ctaLabel="Manage"
                onOpen={(id) => navigate(`/my-listings/${id}`)}
              />
            ))}
          </div>
        )}
      </AsyncView>
    </Page>
  );
}
