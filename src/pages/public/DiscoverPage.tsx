import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useQueryStates } from "nuqs";
import { SeoHelmet, SITE_URL, buildCollectionPageSchema } from "@/lib/seo";

import { useAuth } from "@/hooks/useAuth";
import { uiStore } from "@/lib/stores/ui-store";
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

const breadcrumb = [{ name: "Discover Listings", item: `${SITE_URL}/discover` }];

const collectionLd = buildCollectionPageSchema({
  name: "Discover Verified Rooms & Flatmates",
  description: "Browse verified room and flatmate listings across Indian cities with compatibility scores, society vibe tags, and visit scheduling.",
  url: `${SITE_URL}/discover`,
  breadcrumb,
});

export function DiscoverPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [params, setParams] = useQueryStates(discoverPageParams, {
    history: "replace",
    shallow: true,
  });

  // One-time migration from the legacy `?page=N` URL shape to the cursor
  // form. Drop the param silently so old links still land on a sensible view.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const legacyPage = url.searchParams.get("page");
    if (legacyPage !== null) {
      url.searchParams.delete("page");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const { data: cities, isLoading: citiesLoading } = useCities();

  const filters: SearchFilters = useMemo(
    () => {
      const base: SearchFilters = {
        city: cities?.find((c) => c.id === params.city)?.name,
        limit: 20,
      };
      const quickFilter = params.filter ? QUICK_FILTER_MAP[params.filter] : undefined;
      if (quickFilter) {
        Object.assign(base, quickFilter);
      }
      if (params.filter === "Nearby" && params.latitude && params.longitude) {
        base.lat = params.latitude;
        base.lng = params.longitude;
      }
      return base;
    },
    [cities, params.city, params.filter, params.latitude, params.longitude]
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

  const totalResults = searchResults?.total ?? listings.length;
  const hasActiveFilters = params.city !== 0 || Boolean(params.filter);

  const handleClearFilters = () => setParams(null);

  const handleQuickFilter = (item: string) => {
    if (item === "Nearby" && params.filter !== "Nearby") {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setParams({
              filter: item,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              cursor: ""
            });
          },
          (err) => {
            uiStore.getState().pushToast({
              type: "error",
              title: "Location access denied",
              description: "Please enable location to see nearby listings."
            });
          }
        );
      } else {
        uiStore.getState().pushToast({
          type: "error",
          title: "Geolocation not supported"
        });
      }
    } else {
      setParams({
        filter: params.filter === item ? "" : item,
        latitude: params.filter === item ? null : params.latitude,
        longitude: params.filter === item ? null : params.longitude,
        cursor: ""
      });
    }
  };

  return (
    <>
      <SeoHelmet
        title="Discover Verified Rooms & Flatmates"
        description="Browse verified room and flatmate listings across Indian cities with compatibility scores, society vibe tags, and visit scheduling."
        canonicalUrl={`${SITE_URL}/discover`}
        breadcrumb={breadcrumb}
        jsonLd={collectionLd}
      />
      <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-8 md:px-6">
        <div className="relative mb-8 overflow-hidden rounded-[var(--radius-promo)] border border-line-low bg-lavender p-6 shadow-xs md:p-8">
          <div className="absolute inset-0 map-grid-bg opacity-25" aria-hidden="true" />
          <div className="relative z-[1]">
          <PageHeader
            eyebrow="Public discovery"
            title="Browse Listings"
            description="Explore curated properties and verified spaces. Contact and like actions open the auth wall for unauthenticated users."
            actions={
              cityOptions.length > 0 ? (
                <SelectField
                  options={cityOptions}
                  value={params.city ? String(params.city) : ""}
                  onChange={(e) => setParams({ city: Number(e.target.value), cursor: "" })}
                  placeholder="Select city"
                  fullWidth={false}
                  className="shadow-xs border-line-low hover:border-accent/40"
                />
              ) : undefined
            }
          />
          </div>
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x -mx-5 px-5 md:mx-0 md:px-0"
          role="group"
          aria-label="Quick filters"
        >
          {QUICK_FILTERS.map((item) => (
            <Chip
              key={item}
              variant="choice"
              selected={params.filter === item}
              onClick={() => handleQuickFilter(item)}
              aria-label={`Filter by ${item}`}
              className="snap-start"
            >
              {item}
            </Chip>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p
            className="text-eyebrow uppercase tracking-[0.16em] text-ink-3"
            aria-live="polite"
            aria-atomic="true"
          >
            {searchLoading ? "Loading listings" : `${totalResults} results`}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-body-sm font-semibold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Clear filters
            </button>
          )}
        </div>

        <section className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 text-body-sm font-semibold text-white transition-colors hover:bg-accent-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            }
          >
            {(data) =>
              data.map((listing, index) => (
                <div
                  key={listing.id}
                  className="card-appear motion-reduce:animate-none"
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
