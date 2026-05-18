import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useBootstrap, useMyProfile, useMyProperties, usePeers, useSwipeDeck } from "@/hooks/queries";
import { searchStore } from "@/lib/stores/search-store";
import { propertyToListingCardProps, profileToProfileGridCardProps } from "@/lib/api/adapters";
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
  const { isLoading: bootstrapLoading, error: bootstrapError } = useBootstrap();
  const { data: profile } = useMyProfile();
  const { data: myProperties, isLoading: propertiesLoading } = useMyProperties();
  const { data: recommendedPeers, isLoading: peersLoading } = usePeers(
    profile?.city ? { city: profile.city, limit: 8 } : undefined
  );
  const { data: swipeDeckProfiles, isLoading: swipeLoading } = useSwipeDeck(
    profile?.city ? { city: profile.city, limit: 8 } : undefined
  );

  const listings = myProperties ?? [];
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
      {/* Search bar — standalone per DESIGN.md spec */}
      <SearchBar placeholder="Search by location, name or landmark" />

      {/* Quick filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {QUICK_FILTERS.map((item) => (
          <Chip
            key={item}
            selected={activeFilter === item}
            onClick={() => {
              setActiveFilter(item);
              navigate(`/search${FILTER_TO_SEARCH[item] ?? ""}`);
            }}
          >
            {item}
          </Chip>
        ))}
      </div>

      {/* Feed sections */}
      {anyLoading ? (
        <Skeleton variant="feed" count={3} />
      ) : bootstrapError ? (
        <AsyncView data={null} error={bootstrapError} onRetry={() => window.location.reload()}>
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
                <div key={peer.id} className="min-w-[180px] max-w-[200px] md:max-w-none lg:min-w-0 lg:max-w-none snap-start lg:snap-align-none card-appear"
                    style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}>
                  <ProfileGridCard
                    profile={profileToProfileGridCardProps(peer)}
                    onOpen={(id) => navigate(`/profile/${id}`)}
                  />
                </div>
              ))
            ) : (
              <EmptyState
                title="No recommendations yet"
                description="Complete your profile for better matches!"
              />
            )}
          </FeedSection>

          <FeedSection
            title="New Listings"
            actionLabel="See all"
            onAction={() => navigate("/explore")}
          >
            {listings.length > 0 ? (
              listings.slice(0, 4).map((property, i) => (
                <div key={property.id} className="min-w-[280px] max-w-[340px] md:max-w-none lg:min-w-0 lg:max-w-none snap-start lg:snap-align-none card-appear"
                    style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}>
                  <ListingCard
                    listing={propertyToListingCardProps(property)}
                    onOpen={(id) => navigate(`/listings/${id}`)}
                  />
                </div>
              ))
            ) : (
              <EmptyState
                title="No new listings"
                description="No new listings in your area yet."
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
                <div key={peer.id} className="min-w-[180px] max-w-[200px] md:max-w-none lg:min-w-0 lg:max-w-none snap-start lg:snap-align-none card-appear"
                    style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}>
                  <ProfileGridCard
                    profile={profileToProfileGridCardProps(peer)}
                    onOpen={(id) => navigate(`/profile/${id}`)}
                  />
                </div>
              ))
            ) : (
              <EmptyState
                title="No flatmates nearby"
                description="Expand your search area to find more flatmates."
              />
            )}
          </FeedSection>
        </>
      )}
    </div>
  );
}
