import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useBootstrap, useMyProfile, useWebSearch, usePeers, useSwipeDeck } from "@/hooks/queries";
import { searchStore } from "@/lib/stores/search-store";
import { propertyToListingCardProps, profileToProfileGridCardProps } from "@/lib/api/adapters";
import type { Property } from "@/lib/api/types";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/StateViews";
import { SearchBar } from "@/components/ui/SearchBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView } from "@/components/ui/StateViews";
import { FeedSection } from "@/components/organisms/FeedSection";
import { ListingCard } from "@/components/molecules/ListingCard";
import { ProfileGridCard } from "@/components/molecules/ProfileGridCard";

const QUICK_FILTERS = ["Nearby", "1BHK", "Furnished", "Budget+", "Vegetarian"] as const;

const FILTER_TO_SEARCH: Record<string, string> = {
  Nearby: "?q=&sort=nearby",
  "1BHK": "?q=1BHK",
  Furnished: "?q=furnished",
  "Budget+": "?q=budget&sort=price_asc",
  Vegetarian: "?q=vegetarian",
};

export function HomePage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<string>("Nearby");
  const { isLoading: bootstrapLoading, error: bootstrapError, refetch: refetchBootstrap } = useBootstrap();
  const { data: profile } = useMyProfile();
  const newListingsFilters = profile?.city
    ? { city: profile.city, sort_by: "newest" as const, limit: 8, page: 1 }
    : undefined;
  const { data: newListingsData, isLoading: propertiesLoading, error: propertiesError } = useWebSearch(
    newListingsFilters ?? { limit: 8, page: 1, sort_by: "newest" as const }
  );
  const { data: recommendedPeers, isLoading: peersLoading, error: peersError } = usePeers(
    profile?.city ? { city: profile.city, limit: 8 } : undefined
  );
  const { data: swipeDeckProfiles, isLoading: swipeLoading, error: swipeError } = useSwipeDeck(
    profile?.city ? { city: profile.city, limit: 8 } : undefined
  );

  const listings = (newListingsData?.results ?? []) as Property[];
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

  return (
    <div className="flex flex-col gap-6 page-fade">
      {/* Personalized Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-line-low bg-surface/50 p-6 md:p-8 shadow-xs">
        <div className="absolute top-[-30%] left-[-20%] w-[50%] aspect-square rounded-full bg-accent/5 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[40%] aspect-square rounded-full bg-accent/8 blur-[100px] pointer-events-none" />
        
        <p className="text-eyebrow text-accent uppercase tracking-[0.16em]">Dashboard</p>
        <h1 className="mt-2 text-display text-3xl md:text-4xl text-ink font-normal leading-tight">
          Welcome back, <span className="text-serif-italic text-accent italic font-normal text-4xl md:text-5xl">{profile?.full_name?.split(" ")[0] || "Friend"}</span>
        </h1>
        <p className="mt-3 text-body-md text-ink-2 max-w-[65ch]">
          Ready to find your vibe match? Check out your personal dashboard and recommendations below.
        </p>

        {/* Dashboard Quick Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-paper/50 p-4 hover:border-accent/20 transition-all duration-300">
            <span className="text-h3 font-serif font-normal text-ink">{recommended.length}</span>
            <p className="text-caption text-ink-3 mt-1">Recommended peers</p>
          </div>
          <div className="rounded-xl border border-line bg-paper/50 p-4 hover:border-accent/20 transition-all duration-300">
            <span className="text-h3 font-serif font-normal text-ink">{listings.length}</span>
            <p className="text-caption text-ink-3 mt-1">Property listings</p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-xl border border-line bg-paper/50 p-4 hover:border-accent/20 transition-all duration-300">
            <span className="text-h3 font-serif font-normal text-ink">{nearbyPeers.length}</span>
            <p className="text-caption text-ink-3 mt-1">Nearby flatmates</p>
          </div>
        </div>
      </div>

      {/* Search bar — standalone per DESIGN.md spec */}
      <SearchBar placeholder="Search by location, name or landmark" />

      {/* Quick filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x -mx-5 px-5 md:mx-0 md:px-0">
        {QUICK_FILTERS.map((item) => (
          <Chip
            key={item}
            selected={activeFilter === item}
            onClick={() => {
              setActiveFilter(item);
              navigate(`/search${FILTER_TO_SEARCH[item] ?? ""}`);
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
