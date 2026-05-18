import { useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { useQueryStates } from "nuqs";
import { SeoHelmet, SITE_URL, buildBreadcrumbJsonLd, homeBreadcrumb } from "@/lib/seo";

import { useWebSearch } from "@/hooks/queries/useSearch";
import { useAmenities, useCities } from "@/hooks/queries/useCatalogs";
import { propertyToListingCardProps } from "@/lib/api/adapters";
import type { SearchFilters } from "@/lib/api/types";
import { searchPageParams } from "@/lib/schemas/search-params";
import { searchStore } from "@/lib/stores/search-store";
import { SearchResults } from "@/components/organisms/SearchResults";
import { type FilterSection } from "@/components/molecules/FilterPanel";
import { type ListingCardData } from "@/components/molecules/ListingCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/Layout";

const breadcrumbLd = buildBreadcrumbJsonLd([
  homeBreadcrumb(),
  { name: "Search", item: `${SITE_URL}/search` },
]);

export function SearchPage() {
  const navigate = useNavigate();

  const [params, setParams] = useQueryStates(searchPageParams, {
    history: "replace",
    shallow: true,
  });

  const PAGE_SIZE = 20;

  const { data: cities } = useCities();
  const { data: amenities } = useAmenities();

  const filters: SearchFilters = useMemo(
    () => ({
      q: params.q || undefined,
      city: cities?.find((c) => c.id === params.city)?.name,
      bedrooms_min: params.bedrooms ? Number(params.bedrooms) : undefined,
      amenities: params.amenities.length > 0 ? params.amenities : undefined,
      price_min: params.priceMin ?? undefined,
      price_max: params.priceMax ?? undefined,
      limit: PAGE_SIZE,
      page: params.page,
    }),
    [params.q, params.city, params.bedrooms, params.amenities, params.priceMin, params.priceMax, params.page, cities]
  );

  const {
    data: searchResults,
    isLoading,
    refetch,
  } = useWebSearch(filters);

  useEffect(() => {
    searchStore.getState().setFilters(filters);
  }, [filters]);

  const totalPages = searchResults?.total_pages ?? 1;

  const listings: ListingCardData[] = useMemo(() => {
    if (!searchResults?.results) return [];
    return searchResults.results
      .filter(
        (r): r is Extract<typeof r, { property_type: unknown }> =>
          "property_type" in (r as unknown as Record<string, unknown>)
      )
      .map((r) =>
        propertyToListingCardProps(
          r as Parameters<typeof propertyToListingCardProps>[0]
        )
      );
  }, [searchResults]);

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
        setParams({ city: Number(value), page: 1 });
      } else if (sectionId === "bedrooms") {
        setParams({
          bedrooms: params.bedrooms === value ? "" : value,
          page: 1,
        });
      } else if (sectionId === "amenities") {
        const next = params.amenities.includes(value)
          ? params.amenities.filter((a) => a !== value)
          : [...params.amenities, value];
        setParams({ amenities: next, page: 1 });
      }
    },
    [params.bedrooms, params.amenities, setParams]
  );

  const handleClearFilters = useCallback(() => {
    setParams(null);
  }, [setParams]);

  const handlePageChange = useCallback(
    (page: number) => {
      setParams({ page });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setParams]
  );

  if (isLoading) {
    return (
      <>
        <SeoHelmet
          title="Search Flatmates & Rooms"
          description="Search for compatible flatmates and verified rental listings across Indian cities."
          canonicalUrl={`${SITE_URL}/search`}
        />
        <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-8 md:px-6">
          <PageHeader eyebrow="Advanced search" title="Search Flatmates & Rooms" />
          <Skeleton variant="searchResults" className="mt-6" />
        </main>
      </>
    );
  }

  return (
    <>
      <SeoHelmet
        title="Search Flatmates & Rooms"
        description="Search for compatible flatmates and verified rental listings across Indian cities by budget, location, amenities, and lifestyle preferences."
        canonicalUrl={`${SITE_URL}/search`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      </SeoHelmet>
      <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-8 md:px-6">
        <PageHeader eyebrow="Advanced search" title="Search Flatmates & Rooms" />
        <div className="mt-6">
          <SearchResults
            listings={listings}
            filters={filterSections}
            resultCount={searchResults?.total ?? listings.length}
            currentPage={params.page}
            totalPages={totalPages}
            onFilterToggle={handleFilterToggle}
            onClearFilters={handleClearFilters}
            onApplyFilters={() => { setParams({ page: 1 }); refetch(); }}
            onListingOpen={(id) => navigate(`/listing/${id}`)}
            onSaveSearch={() => navigate("/saved-searches")}
            onPageChange={handlePageChange}
          />
        </div>
      </main>
    </>
  );
}
