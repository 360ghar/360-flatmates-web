import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQueryStates } from "nuqs";
import { SeoHelmet, SITE_URL, buildCollectionPageSchema } from "@/lib/seo";

import { useCities } from "@/hooks/queries/useCatalogs";
import { useAuth } from "@/hooks/useAuth";
import { useWebSearch } from "@/features/listings/hooks/useSearch";
import { propertyToListingCardProps } from "@/features/listings/lib/adapters";
import type { SearchFilters } from "@/lib/api/types";
import { discoverPageParams } from "@/features/listings/lib/search-params";
import { uiStore } from "@/lib/stores/ui-store";
import type { ListingCardData } from "@/features/listings/components/ListingCard";
import { ListingGrid } from "@/features/listings/components/ListingGrid";
import { PaperMiniScene } from "@/components/paper/PaperScene";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { SelectField, type SelectOption } from "@/components/ui/Input";
import { PageBand, PageContainer } from "@/components/ui/Layout";

const GEO_TIMEOUT_MS = 10_000;

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
  Furnished: { furnishing: ["furnished"] },
  "Budget+": { price_max: 10000 },
  "Vegetarian friendly": { kitchen_type: ["vegetarian"] },
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
  const { user } = useAuth();

  const [params, setParams] = useQueryStates(discoverPageParams, {
    history: "replace",
    shallow: true,
  });

  // Tracks the latest filter selection so late geolocation callbacks are ignored.
  const latestFilterRef = useRef<string | null>(params.filter);

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

  /**
   * Request browser geolocation and persist coords into the URL.
   * @param toastOnError - true for explicit chip clicks; false for silent first-load.
   */
  const requestNearbyLocation = useCallback(
    (toastOnError: boolean) => {
      latestFilterRef.current = "Nearby";
      if (!("geolocation" in navigator)) {
        if (toastOnError) {
          uiStore.getState().pushToast({
            type: "error",
            title: "Geolocation not supported",
            description: "Your browser cannot provide a location for Nearby search.",
          });
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (latestFilterRef.current !== "Nearby") return;
          setParams({
            filter: "Nearby",
            latitude: Number(pos.coords.latitude.toFixed(4)),
            longitude: Number(pos.coords.longitude.toFixed(4)),
            cursor: "",
          });
        },
        () => {
          if (latestFilterRef.current !== "Nearby") return;
          if (toastOnError) {
            uiStore.getState().pushToast({
              type: "error",
              title: "Location access denied",
              description: "Please enable location to see nearby listings.",
            });
          }
        },
        { enableHighAccuracy: false, timeout: GEO_TIMEOUT_MS, maximumAge: 60_000 }
      );
    },
    [setParams]
  );

  // Default filter is "Nearby" — request coords on first load when missing so
  // we never search with radius alone (backend needs lat/lng for spatial query).
  useEffect(() => {
    if (params.filter !== "Nearby") return;
    if (params.latitude != null && params.longitude != null) return;
    requestNearbyLocation(false);
  }, [params.filter, params.latitude, params.longitude, requestNearbyLocation]);

  const { data: cities, isLoading: citiesLoading } = useCities();

  const filters: SearchFilters = useMemo(
    () => {
      const base: SearchFilters = {
        property_type: ["flatmate"],
        purpose: "rent",
        city: cities?.find((c) => c.id === params.city)?.name,
        sort_by: "newest",
        limit: 20,
      };
      const quickFilter = params.filter ? QUICK_FILTER_MAP[params.filter] : undefined;
      if (quickFilter) {
        // Nearby without coordinates is a no-op — radius alone is not spatial.
        if (params.filter === "Nearby") {
          if (params.latitude != null && params.longitude != null) {
            Object.assign(base, quickFilter);
            base.lat = params.latitude;
            base.lng = params.longitude;
          }
        } else {
          Object.assign(base, quickFilter);
        }
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

  const handleClearFilters = () => {
    latestFilterRef.current = null;
    setParams(null);
  };

  const handleQuickFilter = (item: string) => {
    const isNearbyClick = item === "Nearby";
    const needsLocation =
      isNearbyClick &&
      (params.filter !== "Nearby" ||
        params.latitude == null ||
        params.longitude == null);

    if (needsLocation) {
      // Explicit chip click: surface permission/timeout errors via toast.
      requestNearbyLocation(true);
      return;
    }

    const nextFilter = params.filter === item ? "" : item;
    latestFilterRef.current = nextFilter;
    setParams({
      filter: nextFilter,
      // Drop coords when deselecting Nearby or switching away from it.
      latitude: nextFilter === "Nearby" ? params.latitude : null,
      longitude: nextFilter === "Nearby" ? params.longitude : null,
      cursor: "",
    });
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
      <PageBand
        title="Browse rooms"
        description={
          user
            ? "Verified rooms and flatmates. Open one to see the details and message the owner."
            : "Verified rooms and flatmates. Sign in to like a room or message the owner."
        }
        aside={<PaperMiniScene prop="house" />}
        actions={
          cityOptions.length > 0 ? (
            <SelectField
              aria-label="City"
              options={cityOptions}
              value={params.city ? String(params.city) : ""}
              onChange={(e) => setParams({ city: Number(e.target.value), cursor: "" })}
              placeholder="All cities"
              fullWidth={false}
            />
          ) : undefined
        }
      />
      <PageContainer className="page-fade flex flex-col gap-6 py-8">
        <div className="flex gap-2 overflow-x-auto scrollbar-none bleed-x md:mx-0 md:px-0" role="group" aria-label="Quick filters">
          {QUICK_FILTERS.map((item) => (
            <Chip
              key={item}
              variant="filter"
              selected={params.filter === item}
              onClick={() => handleQuickFilter(item)}
            >
              {item}
            </Chip>
          ))}
        </div>

        <div className="flex min-h-11 items-center justify-between gap-3">
          <p className="text-body-md tabular-nums text-ink-2" aria-live="polite" aria-atomic="true">
            {searchLoading ? "Finding rooms" : `${totalResults} ${totalResults === 1 ? "room" : "rooms"}`}
          </p>
          {hasActiveFilters ? (
            <Button variant="tertiary" size="compact" onClick={handleClearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>

        <ListingGrid
          listings={listings}
          isLoading={searchLoading || citiesLoading}
          error={searchError}
          onRetry={() => refetch()}
          onClearFilters={hasActiveFilters ? handleClearFilters : undefined}
          emptyDescription="Try a different city or fewer filters."
        />
      </PageContainer>
    </>
  );
}
