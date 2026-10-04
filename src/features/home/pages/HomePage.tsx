import { userMessage } from "@/lib/api/errors";
import { useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useBootstrap } from "@/hooks/queries/useBootstrap";
import { useMyProfile, usePeers } from "@/hooks/queries/useProfiles";
import { useWebSearch } from "@/features/listings/hooks/useSearch";
import { useSwipeDeck } from "@/features/swipe/hooks/useSwipes";
import { searchStore } from "@/lib/stores/search-store";
import { propertyToListingCardProps } from "@/features/listings/lib/adapters";
import { profileToProfileGridCardProps } from "@/features/matches/lib/adapters";
import type { Property } from "@/lib/api/types";
import { PaperMiniScene } from "@/components/paper/PaperScene";
import { chipClasses } from "@/components/ui/Chip";
import { Page } from "@/components/ui/Layout";
import { EmptyState } from "@/components/ui/StateViews";
import { SearchBar } from "@/components/ui/SearchBar";
import { HomeFeedSkeleton } from "@/features/home/components/HomeFeedSkeleton";
import { AsyncView } from "@/components/ui/StateViews";
import { FeedSection } from "@/features/home/components/FeedSection";
import { ListingCard } from "@/features/listings/components/ListingCard";
import { ProfileGridCard } from "@/features/matches/components/ProfileGridCard";

const QUICK_FILTERS = ["All rooms", "1BHK", "Furnished", "Under ₹10,000", "Vegetarian"] as const;

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
  "All rooms": {},
  "1BHK": { bedrooms: "1" },
  Furnished: { q: "furnished" },
  "Under ₹10,000": { priceMax: 10000 },
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
  const {
    data: bootstrap,
    isLoading: bootstrapLoading,
    error: bootstrapError,
    refetch: refetchBootstrap
  } = useBootstrap();
  const { data: myProfile } = useMyProfile();
  // Bootstrap already carries the profile, so the feed queries start with the
  // right city on the first request instead of refiring when /users/me lands (W23).
  const profile = myProfile ?? bootstrap?.profile;
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

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  const peerCard = (peer: (typeof recommended)[number], i: number) => (
    <div key={peer.id} className="card-appear w-[180px] shrink-0 snap-start sm:w-[200px] md:w-[220px]" style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}>
      <ProfileGridCard profile={profileToProfileGridCardProps(peer)} onOpen={(id) => navigate(`/profile/${id}`)} />
    </div>
  );

  return (
    <Page width="wide">
      <section className="paper-grain relative rounded-hand bg-paper-1 p-6 shadow-xs md:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center lg:gap-12">
        <div>
          {/* The top bar greets the user; this heading says what is here. */}
          <h1 className="text-h1 text-ink">{profile?.city ? `New for you in ${profile.city}` : "New for you"}</h1>
          <p className="mt-2 max-w-[56ch] text-body-lg text-ink-2">Flatmates and rooms picked for how you live.</p>
          <form role="search" className="mt-6 max-w-[560px]" onSubmit={handleSearch}>
            <SearchBar name="q" aria-label="Search rooms and flatmates" placeholder="Search by area, name or landmark" />
          </form>
          <nav aria-label="Quick searches" className="mt-4 flex flex-wrap gap-2">
            {QUICK_FILTERS.map((item) => (
              <Link key={item} to={`/search${buildQuickFilterSearch(item)}`} className={chipClasses(false)}>
                {item}
              </Link>
            ))}
          </nav>
        </div>
        <PaperMiniScene prop="house" className="hidden lg:block" />
      </section>

      {anyLoading ? (
        <HomeFeedSkeleton />
      ) : bootstrapError ? (
        <AsyncView data={null} error={bootstrapError} onRetry={() => refetchBootstrap()}>
          {() => null}
        </AsyncView>
      ) : (
        <>
          <FeedSection title="Recommended for you" actionLabel="See all" onAction={() => navigate("/swipe")}>
            {recommended.length > 0 ? (
              recommended.slice(0, 4).map(peerCard)
            ) : (
              <EmptyState
                className="w-full"
                scene="heart"
                title={swipeError ? "Could not load recommendations" : "No recommendations yet"}
                description={swipeError ? userMessage(swipeError) : "Complete your profile for better matches."}
              />
            )}
          </FeedSection>

          <FeedSection title="New listings" actionLabel="See all" onAction={() => navigate("/search")}>
            {listings.length > 0 ? (
              listings.slice(0, 4).map((property, i) => (
                <div key={property.id} className="card-appear w-[280px] shrink-0 snap-start sm:w-[320px] md:w-[340px]" style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}>
                  <ListingCard
                    listing={propertyToListingCardProps(property)}
                    ctaLabel="View details"
                    onOpen={(id) => navigate(`/listing/${id}`)}
                  />
                </div>
              ))
            ) : (
              <EmptyState
                className="w-full"
                scene="house"
                title={propertiesError ? "Could not load listings" : "No new listings"}
                description={propertiesError ? userMessage(propertiesError) : "Nothing new in your area yet."}
              />
            )}
          </FeedSection>

          <FeedSection title="Flatmates near you" actionLabel="See all" onAction={() => navigate("/explore?search_type=profiles")}>
            {nearbyPeers.length > 0 ? (
              nearbyPeers.slice(0, 4).map(peerCard)
            ) : (
              <EmptyState
                className="w-full"
                scene="magnifier"
                title={peersError ? "Could not load flatmates" : "No flatmates nearby"}
                description={peersError ? userMessage(peersError) : "Widen your search area to find more."}
              />
            )}
          </FeedSection>
        </>
      )}
    </Page>
  );
}
