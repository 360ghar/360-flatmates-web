import { Loader2 } from "lucide-react";
import type { ListingCardData } from "./ListingCard";
import { ListingGrid } from "./ListingGrid";
import { Skeleton } from "@/components/ui/Skeleton";

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

  return (
    <div className="flex flex-col min-w-0 min-h-[550px] gap-4">
      <div className="flex items-center justify-between">
        <span
          className="flex items-center gap-2 text-body-md tabular-nums text-ink-2"
          aria-live="polite"
          aria-atomic="true"
        >
          {isLoading && listings.length === 0 ? (
            <Skeleton className="h-4 w-28" />
          ) : isError && listings.length === 0 ? (
            "Search unavailable"
          ) : (
            <>
              {`${totalResults} ${totalResults === 1 ? "room" : "rooms"}`}
              {isFetching && !isFetchingNextPage && listings.length > 0 ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none text-ink-3" aria-hidden="true" />
              ) : null}
            </>
          )}
        </span>
      </div>

      <div id="listings-scroll-container" className="flex-1">
        <ListingGrid
          listings={listings}
          isLoading={isLoading && listings.length === 0}
          error={isError ? error : undefined}
          onRetry={onRetry}
          onClearFilters={onClearFilters}
          emptyTitle="No rooms match that search"
          emptyDescription="Try a nearby area, a wider budget or fewer filters."
          skeletonCount={pageSize > 8 ? 8 : pageSize}
        />

        {/* Infinite Scroll Sentinel */}
        {listings.length > 0 && (
          <div ref={observerTarget} className="mt-8 flex justify-center pb-8 h-20">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-ink-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-body-sm">Loading more rooms</span>
              </div>
            ) : !hasNextPage ? (
              <span className="text-body-sm text-ink-3">That is every room for this search.</span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
