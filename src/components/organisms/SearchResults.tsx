import { type HTMLAttributes, type ReactNode, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2, SlidersHorizontal } from "lucide-react";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/StateViews";
import { FilterPanel, type FilterSection } from "../molecules/FilterPanel";
import { ListingCard, type ListingCardData } from "../molecules/ListingCard";
import { BottomSheet } from "../ui/Modal";
import { cn } from "../ui/component-utils";

export interface SearchResultsProps extends HTMLAttributes<HTMLElement> {
  listings: ListingCardData[];
  filters: FilterSection[];
  resultCount?: number;
  /**
   * Current page number, 1-based. Only used when `totalPages` is also
   * supplied (i.e. when the server emitted a `total` field via
   * `?include_total=true`). With cursor-only pagination this should be left
   * undefined and `hasMore` should drive the "Load more" affordance.
   */
  currentPage?: number;
  /**
   * Total page count. Only available when the backend supplied a `total`
   * count for the current query. Omit to disable the numbered paginator;
   * `hasMore` is then used to render a "Load more" button instead.
   */
  totalPages?: number;
  /** Whether more results are available via `loadMore` (cursor pagination). */
  hasMore?: boolean;
  /** Whether a fetch is in-flight (used to render a spinner on Load more). */
  isFetchingMore?: boolean;
  /** Triggered by the "Load more" button. */
  onLoadMore?: () => void;
  sortControl?: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onFilterToggle?: (sectionId: string, value: string) => void;
  onClearFilters?: () => void;
  onApplyFilters?: () => void;
  onSaveSearch?: () => void;
  onListingOpen?: (listingId: string) => void;
  onPageChange?: (page: number) => void;
}

export function SearchResults({
  listings,
  filters,
  resultCount = listings.length,
  currentPage = 1,
  totalPages = 1,
  hasMore = false,
  isFetchingMore = false,
  onLoadMore,
  sortControl,
  searchValue,
  onSearchChange,
  onFilterToggle,
  onClearFilters,
  onApplyFilters,
  onSaveSearch,
  onListingOpen,
  onPageChange,
  className,
  ...props
}: SearchResultsProps) {
  // Page-numbered paginator is only valid when the server provided a total
  // count. Otherwise we fall back to the cursor-driven "Load more" affordance.
  const hasTotalPages = totalPages > 1;
  const showNumberedPaginator = hasTotalPages;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Mobile filter sheet
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const handleMobileApply = useCallback(() => {
    setMobileFiltersOpen(false);
    onApplyFilters?.();
  }, [onApplyFilters]);

  /** Generate an array of page numbers to show (current, first, last, and neighbors) */
  function getPageNumbers(): number[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set<number>();
    pages.add(1);
    pages.add(totalPages);
    pages.add(currentPage);
    if (currentPage > 1) pages.add(currentPage - 1);
    if (currentPage < totalPages) pages.add(currentPage + 1);

    return Array.from(pages).sort((a, b) => a - b);
  }

  const pageNumbers = getPageNumbers();

  return (
    <section className={cn("grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]", className)} {...props}>
      <FilterPanel
        className="hidden lg:flex"
        sections={filters}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onApply={onApplyFilters}
        onClear={onClearFilters}
        onFilterToggle={onFilterToggle}
      />
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p
            className="text-eyebrow uppercase tracking-[0.16em] text-ink-3"
            aria-live="polite"
            aria-atomic="true"
          >
            {resultCount} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              className="lg:hidden"
              leadingIcon={<SlidersHorizontal aria-hidden="true" className="h-4 w-4" />}
              size="compact"
              variant="secondary"
              onClick={() => setMobileFiltersOpen(true)}
            >
              Filters
            </Button>
            {sortControl}
          </div>
        </div>
        {listings.length === 0 ? (
          <EmptyState
            actionLabel="Clear Filters"
            description="No listings match your filters."
            title="No results"
            onAction={onClearFilters}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing, index) => (
              <div
                key={listing.id}
                className="card-appear motion-reduce:animate-none"
                style={{ animationDelay: `${Math.min(index, 5) * 50}ms` }}
              >
                <ListingCard listing={listing} ctaLabel="View Details" onOpen={onListingOpen} />
              </div>
            ))}
          </div>
        )}

        {/* Cursor-driven "Load more" (preferred when total is unknown) */}
        {!showNumberedPaginator && hasMore && (
          <div className="mt-6 flex items-center justify-center">
            <Button
              variant="secondary"
              size="compact"
              onClick={() => onLoadMore?.()}
              disabled={isFetchingMore}
              aria-label="Load more results"
            >
              {isFetchingMore ? (
                <>
                  <Loader2 aria-hidden="true" className="mr-1.5 h-4 w-4 animate-spin" />
                  Loading more…
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        )}

        {/* Numbered paginator — only when the server supplied total count */}
        {showNumberedPaginator && (
          <nav aria-label="Search results pagination" className="mt-6 flex items-center justify-center gap-2">
            <Button
              leadingIcon={<ChevronLeft aria-hidden="true" className="h-4 w-4" />}
              variant="secondary"
              size="compact"
              disabled={!hasPrev}
              onClick={() => onPageChange?.(currentPage - 1)}
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {pageNumbers.map((page, idx) => {
                const prevPage = pageNumbers[idx - 1];
                const showEllipsis = prevPage !== undefined && page - prevPage > 1;

                return (
                  <span key={page} className="flex items-center gap-1">
                    {showEllipsis && (
                      <span className="px-1 text-ink-3" aria-hidden="true">&hellip;</span>
                    )}
                    <Button
                      variant={page === currentPage ? "primary" : "secondary"}
                      size="compact"
                      className="min-w-[36px]"
                      onClick={() => onPageChange?.(page)}
                      aria-current={page === currentPage ? "page" : undefined}
                    >
                      {page}
                    </Button>
                  </span>
                );
              })}
            </div>

            <Button
              trailingIcon={<ChevronRight aria-hidden="true" className="h-4 w-4" />}
              variant="secondary"
              size="compact"
              disabled={!hasNext}
              onClick={() => onPageChange?.(currentPage + 1)}
            >
              Next
            </Button>
          </nav>
        )}

        {(!showNumberedPaginator || (showNumberedPaginator && !hasMore)) && onSaveSearch && (
          <div className="mt-6 flex items-center justify-center">
            <Button onClick={onSaveSearch}>Save this search</Button>
          </div>
        )}
      </div>

      {/* Mobile filter sheet */}
      <BottomSheet
        open={mobileFiltersOpen}
        title="Filters"
        onClose={() => setMobileFiltersOpen(false)}
      >
        <FilterPanel
          sections={filters}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onFilterToggle={onFilterToggle}
          onClear={onClearFilters}
          onApply={handleMobileApply}
        />
      </BottomSheet>
    </section>
  );
}
