import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useBootstrap, useMyProfile, useWebSearch, usePeers, useSwipeDeck } from "@/hooks/queries";
import { searchStore } from "@/lib/stores/search-store";
import { propertyToListingCardProps, profileToProfileGridCardProps } from "@/lib/api/adapters";
import type { Property } from "@/lib/api/types";
import { debug } from "@/lib/debug";
import { Card } from "@/components/ui/Card";
import { Users, Building2, MapPin } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/StateViews";
import { SearchBar } from "@/components/ui/SearchBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView } from "@/components/ui/StateViews";
import { FeedSection } from "@/components/organisms/FeedSection";
import { ListingCard } from "@/components/molecules/ListingCard";
import { ProfileGridCard } from "@/components/molecules/ProfileGridCard";

const QUICK_FILTERS = ["Nearby", "1BHK", "Furnished", "Budget+", "Vegetarian"] as const;

type QuickFilter = (typeof QUICK_FILTERS)[number];

/**
 * Map quick-filter labels to URL params understood by `/search` (see
 * `lib/schemas/search-params.ts`). The previous mapping used `q` strings
 * and the unknown `sort=nearby` / `sort=price_asc` keys, which silently
 * no-op'd. We now use the structured `bedrooms` / `priceMax` params that
 * the search page actually reads, and fall back to `q` for keyword-style
 * filters that don't have a dedicated param yet.
 */
const QUICK_FILTER_TO_PARAMS: Record<QuickFilter, Record<string, string | number | undefined>> = {
  Nearby: {},
  "1BHK": { bedrooms: "1" },
  Furnished: { q: "furnished" },
  "Budget+": { priceMax: 10000 },
  Vegetarian: { q: "vegetarian" }
};

