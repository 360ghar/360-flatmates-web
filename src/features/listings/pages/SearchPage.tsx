import { useMemo, useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useStore } from "zustand";
import { useQueryStates } from "nuqs";
import { SeoHelmet, SITE_URL } from "@/lib/seo";

import { useInfiniteWebSearch } from "@/features/listings/hooks/useSearch";
import { useAmenities, useCities } from "@/hooks/queries/useCatalogs";
import { propertyToListingCardProps } from "@/features/listings/lib/adapters";
import type { SearchFilters, CatalogAmenity, CatalogCity } from "@/lib/api/types";
import { FURNISHING_LEVEL_OPTIONS, KITCHEN_TYPE_OPTIONS } from "@/lib/data";
import { searchPageParams } from "@/features/listings/lib/search-params";
import { searchStore } from "@/lib/stores/search-store";
import { type FilterSection, FilterPanel } from "@/features/listings/components/FilterPanel";
import { type ListingCardData } from "@/features/listings/components/ListingCard";
import { Button } from "@/components/ui/Button";
import { PageBand, PageContainer } from "@/components/ui/Layout";
import { useAuth } from "@/hooks/useAuth";
import { PaperMiniScene } from "@/components/paper/PaperScene";
import { BottomSheet } from "@/components/ui/Modal";
import { SearchQuickFilterBar } from "@/features/listings/components/SearchQuickFilterBar";
import { RecentSearchesRow } from "@/features/listings/components/RecentSearchesRow";
import { SearchResultsList } from "@/features/listings/components/SearchResultsList";

const breadcrumb = [{ name: "Search", item: `${SITE_URL}/search` }];

/** Amenities that matter most for room hunting, in priority order.
 *  Values are Amenity.title equivalents (the backend amenities filter
 *  resolves lower(Amenity.title)); normalizedKey handles the matching. */
const KEY_AMENITY_PRIORITY = [
  "Air Conditioning",
  "Lift",
  "Parking",
  "Power Backup",
  "Nearby Parks",
  "Gym",
  "Swimming Pool",
  "24/7 Security",
  "WiFi"
];

function normalizedKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Sorts the catalog so key amenities land inside the 10-chip cap, keeping
 *  catalog order for everything else (stable sort preserves relative order). */
function sortAmenitiesForDisplay(amenities: CatalogAmenity[]): CatalogAmenity[] {
  const priorityIndex = (name: string) => {
    const key = normalizedKey(name);
    const idx = KEY_AMENITY_PRIORITY.findIndex((p) => normalizedKey(p) === key);
    return idx === -1 ? KEY_AMENITY_PRIORITY.length : idx;
  };
  return [...amenities].sort((a, b) => priorityIndex(a.name) - priorityIndex(b.name));
}

function buildSearchFilterSections(
  cities: CatalogCity[] | undefined,
  amenities: CatalogAmenity[] | undefined,
  selectedCity: number,
  selectedBedrooms: string,
  selectedAmenityNames: string[],
  selectedFurnishing: string[],
  selectedKitchenTypes: string[]
): FilterSection[] {
  const selectedAmenities = new Set(selectedAmenityNames);
  const selectedFurnishingSet = new Set(selectedFurnishing);
  const selectedKitchenSet = new Set(selectedKitchenTypes);
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
          options: sortAmenitiesForDisplay(amenities).slice(0, 10).map((a) => ({
            value: a.name,
            label: a.name,
            selected: selectedAmenities.has(a.name),
          })),
        },
      ]
      : []),
    {
      id: "furnishing",
      title: "Furnishing",
      options: FURNISHING_LEVEL_OPTIONS.map((f) => ({
        value: f.value,
        label: f.label,
        selected: selectedFurnishingSet.has(f.value),
      })),
    },
    {
      id: "kitchen",
      title: "Kitchen Type",
      options: KITCHEN_TYPE_OPTIONS.map((k) => ({
        value: k.value,
        label: k.label,
        selected: selectedKitchenSet.has(k.value),
      })),
    },
  ];
}

export function SearchPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
      furnishing:
        params.furnishing.length > 0
          ? (params.furnishing as SearchFilters["furnishing"])
          : undefined,
      kitchen_type:
        params.kitchen.length > 0
          ? (params.kitchen as SearchFilters["kitchen_type"])
          : undefined,
      price_min: params.priceMin ?? undefined,
      price_max: params.priceMax ?? undefined,
      limit: PAGE_SIZE,
    }),
    [params.q, params.city, params.bedrooms, params.amenities, params.furnishing, params.kitchen, params.priceMin, params.priceMax, cities]
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
  }, [params.q, params.city, params.bedrooms, params.amenities, params.furnishing, params.kitchen, params.priceMin, params.priceMax, params.cursor]);

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
    () => buildSearchFilterSections(cities, amenities, params.city, params.bedrooms, params.amenities, params.furnishing, params.kitchen),
    [cities, params.city, params.bedrooms, amenities, params.amenities, params.furnishing, params.kitchen]
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
      } else if (sectionId === "furnishing") {
        const next = params.furnishing.includes(value)
          ? params.furnishing.filter((f) => f !== value)
          : [...params.furnishing, value];
        setParams({ furnishing: next, cursor: "" });
      } else if (sectionId === "kitchen") {
        const next = params.kitchen.includes(value)
          ? params.kitchen.filter((k) => k !== value)
          : [...params.kitchen, value];
        setParams({ kitchen: next, cursor: "" });
      }
    },
    [params.bedrooms, params.amenities, params.furnishing, params.kitchen, setParams]
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

      <PageBand
        title="Search rooms"
        description="Search by area, society, budget or room type."
        aside={<PaperMiniScene prop="magnifier" />}
        actions={
          user ? (
            <Button variant="secondary" size="compact" onClick={() => navigate("/saved-searches")}>
              Saved searches
            </Button>
          ) : undefined
        }
      />
      <PageContainer className="page-fade flex flex-col gap-5 py-8">
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
          filterCount={
            params.amenities.length + params.furnishing.length + params.kitchen.length
          }
          onOpenFilters={() => setMobileFiltersOpen(true)}
          showClear={Boolean(
            params.q ||
              params.city !== 0 ||
              params.bedrooms ||
              params.amenities.length > 0 ||
              params.furnishing.length > 0 ||
              params.kitchen.length > 0
          )}
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
      </PageContainer>

      {/* Filter panel drawer */}
      <BottomSheet
        open={mobileFiltersOpen}
        title="All filters"
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
