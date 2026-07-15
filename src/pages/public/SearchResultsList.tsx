import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { ListingCard, type ListingCardData } from "@/components/molecules/ListingCard";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";

export function SearchResultsList({
  isLoading,
  isError,
  error,
  listings,
  totalResults,
  isFetching,
  isFetchingNextPage,
  hasNextPage,
  pageSize,
  observerTarget,
  onRetry,
  onClearFilters
}: {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  listings: ListingCardData[];
  totalResults: number;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  pageSize: number;
  observerTarget: React.RefObject<HTMLDivElement | null>;
  onRetry: () => void;
  onClearFilters: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-w-0 min-h-[550px] gap-4">
      <div className="flex items-center justify-between">
        <span
          className="flex items-center gap-2 text-eyebrow text-ink-3 tracking-widest uppercase"
          aria-live="polite"
          aria-atomic="true"
        >
          {isLoading && listings.length === 0 ? (
            <Skeleton className="h-4 w-28" />
          ) : isError && listings.length === 0 ? (
            "Search unavailable"
          ) : (
            <>
              {`${totalResults} results found`}
              {isFetching && !isFetchingNextPage && listings.length > 0 ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none text-ink-3" aria-hidden="true" />
              ) : null}
            </>
          )}
        </span>
      </div>

      {/* Scrolling list */}
      <div id="listings-scroll-container" className="flex-1">
        {isLoading && listings.length === 0 ? (
          <Skeleton
            variant="listingCard"
            count={8}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          />
        ) : isError && listings.length === 0 ? (
          <Card className="flex items-center justify-center p-8">
            <ErrorState
              title="Could not load listings"
              description={
                error instanceof Error
                  ? error.message
                  : "Check your connection and try again."
              }
              onRetry={onRetry}
            />
          </Card>
        ) : listings.length === 0 ? (
          <EmptyState
            title="No results found"
            description="Try clearing your filters or refining your search query."
            actionLabel="Clear Filters"
            onAction={onClearFilters}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {listings.map((listing, index) => (
              <div
                key={listing.id}
                id={`listing-card-${listing.id}`}
                className="card-appear motion-reduce:animate-none transition-all duration-300 rounded-2xl"
                style={{ animationDelay: `${Math.min(index % pageSize, 10) * 50}ms` }}
              >
                <ListingCard
                  listing={listing}
                  ctaLabel="View Details"
                  onOpen={(id) => navigate(`/discover/${id}`)}
                  onContact={(id) => navigate(`/discover/${id}`)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Infinite Scroll Sentinel */}
        {listings.length > 0 && (
          <div ref={observerTarget} className="mt-8 flex justify-center pb-8 h-20">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-ink-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-body-sm">Loading more...</span>
              </div>
            ) : !hasNextPage ? (
              <span className="text-body-sm text-ink-3">You've reached the end of the list.</span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
