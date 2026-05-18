import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useQueryStates } from "nuqs";
import { Helmet } from "react-helmet-async";

import { useCities } from "@/hooks/queries/useCatalogs";
import { useWebSearch } from "@/hooks/queries/useSearch";
import { propertyToListingCardProps } from "@/lib/api/adapters";
import type { SearchFilters } from "@/lib/api/types";
import { discoverPageParams } from "@/lib/schemas/search-params";
import { ListingCard, type ListingCardData } from "@/components/molecules/ListingCard";
import { Chip } from "@/components/ui/Chip";
import { SelectField, type SelectOption } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView } from "@/components/ui/StateViews";
import { PageHeader } from "@/components/ui/Layout";

const QUICK_FILTERS = [
  "Nearby",
  "1BHK",
  "2BHK",
  "Furnished",
  "Budget+",
  "Vegetarian friendly",
  "Pet friendly",
] as const;

/** Map quick-filter chip labels to SearchFilters fields */
const QUICK_FILTER_MAP: Record<string, Partial<SearchFilters>> = {
  Nearby: { radius: 2 },
  "1BHK": { bedrooms_min: 1, bedrooms_max: 1 },
  "2BHK": { bedrooms_min: 2, bedrooms_max: 2 },
  Furnished: { features: ["furnished"] },
  "Budget+": { price_max: 10000 },
  "Vegetarian friendly": { features: ["vegetarian"] },
  "Pet friendly": { features: ["pets_allowed"] },
};

export function DiscoverPage() {
  const navigate = useNavigate();

  // ── URL-synced filter state via nuqs ──
  // Deep-linking: /discover?city=2&filter=Nearby pre-fills all filters
  const [params, setParams] = useQueryStates(discoverPageParams, {
    history: "replace",
    shallow: true,
  });

  const { data: cities, isLoading: citiesLoading } = useCities();

  const filters: SearchFilters = useMemo(
    () => {
      const base: SearchFilters = {
        city: cities?.find((c) => c.id === params.city)?.name,
        limit: 20,
        page: params.page,
      };
      // Merge quick-filter mapping into base filters
      const quickFilter = params.filter ? QUICK_FILTER_MAP[params.filter] : undefined;
      if (quickFilter) {
        Object.assign(base, quickFilter);
      }
      return base;
    },
    [cities, params.city, params.page, params.filter]
  );

  const {
    data: searchResults,
    isLoading: searchLoading,
    error: searchError,
    refetch,
  } = useWebSearch(filters);

  const listings: ListingCardData[] = useMemo(() => {
    if (!searchResults?.results) return [];
    return searchResults.results
      .filter((r): r is Extract<typeof r, { property_type: unknown }> => "property_type" in (r as unknown as Record<string, unknown>))
      .map((r) => propertyToListingCardProps(r as Parameters<typeof propertyToListingCardProps>[0]));
  }, [searchResults]);

  const cityOptions: SelectOption[] = useMemo(
    () => (cities ?? []).map((c) => ({ value: String(c.id), label: c.name })),
    [cities]
  );

  return (
    <>
      <Helmet>
        <title>Discover Listings | 360 Flatmates</title>
        <meta name="description" content="Browse verified room and flatmate listings across Indian cities with compatibility scores, society vibe tags, and visit scheduling." />
      </Helmet>
      <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-8 md:px-6">
        <PageHeader
          eyebrow="Public discovery"
          title="Browse Listings"
          description="Contact and like actions open the auth wall for unauthenticated users."
          actions={
            cityOptions.length > 0 ? (
              <SelectField
                options={cityOptions}
                value={params.city ? String(params.city) : ""}
                onChange={(e) => setParams({ city: Number(e.target.value), page: 1 })}
                placeholder="Select city"
                fullWidth={false}
              />
            ) : undefined
          }
        />

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {QUICK_FILTERS.map((item) => (
            <Chip
              key={item}
              selected={params.filter === item}
              onClick={() => setParams({ filter: item, page: 1 })}
              aria-label={`Filter by ${item}`}
            >
              {item}
            </Chip>
          ))}
        </div>

        <section className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <AsyncView
            data={listings.length > 0 ? listings : null}
            isLoading={searchLoading || citiesLoading}
            error={searchError}
            onRetry={() => refetch()}
            loading={<Skeleton variant="feed" count={6} />}
            empty={
              <div className="col-span-full text-center py-12">
                <p className="text-h3 text-ink-2">No listings found</p>
                <p className="mt-2 text-body-md text-ink-3">
                  Try a different city or adjust filters.
                </p>
              </div>
            }
          >
            {(data) =>
              data.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onOpen={(id) => navigate(`/discover/${id}`)}
                  onContact={() => navigate("/login")}
                />
              ))
            }
          </AsyncView>
        </section>
      </main>
    </>
  );
}
