import { useMemo, useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useStore } from "zustand";
import { useQueryStates } from "nuqs";
import { SeoHelmet, SITE_URL } from "@/lib/seo";
import { Search, SlidersHorizontal, Loader2, X } from "lucide-react";

import { useInfiniteWebSearch } from "@/hooks/queries/useSearch";
import { useAmenities, useCities } from "@/hooks/queries/useCatalogs";
import { propertyToListingCardProps } from "@/lib/api/adapters";
import type { SearchFilters } from "@/lib/api/types";
import { searchPageParams } from "@/lib/schemas/search-params";
import { searchStore } from "@/lib/stores/search-store";
import { type FilterSection, FilterPanel } from "@/components/molecules/FilterPanel";
import { type ListingCardData, ListingCard } from "@/components/molecules/ListingCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input, SelectField } from "@/components/ui/Input";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/Layout";
import { BottomSheet } from "@/components/ui/Modal";

const breadcrumb = [{ name: "Search", item: `${SITE_URL}/search` }];

export function SearchPage() {
  const navigate = useNavigate();

  const [params, setParams] = useQueryStates(searchPageParams, {
    history: "replace",
    shallow: true,
  });

  const PAGE_SIZE = 20;

  const { data: cities, isLoading: citiesLoading } = useCities();
  const { data: amenities, isLoading: amenitiesLoading } = useAmenities();

  const [localSearch, setLocalSearch] = useState(params.q || "");

  // Sync URL → local input when deep-linking a query. Adjusting state during
  // render (vs. setState-in-effect) is React's recommended pattern here.
  const [syncedQ, setSyncedQ] = useState(params.q);
  if (params.q !== syncedQ) {
    setSyncedQ(params.q);
    setLocalSearch(params.q || "");
  }

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // One-time migration from the legacy `?page=N` URL shape to the new cursor-
  // based `?cursor=<opaque>` shape. Old shared links still land on a sensible
  // first page; after this effect runs once, the URL is replaced with the
  // canonical form.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const legacyPage = url.searchParams.get("page");
    if (legacyPage !== null) {
      url.searchParams.delete("page");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const filters: Omit<SearchFilters, "page"> = useMemo(
    () => ({
      q: params.q || undefined,
      city: cities?.find((c) => c.id === params.city)?.name,
      // "4+" is an open-ended BHK filter (no upper bound); numeric strings
      // are exact. Avoids Number("4+") → NaN leaking into the query.
      bedrooms_min:
        params.bedrooms === "4+"
          ? 4
          : params.bedrooms
            ? Number(params.bedrooms)
            : undefined,
      bedrooms_max:
        params.bedrooms && params.bedrooms !== "4+"
          ? Number(params.bedrooms)
          : undefined,
      amenities: params.amenities.length > 0 ? params.amenities : undefined,
      price_min: params.priceMin ?? undefined,
      price_max: params.priceMax ?? undefined,
      limit: PAGE_SIZE,
    }),
    [params.q, params.city, params.bedrooms, params.amenities, params.priceMin, params.priceMax, cities]
  );

  const {
    data: searchResults,
    isLoading,
    isError,
    error,
    isFetching,
    isPlaceholderData,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteWebSearch(filters, {
    // Block the first fetch until catalogs are loaded so the city/amenity
    // resolution doesn't flash an "all cities" result on deep links.
    enabled: !citiesLoading && !amenitiesLoading
  });

  const recentSearches = useStore(searchStore, (s) => s.recentSearches);
  const addRecentSearch = useStore(searchStore, (s) => s.addRecentSearch);
  const clearRecentSearches = useStore(searchStore, (s) => s.clearRecentSearches);

  // NOTE: We deliberately do NOT mirror URL params into the persisted
  // `searchStore` here. Doing so poisons the map filter on next reload
  // because the store is shared across surfaces (search ↔ map).

  // Reset scroll to top when the filter set changes (UX parity with ExplorePage).
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [params.q, params.city, params.bedrooms, params.amenities, params.priceMin, params.priceMax, params.cursor]);

  const listings: ListingCardData[] = useMemo(() => {
    if (!searchResults?.pages) return [];
    const allListings = searchResults.pages.flatMap((page) =>
      (page.results || [])
        .filter(
          (r): r is Extract<typeof r, { property_type: unknown }> =>
            "property_type" in (r as unknown as Record<string, unknown>)
        )
        .map((r) =>
          propertyToListingCardProps(
            r as Parameters<typeof propertyToListingCardProps>[0]
          )
        )
    );

    const seen = new Set<string | number>();
    return allListings.filter((listing) => {
      if (seen.has(listing.id)) return false;
      seen.add(listing.id);
      return true;
    });
  }, [searchResults]);

  const totalResults = searchResults?.pages[0]?.total ?? listings.length;
  const hasSettledSearchResults =
    !isPlaceholderData && !isFetching && !isError && totalResults > 0;

  // Record a successful, non-empty text query into recent searches.
  useEffect(() => {
    if (params.q && hasSettledSearchResults) {
      addRecentSearch(params.q);
    }
  }, [params.q, hasSettledSearchResults, addRecentSearch]);

  const filterSections: FilterSection[] = useMemo(
    () => [
      {
        id: "city",
        title: "City",
        options:
          cities?.map((c) => ({
            value: String(c.id),
            label: c.name,
            selected: c.id === params.city,
          })) ?? [],
      },
      {
        id: "bedrooms",
        title: "Bedrooms",
        options: ["1", "2", "3", "4+"].map((b) => ({
          value: b,
          label: `${b} BHK`,
          selected: params.bedrooms === b,
        })),
      },
      ...(amenities
        ? [
          {
            id: "amenities",
            title: "Amenities",
            options: amenities.slice(0, 10).map((a) => ({
              value: a.name,
              label: a.name,
              selected: params.amenities.includes(a.name),
            })),
          },
        ]
        : []),
    ],
    [cities, params.city, params.bedrooms, amenities, params.amenities]
  );

  const handleFilterToggle = useCallback(
    (sectionId: string, value: string) => {
      if (sectionId === "city") {
        setParams({ city: Number(value), cursor: "" });
      } else if (sectionId === "bedrooms") {
        setParams({
          bedrooms: params.bedrooms === value ? "" : value,
          cursor: "",
        });
      } else if (sectionId === "amenities") {
        const next = params.amenities.includes(value)
          ? params.amenities.filter((a) => a !== value)
          : [...params.amenities, value];
        setParams({ amenities: next, cursor: "" });
      }
    },
    [params.bedrooms, params.amenities, setParams]
  );

  const handleClearFilters = useCallback(() => {
    setParams(null);
    setLocalSearch("");
  }, [setParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams({ q: localSearch, cursor: "" });
  };

  // Intersection Observer for Infinite Scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      <SeoHelmet
        title="Search Flatmates & Rooms"
        description="Search for compatible flatmates and verified rental listings across Indian cities by budget, location, amenities, and lifestyle preferences."
        canonicalUrl={`${SITE_URL}/search`}
        breadcrumb={breadcrumb}
      />

      <main id="main" className="page-fade mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Title Header */}
        <PageHeader
          title="Search Listings"
          description="Find verified properties by query, budget, city, or configuration."
          className="mb-6"
          actions={
            <Button variant="secondary" size="compact" onClick={() => navigate("/saved-searches")} className="rounded-xl">
              Saved Searches
            </Button>
          }
        />

        {/* Unified Search & Quick Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 border border-line bg-surface p-3 rounded-2xl mb-6 shadow-xs">
          <form onSubmit={handleSearchSubmit} role="search" className="flex-1 min-w-[280px]">
            <Input
              type="search"
              aria-label="Search listings by city, locality, or keyword"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by city, locality, or keyword (e.g. 1BHK, WiFi)..."
              leadingIcon={<Search className="h-4.5 w-4.5" />}
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* City Dropdown */}
            <SelectField
              aria-label="Filter by city"
              value={String(params.city ?? 0)}
              onChange={(e) => setParams({ city: Number(e.target.value), cursor: "" })}
              fullWidth={false}
              options={[
                { value: "0", label: "All Cities" },
                ...(cities?.map((c) => ({ value: String(c.id), label: c.name })) ?? []),
              ]}
            />

            {/* Bedrooms Dropdown */}
            <SelectField
              aria-label="Filter by bedrooms"
              value={params.bedrooms ?? ""}
              onChange={(e) => setParams({ bedrooms: e.target.value, cursor: "" })}
              fullWidth={false}
              options={[
                { value: "", label: "All BHKs" },
                { value: "1", label: "1 BHK" },
                { value: "2", label: "2 BHK" },
                { value: "3", label: "3 BHK" },
                { value: "4+", label: "4+ BHK" },
              ]}
            />

            {/* Amenities dialog button */}
            <Button
              variant="secondary"
              size="compact"
              className="h-9 rounded-xl border-line text-body-sm font-semibold text-ink-2"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
              Filters {params.amenities.length > 0 ? `(${params.amenities.length})` : ""}
            </Button>

            {/* Clear Filters */}
            {(params.q || params.city !== 0 || params.bedrooms || params.amenities.length > 0) && (
              <Button
                variant="icon"
                size="compact"
                className="text-body-sm text-accent hover:text-accent font-semibold px-2"
                onClick={handleClearFilters}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-eyebrow uppercase tracking-widest text-ink-3">Recent:</span>
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setLocalSearch(term);
                  setParams({ q: term, cursor: "" });
                }}
                className="rounded-full border border-line bg-surface px-3 py-1 text-body-sm text-ink-2 transition-colors hover:border-accent/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {term}
              </button>
            ))}
            <button
              type="button"
              onClick={clearRecentSearches}
              aria-label="Clear recent searches"
              className="ml-1 inline-flex items-center gap-1 text-body-sm text-ink-3 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear
            </button>
          </div>
        )}

        {/* Listings Container */}
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
                  onRetry={() => refetch()}
                />
              </Card>
            ) : listings.length === 0 ? (
              <EmptyState
                title="No results found"
                description="Try clearing your filters or refining your search query."
                actionLabel="Clear Filters"
                onAction={handleClearFilters}
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {listings.map((listing, index) => (
                  <div
                    key={listing.id}
                    id={`listing-card-${listing.id}`}
                    className="card-appear motion-reduce:animate-none transition-all duration-300 rounded-2xl"
                    style={{ animationDelay: `${Math.min(index % PAGE_SIZE, 10) * 50}ms` }}
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
      </main>

      {/* Filter panel drawer */}
      <BottomSheet
        open={mobileFiltersOpen}
        title="All Filters"
        onClose={() => setMobileFiltersOpen(false)}
      >
        <div className="max-h-[70vh] overflow-y-auto px-4 pb-6">
          <FilterPanel
            sections={filterSections}
            onFilterToggle={handleFilterToggle}
            onClear={handleClearFilters}
            onApply={() => {
              setParams({ cursor: "" });
              refetch();
              setMobileFiltersOpen(false);
            }}
          />
        </div>
      </BottomSheet>
    </>
  );
}