function buildQuickFilterSearch(label: QuickFilter): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(QUICK_FILTER_TO_PARAMS[label])) {
    if (value === undefined || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function HomePage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<string>("Nearby");
  const { isLoading: bootstrapLoading, error: bootstrapError, refetch: refetchBootstrap } = useBootstrap();
  const { data: profile } = useMyProfile();
  // Fire the queries unconditionally. Previously we gated on `profile?.city`,
  // which silently produced empty sections for users whose profile hadn't yet
  // resolved their city. The backend accepts the queries without a city
  // filter, so we let them run with an empty filter set and rely on the
  // empty-state messaging when there are no results.
  const newListingsFilters = profile?.city
    ? { property_type: ["flatmate" as const], purpose: "rent" as const, city: profile.city, sort_by: "newest" as const, limit: 8 }
    : { property_type: ["flatmate" as const], purpose: "rent" as const, sort_by: "newest" as const, limit: 8 };
  const { data: newListingsData, isLoading: propertiesLoading, error: propertiesError } = useWebSearch(
    newListingsFilters
  );
  const peersFilters = profile?.city ? { city: profile.city, limit: 8 } : { limit: 8 };
  const { data: recommendedPeers, isLoading: peersLoading, error: peersError } = usePeers(peersFilters);
  const swipeFilters = profile?.city ? { city: profile.city, limit: 8 } : { limit: 8 };
  const { data: swipeDeckProfiles, isLoading: swipeLoading, error: swipeError } = useSwipeDeck(swipeFilters);

  const listings = (newListingsData?.results ?? []).filter(
    (r): r is Property => "monthly_rent" in r && r.owner_id !== profile?.id
  );
  const nearbyPeers = recommendedPeers ?? [];
  const recommended = swipeDeckProfiles ?? [];

  const anyLoading = bootstrapLoading || propertiesLoading || peersLoading || swipeLoading;

  // Debug logging: surface query states and data shapes for diagnostics
  debug.log("HomePage", "render", {
    profile: profile ? { id: profile.id, city: profile.city, name: profile.full_name } : null,
    bootstrap: { loading: bootstrapLoading, error: bootstrapError?.message },
    properties: { loading: propertiesLoading, error: propertiesError?.message, count: listings.length },
    peers: { loading: peersLoading, error: peersError?.message, count: nearbyPeers.length },
    swipe: { loading: swipeLoading, error: swipeError?.message, count: recommended.length },
    anyLoading,
  });

  useEffect(() => {
    const currentCity = searchStore.getState().filters.city;
    if (!currentCity && profile?.city) {
      searchStore.getState().setFilters({
        city: profile.city,
        price_min: profile.budget_min,
        price_max: profile.budget_max,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when city changes
  }, [profile?.city]);

  return (
    <div className="flex flex-col gap-6 page-fade">
      <div className="relative overflow-hidden rounded-[var(--radius-promo)] border border-line-low bg-lavender p-6 shadow-hard-paper md:grid md:grid-cols-2 md:items-center md:gap-6 md:p-8">
        <div className="absolute inset-0 map-grid-bg opacity-20" aria-hidden="true" />

        <div className="relative z-[1]">
          <p className="text-label-md font-semibold text-accent">Dashboard</p>
          <h1 className="mt-2 text-display text-3xl md:text-4xl text-ink font-normal leading-tight">
            Welcome back, <span className="text-serif-italic text-accent italic font-normal text-4xl md:text-5xl">{profile?.full_name?.trim().split(/\s+/)[0] || "Friend"}</span>
          </h1>
          <p className="mt-3 text-body-md text-ink-2 max-w-[65ch]">
            Your recommendations, listings, and nearby flatmates are ready to review.
          </p>
        </div>

        <div className="relative z-[1] mt-4 grid grid-cols-3 gap-2 md:mt-0">
          {[
            { Icon: Users, value: recommended.length, label: "Recommended peers", to: "/swipe" },
            { Icon: Building2, value: listings.length, label: "Property listings", to: "/search" },
            { Icon: MapPin, value: nearbyPeers.length, label: "Nearby flatmates", to: "/explore?search_type=profiles" },
          ].map(({ Icon, value, label, to }) => (
            <Card
              key={label}
              variant="compact"
              interactive
              className="flex flex-col items-center gap-1 p-2.5"
              onClick={() => navigate(to)}
            >
              <div className="flex items-center gap-1.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Icon size={14} />
                </div>
                <span className="text-h5 tabular-nums text-ink">{value}</span>
              </div>
              <span className="text-caption text-ink-3 text-center leading-tight">{label}</span>
            </Card>
          ))}
        </div>
      </div>

      {/* Search bar — standalone per DESIGN.md spec */}
      <SearchBar
        placeholder="Search by location, name or landmark"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            const value = (event.target as HTMLInputElement).value.trim();
            if (value) navigate(`/search?q=${encodeURIComponent(value)}`);
          }
        }}
      />

      {/* Quick filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x -mx-5 px-5 md:mx-0 md:px-0">
        {QUICK_FILTERS.map((item) => (
          <Chip
            key={item}
            selected={activeFilter === item}
            onClick={() => {
              setActiveFilter(item);
              navigate(`/search${buildQuickFilterSearch(item)}`);
            }}
            className="snap-start"
          >
            {item}
          </Chip>
        ))}
      </div>

      {/* Feed sections */}
      {anyLoading ? (
        <div className="flex flex-col gap-6">
          <Skeleton variant="searchBar" />
          <Skeleton variant="filterChips" count={5} />
          {["Recommended for You", "New Listings", "Nearby Flatmates"].map((section) => (
            <section key={section} className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-32 rounded-full" />
                <Skeleton className="h-3 w-14 rounded-full" />
              </div>
              <div className="flex gap-4 overflow-hidden lg:grid lg:grid-cols-2 xl:grid-cols-3">
                {section === "New Listings"
                  ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} variant="listingCard" />)
                  : Array.from({ length: 3 }, (_, i) => <Skeleton key={i} variant="profileGridCard" />)}
              </div>
            </section>
          ))}
        </div>
      ) : bootstrapError ? (
        <AsyncView data={null} error={bootstrapError} onRetry={() => refetchBootstrap()}>
          {() => null}
        </AsyncView>
      ) : (
        <>
          <FeedSection
            title="Recommended for You"
            actionLabel="See all"
            onAction={() => navigate("/swipe")}
          >
            {recommended.length > 0 ? (
              recommended.slice(0, 4).map((peer, i) => (
                <div key={peer.id} className="w-[180px] sm:w-[200px] md:w-[220px] shrink-0 snap-start card-appear"
                  style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}>
                  <ProfileGridCard
                    profile={profileToProfileGridCardProps(peer)}
                    onOpen={(id) => navigate(`/profile/${id}`)}
                  />
                </div>
              ))
            ) : (
              <EmptyState
                title={swipeError ? "Swipe API Error" : "No recommendations yet"}
                description={swipeError ? String(swipeError) : "Complete your profile for better matches!"}
              />
            )}
          </FeedSection>

          <FeedSection
            title="New Listings"
            actionLabel="See all"
            onAction={() => navigate("/search")}
          >
            {listings.length > 0 ? (
              listings.slice(0, 4).map((property, i) => (
                <div key={property.id} className="w-[280px] sm:w-[320px] md:w-[340px] shrink-0 snap-start card-appear"
                  style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}>
                  <ListingCard
                    listing={propertyToListingCardProps(property)}
                    ctaLabel="View Details"
                    onOpen={(id) => navigate(`/listing/${id}`)}
                  />
                </div>
              ))
            ) : (
              <EmptyState
                title={propertiesError ? "Properties API Error" : "No new listings"}
                description={propertiesError ? String(propertiesError) : "No new listings in your area yet."}
              />
            )}
          </FeedSection>

          <FeedSection
            title="Nearby Flatmates"
            actionLabel="See all"
            onAction={() => navigate("/explore?search_type=profiles")}
          >
            {nearbyPeers.length > 0 ? (
              nearbyPeers.slice(0, 4).map((peer, i) => (
                <div key={peer.id} className="w-[180px] sm:w-[200px] md:w-[220px] shrink-0 snap-start card-appear"
                  style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}>
                  <ProfileGridCard
                    profile={profileToProfileGridCardProps(peer)}
                    onOpen={(id) => navigate(`/profile/${id}`)}
                  />
                </div>
              ))
            ) : (
              <EmptyState
                title={peersError ? "Peers API Error" : "No flatmates nearby"}
                description={peersError ? String(peersError) : "Expand your search area to find more flatmates."}
              />
            )}
          </FeedSection>
        </>
      )}
    </div>
  );
}
