import { useParams, Link } from "react-router";
import { SeoHelmet, SITE_URL, SUPPORTED_CITIES, buildBreadcrumbJsonLd, homeBreadcrumb } from "@/lib/seo";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useWebSearch } from "@/hooks/queries/useSearch";
import { propertyToListingCardProps } from "@/lib/api/adapters";
import type { SearchFilters } from "@/lib/api/types";
import { ListingCard, type ListingCardData } from "@/components/molecules/ListingCard";
import { useNavigate } from "react-router";
import { useMemo } from "react";

const CITY_IMAGES: Record<string, string> = {
  bangalore: "1596176530529-78163a4f7af2",
  gurugram: "1567157577867-05ccb1388e66",
};

const CITY_DESCRIPTIONS: Record<string, string> = {
  bangalore: "Bangalore is India's tech capital with a vibrant rental market. Find compatible flatmates in Koramangala, Indiranagar, Whitefield, and more premium neighborhoods.",
  gurugram: "Gurugram offers premium living in the NCR region. Discover verified rooms and compatible flatmates in DLF phases, Golf Course Road, and Sector areas.",
};

const CITY_NEIGHBORHOODS: Record<string, string[]> = {
  bangalore: ["Koramangala", "Indiranagar", "Whitefield", "HSR Layout", "Electronic City", "Marathahalli"],
  gurugram: ["DLF Phase 1-5", "Golf Course Road", "Sector 29", "MG Road", "Sohna Road", "Cyber City"],
};

export function CityPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const city = SUPPORTED_CITIES.find((c) => c.slug === slug);

  const filters: SearchFilters = {
    city: city?.name || "",
    limit: 12,
  };

  const { data: searchResults, isLoading } = useWebSearch(filters);

  const listings: ListingCardData[] = useMemo(() => {
    if (!searchResults?.results) return [];
    return searchResults.results
      .filter((r): r is Extract<typeof r, { property_type: unknown }> => "property_type" in (r as unknown as Record<string, unknown>))
      .map((r) => propertyToListingCardProps(r as Parameters<typeof propertyToListingCardProps>[0]));
  }, [searchResults]);

  if (!city) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-20 text-center">
        <h1 className="text-h1">City not found</h1>
        <p className="mt-4 text-body-lg text-ink-2">
          We don't have listings for this city yet.{" "}
          <Link to="/discover" className="text-accent hover:underline">
            Browse all listings
          </Link>
        </p>
      </div>
    );
  }


  const url = `${SITE_URL}/cities/${city.slug}`;
  const breadcrumbLd = buildBreadcrumbJsonLd([
    homeBreadcrumb(),
    { name: "Cities", item: `${SITE_URL}/discover` },
    { name: city.name, item: url },
  ]);

  const cityLd = {
    "@context": "https://schema.org",
    "@type": "City",
    name: city.name,
    description: CITY_DESCRIPTIONS[city.slug],
    url,
  };

  return (
    <>
      <SeoHelmet
        title={`Find Flatmates & Rooms in ${city.name}`}
        description={`Find compatible flatmates and verified rental listings in ${city.name}. ${CITY_DESCRIPTIONS[city.slug]}`}
        canonicalUrl={url}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(cityLd) }}
        />
      </SeoHelmet>

      <main id="main" className="page-fade">
        {/* Hero */}
        <section className="relative h-80 md:h-96 overflow-hidden">
          <img
            src={`https://images.unsplash.com/photo-${CITY_IMAGES[city.slug] ?? "1596176530529-78163a4f7af2"}?w=1200&fm=webp&fit=crop&q=80`}
            alt={`${city.name} cityscape`}
            className="absolute inset-0 h-full w-full object-cover"
            width={1200}
            height={630}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5">
            <p className="text-eyebrow text-white/80 mb-3">{city.state}, India</p>
            <h1 className="text-display text-white text-5xl md:text-6xl">{city.name}</h1>
            <p className="mt-4 max-w-xl text-body-lg text-white/90">{CITY_DESCRIPTIONS[city.slug]}</p>
            <div className="mt-6 flex gap-4">
              <Link to="/discover" className={buttonClasses("primary", "tall") + " shadow-cta"}>
                Browse All Listings
              </Link>
              <Link to="/signup" className="text-label-lg text-white hover:text-accent transition-colors border-b border-white/50 hover:border-accent pb-1">
                Join {city.name} Community
              </Link>
            </div>
          </div>
        </section>

        {/* Neighborhoods */}
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-6">
          <h2 className="text-h2 text-center">Popular Neighborhoods in {city.name}</h2>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CITY_NEIGHBORHOODS[city.slug]?.map((hood) => (
              <Card key={hood} className="p-4 text-center hover:border-accent/30 transition-colors cursor-pointer" onClick={() => navigate(`/search?q=${hood} ${city.name}`)}>
                <p className="text-h3 text-ink">{hood}</p>
                <p className="text-label-md text-ink-3 mt-1">Explore rooms</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Listings */}
        <section className="bg-paper py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-5 md:px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-eyebrow text-accent">Featured</p>
                <h2 className="text-h2">Verified Listings in {city.name}</h2>
              </div>
              <Link to="/discover" className="text-label-lg text-accent hover:underline">
                View all →
              </Link>
            </div>

            {isLoading ? (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} variant="listingCard" />
                ))}
              </div>
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
              <div className="text-center py-12">
                <p className="text-h3 text-ink-2">No listings in {city.name} yet</p>
                <p className="mt-2 text-body-md text-ink-3">
                  Be the first to post a listing or{" "}
                  <Link to="/discover" className="text-accent hover:underline">
                    browse other cities
                  </Link>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Why 360 Flatmates */}
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-6">
          <h2 className="text-h2 text-center">Why Find Flatmates in {city.name} with 360 Flatmates?</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <Card className="p-6">
              <TrustBadge variant="verified" />
              <h3 className="text-h3 mt-4">Verified Listings</h3>
              <p className="text-body-md text-ink-2 mt-2">Every room listing in {city.name} is reviewed and verified. No fake photos, no bait-and-switch.</p>
            </Card>
            <Card className="p-6">
              <TrustBadge variant="privacy" />
              <h3 className="text-h3 mt-4">Compatibility Matching</h3>
              <p className="text-body-md text-ink-2 mt-2">Our 6-dimension algorithm finds flatmates who match your lifestyle, not just your budget.</p>
            </Card>
            <Card className="p-6">
              <TrustBadge variant="safe" />
              <h3 className="text-h3 mt-4">Safe & Private</h3>
              <p className="text-body-md text-ink-2 mt-2">Phone-verified users, in-app chat, and scheduled visits. Your privacy is protected.</p>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-surface border-t border-line-low py-20 text-center">
          <div className="mx-auto max-w-3xl px-5">
            <h2 className="text-display">Ready to find your flatmate in {city.name}?</h2>
            <p className="mt-4 text-body-lg text-ink-2">Join thousands of professionals who found their perfect living match.</p>
            <div className="mt-8 flex justify-center gap-4">
              <Link to="/signup" className={buttonClasses("primary", "tall") + " shadow-cta"}>
                Get Started Free
              </Link>
              <Link to="/discover" className="text-label-lg text-ink-2 hover:text-accent transition-colors border-b border-ink-4 hover:border-accent pb-1">
                Browse Listings
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
