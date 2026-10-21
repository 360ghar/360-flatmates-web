import { useNavigate } from "react-router";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, InlineError } from "@/components/ui/StateViews";
import { cn } from "@/components/ui/component-utils";
import { ListingCard, type ListingCardData } from "./ListingCard";

export interface ListingGridProps {
  listings: ListingCardData[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onClearFilters?: () => void;
  skeletonCount?: number;
  /** Where a card opens. Defaults to the public listing page. */
  hrefFor?: (id: string) => string;
  className?: string;
}

/* Columns follow the space, not the breakpoint, so the grid fits the public
   page, the app shell and a sidebar-narrowed column alike. */
const GRID = "grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))]";

/** Loading, error, empty and loaded states of a listing grid in one place. */
export function ListingGrid({
  listings,
  isLoading = false,
  error,
  onRetry,
  emptyTitle = "No rooms match yet",
  emptyDescription = "Try another area or fewer filters.",
  onClearFilters,
  skeletonCount = 6,
  hrefFor = (id) => `/discover/${id}`,
  className
}: ListingGridProps) {
  const navigate = useNavigate();

  if (isLoading) return <Skeleton variant="listingCard" count={skeletonCount} className={cn(GRID, className)} />;
  if (error && listings.length === 0) {
    return <InlineError title="Could not load rooms" description="Check your connection and try again." onRetry={onRetry} className={className} />;
  }
  if (listings.length === 0) {
    return (
      <div className={cn("paper-grain rounded-hand bg-surface py-6 shadow-xs", className)}>
        <EmptyState
          scene="magnifier"
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={onClearFilters ? "Clear filters" : undefined}
          onAction={onClearFilters}
        />
      </div>
    );
  }

  return (
    <div className={cn(GRID, className)}>
      {listings.map((listing) => {
        // Viewing a listing is public; the detail page asks for sign-in only to contact.
        const href = hrefFor(listing.id);
        return <ListingCard key={listing.id} listing={listing} ctaLabel="View details" onOpen={() => navigate(href)} />;
      })}
    </div>
  );
}
