import { useMemo, useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useStore } from "zustand";
import { useQueryStates } from "nuqs";
import { SeoHelmet, SITE_URL } from "@/lib/seo";

import { useInfiniteWebSearch } from "@/hooks/queries/useSearch";
import { useAmenities, useCities } from "@/hooks/queries/useCatalogs";
import { propertyToListingCardProps } from "@/lib/api/adapters";
import type { SearchFilters, CatalogAmenity, CatalogCity } from "@/lib/api/types";
import { searchPageParams } from "@/lib/schemas/search-params";
import { searchStore } from "@/lib/stores/search-store";
import { type FilterSection, FilterPanel } from "@/components/molecules/FilterPanel";
import { type ListingCardData } from "@/components/molecules/ListingCard";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Layout";
import { BottomSheet } from "@/components/ui/Modal";
import { SearchQuickFilterBar } from "./SearchQuickFilterBar";
import { RecentSearchesRow } from "./RecentSearchesRow";
import { SearchResultsList } from "./SearchResultsList";

const breadcrumb = [{ name: "Search", item: `${SITE_URL}/search` }];

function buildSearchFilterSections(
  cities: CatalogCity[] | undefined,
  amenities: CatalogAmenity[] | undefined,
  selectedCity: number,
  selectedBedrooms: string,
  selectedAmenityNames: string[]
): FilterSection[] {
  const selectedAmenities = new Set(selectedAmenityNames);
  return [
    {
      id: "city",
      title: "City",
      options:
        cities?.map((c) => ({
          value: String(c.id),
          label: c.name,
          selected: c.id === selectedCity,
        })) ?? [],
    },
    {
      id: "bedrooms",
      title: "Bedrooms",
      options: ["1", "2", "3", "4+"].map((b) => ({
        value: b,
        label: `${b} BHK`,
        selected: selectedBedrooms === b,
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
            selected: selectedAmenities.has(a.name),
          })),
        },
      ]
      : []),
  ];
}

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
    () => buildSearchFilterSections(cities, amenities, params.city, params.bedrooms, params.amenities),
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
        <SearchQuickFilterBar
          localSearch={localSearch}
          onLocalSearchChange={setLocalSearch}
          onSearchSubmit={handleSearchSubmit}
          cities={cities}
          cityId={params.city ?? 0}
          onCityChange={(id) => setParams({ city: id, cursor: "" })}
          bedrooms={params.bedrooms ?? ""}
          onBedroomsChange={(value) => setParams({ bedrooms: value, cursor: "" })}
          amenitiesCount={params.amenities.length}
          onOpenFilters={() => setMobileFiltersOpen(true)}
          showClear={Boolean(params.q || params.city !== 0 || params.bedrooms || params.amenities.length > 0)}
          onClearFilters={handleClearFilters}
        />

        {/* Recent searches */}
        <RecentSearchesRow
          recentSearches={recentSearches}
          onSelectTerm={(term) => {
            setLocalSearch(term);
            setParams({ q: term, cursor: "" });
          }}
          onClear={clearRecentSearches}
        />

        {/* Listings Container */}
        <SearchResultsList
          isLoading={isLoading}
          isError={isError}
          error={error}
          listings={listings}
          totalResults={totalResults}
          isFetching={isFetching}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={Boolean(hasNextPage)}
          pageSize={PAGE_SIZE}
          observerTarget={observerTarget}
          onRetry={() => refetch()}
          onClearFilters={handleClearFilters}
        />
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
