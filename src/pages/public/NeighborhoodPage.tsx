import { useParams, Link, useNavigate } from "react-router";
import {
  SeoHelmet,
  SITE_URL,
  SUPPORTED_CITIES,
  buildCollectionPageSchema,
  buildFaqPageSchema,
} from "@/lib/seo";
import { getNeighborhoodsForCity } from "@/lib/seo/neighborhoods";
import type { Neighborhood } from "@/lib/seo/neighborhoods";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { useAuth } from "@/hooks/useAuth";
import { useWebSearch } from "@/hooks/queries/useSearch";
import { propertyToListingCardProps } from "@/lib/api/adapters";
import type { SearchFilters } from "@/lib/api/types";
import { ListingCard, type ListingCardData } from "@/components/molecules/ListingCard";
import { useMemo } from "react";

export function NeighborhoodPage() {
  const { slug, neighborhood } = useParams<{ slug: string; neighborhood: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const city = SUPPORTED_CITIES.find((c) => c.slug === slug);
  const neighborhoods = city ? getNeighborhoodsForCity(city.slug) : [];
  const hood: Neighborhood | undefined = neighborhoods.find((n) => n.slug === neighborhood);

  // Filter on the locality field (not a free-text `q` query) so "Verified
  // Listings in Koramangala" returns listings actually tagged with that
  // area rather than any listing whose text happens to mention the name.
  const filters: SearchFilters = {
    city: city?.name || "",
    locality: hood?.name || "",
    limit: 12,
  };

  const { data: searchResults, isLoading, isError, refetch } = useWebSearch(filters);

  const listings: ListingCardData[] = useMemo(() => {
    if (!searchResults?.results) return [];
    return searchResults.results
      .filter(
        (r): r is Extract<typeof r, { property_type: unknown }> =>
          "property_type" in (r as unknown as Record<string, unknown>),
      )
      .map((r) => propertyToListingCardProps(r as Parameters<typeof propertyToListingCardProps>[0]));
  }, [searchResults]);

  if (!city || !hood) {
    return (
      <>
        <SeoHelmet
          title="Neighborhood Not Found"
          description="We don't have listings for this area yet. Browse all verified rooms and compatible flatmates on 360 Flatmates."
          canonicalUrl={`${SITE_URL}/cities/${slug ?? ""}/${neighborhood ?? ""}`}
          noindex
        />
        <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-20 text-center">
          <h1 className="text-h1">Neighborhood not found</h1>
          <p className="mt-4 text-body-lg text-ink-2">
            We don't have listings for this area yet.{" "}
            <Link to="/discover" className="text-accent hover:underline">
              Browse all listings
            </Link>
          </p>
        </main>
      </>
    );
  }

  const otherNeighborhoods = neighborhoods.filter((n) => n.slug !== hood.slug);
  const url = `${SITE_URL}/cities/${city.slug}/${hood.slug}`;
  const cityUrl = `${SITE_URL}/cities/${city.slug}`;

  const breadcrumb = [
    { name: city.name, item: cityUrl },
    { name: hood.name, item: url },
  ];

  const collectionLd = buildCollectionPageSchema({
    name: `Flatmates & Rooms in ${hood.name}, ${city.name}`,
    description: `Find compatible flatmates and verified rental listings in ${hood.name}, ${city.name}. ${hood.blurb}`,
    url,
    breadcrumb,
  });

  const faqLd = buildFaqPageSchema([
    {
      question: `How do I find a flatmate in ${hood.name}?`,
      answer: `Create a free profile on 360 Flatmates, select ${hood.name} in ${city.name} as your preferred area, and our 6-dimension compatibility engine matches you with flatmates who fit your lifestyle. You can then book a visit to the room directly in the app.`,
    },
    {
      question: `What is ${hood.name} like for shared living?`,
      answer: `${hood.blurb} It is one of the most searched areas in ${city.name} for flatmate housing, with a mix of independent rooms and shared apartments.`,
    },
    {
      question: `Are rooms in ${hood.name} verified on 360 Flatmates?`,
      answer: `Yes. Every listing in ${hood.name} is reviewed before it goes live: real photos, real rent, real availability. Landlords and current flatmates confirm the details directly.`,
    },
    {
      question: `Which other ${city.name} neighborhoods are near ${hood.name}?`,
      answer: `Popular nearby areas include ${otherNeighborhoods
        .slice(0, 3)
        .map((n) => n.name)
        .join(", ")}. All have active verified listings on 360 Flatmates.`,
    },
  ]);

  return (
    <>
      <SeoHelmet
        title={`Flatmates in ${hood.name}, ${city.name}`}
        description={`Find compatible flatmates and verified rooms in ${hood.name}, ${city.name}. ${hood.blurb}`}
        canonicalUrl={url}
        breadcrumb={breadcrumb}
        jsonLd={[collectionLd, faqLd]}
      />

      <main id="main" className="page-fade">
        {/* Hero */}
        <section className="relative h-64 md:h-80 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-paper to-surface" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5">
            <p className="text-eyebrow text-accent mb-2">
              <Link to={cityUrl} className="hover:underline">
                {city.name}
              </Link>
            </p>
            <h1 className="text-display text-ink text-4xl md:text-5xl">{hood.name}</h1>
            <p className="mt-4 max-w-xl text-body-lg text-ink-2">{hood.blurb}</p>
            <div className="mt-6 flex gap-4">
              <Link
                to="/discover"
                className={buttonClasses("primary", "tall") + ""}
              >
                Browse Listings
              </Link>
              <Link
                to={`/search?q=${encodeURIComponent(`${hood.name} ${city.name}`)}`}
                className="text-label-lg text-ink-2 hover:text-accent transition-colors border-b border-ink-4 hover:border-accent pb-1"
              >
                Search {hood.name}
              </Link>
            </div>
          </div>
        </section>

        {/* Listings */}
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-eyebrow text-accent">Rooms & Flatmates</p>
              <h2 className="text-h2">
                Verified Listings in {hood.name}
              </h2>
            </div>
            <Link
              to={`/search?q=${encodeURIComponent(`${hood.name} ${city.name}`)}`}
              className="text-label-lg text-accent hover:underline"
            >
              View all
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="listingCard" />
              ))}
            </div>
          ) : isError ? (
            <Card className="flex items-center justify-center p-8">
              <ErrorState
                title={`Couldn't load listings in ${hood.name}`}
                description="Please check your connection and try again."
                onRetry={() => refetch()}
              />
            </Card>
          ) : listings.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
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
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <p className="text-h3 text-ink-2">
                No listings in {hood.name} yet
              </p>
              <p className="mt-2 text-body-md text-ink-3">
                Be the first to post a listing in this area or{" "}
                <Link to="/discover" className="text-accent hover:underline">
                  browse other neighborhoods
                </Link>
              </p>
            </Card>
          )}
        </section>

        {/* Nearby Neighborhoods */}
        {otherNeighborhoods.length > 0 && (
          <section className="bg-paper py-16 md:py-20">
            <div className="mx-auto max-w-7xl px-5 md:px-6">
              <h2 className="text-h2 text-center">
                Explore More Neighborhoods in {city.name}
              </h2>
              <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {otherNeighborhoods.map((n) => (
                  <Link
                    key={n.slug}
                    to={`/cities/${city.slug}/${n.slug}`}
                    className="group"
                  >
                    <Card className="p-4 text-center hover:border-accent/30 transition-colors">
                      <p className="text-h3 text-ink group-hover:text-accent transition-colors">
                        {n.name}
                      </p>
                      <p className="text-label-md text-ink-3 mt-1 line-clamp-2">
                        {n.blurb}
                      </p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-surface border-t border-line-low py-20 text-center">
          <div className="mx-auto max-w-3xl px-5">
            <h2 className="text-display">
              Ready to find your flatmate in {hood.name}?
            </h2>
            <p className="mt-4 text-body-lg text-ink-2">
              Join thousands of professionals who found their perfect living match.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                to="/signup"
                className={buttonClasses("primary", "tall") + ""}
              >
                Get Started Free
              </Link>
              <Link
                to={cityUrl}
                className="text-label-lg text-ink-2 hover:text-accent transition-colors border-b border-ink-4 hover:border-accent pb-1"
              >
                Back to {city.name}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
