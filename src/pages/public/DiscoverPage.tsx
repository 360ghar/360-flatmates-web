import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useQueryStates } from "nuqs";
import { SeoHelmet, SITE_URL, buildBreadcrumbJsonLd, homeBreadcrumb } from "@/lib/seo";

import { useAuth } from "@/hooks/useAuth";
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

const QUICK_FILTER_MAP: Record<string, Partial<SearchFilters>> = {
  Nearby: { radius: 2 },
  "1BHK": { bedrooms_min: 1, bedrooms_max: 1 },
  "2BHK": { bedrooms_min: 2, bedrooms_max: 2 },
  Furnished: { features: ["furnished"] },
  "Budget+": { price_max: 10000 },
  "Vegetarian friendly": { features: ["vegetarian"] },
  "Pet friendly": { features: ["pets_allowed"] },
};

const breadcrumbLd = buildBreadcrumbJsonLd([
  homeBreadcrumb(),
  { name: "Discover Listings", item: `${SITE_URL}/discover` },
]);

export function DiscoverPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
      <SeoHelmet
        title="Discover Verified Rooms & Flatmates"
        description="Browse verified room and flatmate listings across Indian cities with compatibility scores, society vibe tags, and visit scheduling."
        canonicalUrl={`${SITE_URL}/discover`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      </SeoHelmet>
      <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-8 md:px-6">
        {/* Editorial introductory header with ambient glows */}
        <div className="relative overflow-hidden rounded-2xl border border-line-low bg-surface/50 p-6 md:p-8 mb-8 shadow-xs">
          <div className="absolute top-[-30%] left-[-20%] w-[50%] aspect-square rounded-full bg-accent/5 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-[-30%] right-[-10%] w-[40%] aspect-square rounded-full bg-accent/8 blur-[100px] pointer-events-none" />
          
          <PageHeader
            eyebrow="Public discovery"
            title="Browse Listings"
            description="Explore curated properties and verified spaces. Contact and like actions open the auth wall for unauthenticated users."
            actions={
              cityOptions.length > 0 ? (
                <SelectField
                  options={cityOptions}
                  value={params.city ? String(params.city) : ""}
                  onChange={(e) => setParams({ city: Number(e.target.value), page: 1 })}
                  placeholder="Select city"
                  fullWidth={false}
                  className="shadow-xs border-line-low hover:border-accent/40"
                />
              ) : undefined
            }
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x -mx-5 px-5 md:mx-0 md:px-0">
          {QUICK_FILTERS.map((item) => (
            <Chip
              key={item}
              selected={params.filter === item}
              onClick={() => setParams({ filter: item, page: 1 })}
              aria-label={`Filter by ${item}`}
              className="snap-start"
            >
              {item}
            </Chip>
          ))}
        </div>

        <section className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AsyncView
            data={listings.length > 0 ? listings : null}
            isLoading={searchLoading || citiesLoading}
            error={searchError}
            onRetry={() => refetch()}
            loading={
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 col-span-full">
                <Skeleton variant="listingCard" count={6} />
              </div>
            }
            empty={
              <div className="col-span-full text-center py-16 bg-surface/30 border border-line-low rounded-2xl">
                <p className="text-h3 text-ink-2 font-semibold">No listings found</p>
                <p className="mt-2 text-body-md text-ink-3">
                  Try a different city or adjust filters.
                </p>
              </div>
            }
          >
            {(data) =>
              data.map((listing, index) => (
                <div
                  key={listing.id}
                  className="card-appear"
                  style={{ animationDelay: `${Math.min(index, 5) * 50}ms` }}
                >
                  <ListingCard
                    listing={listing}
                    ctaLabel="View Details"
                    onOpen={(id) => navigate(`/discover/${id}`)}
                    onContact={(id) => {
                      if (user) {
                        navigate(`/discover/${id}`);
                      } else {
                        navigate(`/login?redirect=${encodeURIComponent(`/discover/${id}`)}`);
                      }
                    }}
                  />
                </div>
              ))
            }
          </AsyncView>
        </section>
      </main>
    </>
  );
}
