import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { SeoHelmet, SITE_URL, SUPPORTED_CITIES, buildCollectionPageSchema, buildFaqPageSchema } from "@/lib/seo";
import { getNeighborhoodsForCity } from "@/lib/seo/neighborhoods";
import type { SearchFilters } from "@/lib/api/types";
import type { CityArtName } from "@/components/paper/CityArt";
import { FaqList } from "@/components/ui/FaqList";
import { EmptyState } from "@/components/ui/StateViews";
import { buttonClasses, cn } from "@/components/ui/component-utils";
import { useWebSearch } from "@/features/listings/hooks/useSearch";
import { propertyToListingCardProps } from "@/features/listings/lib/adapters";
import { ListingGrid } from "@/features/listings/components/ListingGrid";
import type { ListingCardData } from "@/features/listings/components/ListingCard";
import { AreaLinks, PlaceHero, TrustFacts } from "@/features/places/components/PlaceHero";
import { cityFaq } from "@/features/places/lib/place-faq";

const CITY_LEAD: Record<string, string> = {
  bangalore: "Rooms and flatmates across Koramangala, Indiranagar, HSR Layout, Whitefield and more, matched on how you live.",
  gurugram: "Rooms and flatmates across the DLF phases, Golf Course Road, Cyber City and the sectors, matched on how you live."
};

export function CityPage() {
  const { slug } = useParams<{ slug: string }>();
  const city = SUPPORTED_CITIES.find((c) => c.slug === slug);
  const areas = city ? getNeighborhoodsForCity(city.slug) : [];

  const filters: SearchFilters = { city: city?.name || "", limit: 12 };
  const { data: searchResults, isLoading, isError, refetch } = useWebSearch(filters);
  const listings: ListingCardData[] = useMemo(() => {
    if (!searchResults?.results) return [];
    return searchResults.results
      .filter((r): r is Extract<typeof r, { property_type: unknown }> => "property_type" in (r as unknown as Record<string, unknown>))
      .map((r) => propertyToListingCardProps(r as Parameters<typeof propertyToListingCardProps>[0]));
  }, [searchResults]);

  if (!city) {
    return (
      <>
        <SeoHelmet
          title="City not found"
          description="We don't have listings for this city yet. Browse all verified rooms and compatible flatmates on 360 Flatmates."
          canonicalUrl={`${SITE_URL}/cities/${slug ?? ""}`}
          noindex
        />
        <div className="page-container page-fade py-16">
          <EmptyState scene="rainCloud" title="We are not in this city yet" description="Bangalore and Gurugram are live today." />
          <div className="flex justify-center">
            <Link to="/discover" className={buttonClasses("secondary")}>Browse rooms</Link>
          </div>
        </div>
      </>
    );
  }

  const url = `${SITE_URL}/cities/${city.slug}`;
  const breadcrumb = [
    { name: "Cities", item: `${SITE_URL}/discover` },
    { name: city.name, item: url }
  ];
  const faq = cityFaq(city.name, areas);
  const collectionLd = buildCollectionPageSchema({
    name: `Flatmates & Rooms in ${city.name}`,
    description: `Find compatible flatmates and verified rental listings in ${city.name}.`,
    url,
    breadcrumb
  });

  return (
    <>
      <SeoHelmet
        title={`Find Flatmates & Rooms in ${city.name}`}
        description={`Find compatible flatmates and verified rental listings in ${city.name}. ${CITY_LEAD[city.slug] ?? ""}`}
        canonicalUrl={url}
        breadcrumb={breadcrumb}
        jsonLd={[collectionLd, buildFaqPageSchema(faq)]}
      />

      <PlaceHero
        crumbs={[{ label: "Home", to: "/" }, { label: city.name }]}
        title={`Rooms and flatmates in ${city.name}`}
        lead={CITY_LEAD[city.slug] ?? `Verified rooms and compatible flatmates in ${city.name}.`}
        city={city.slug as CityArtName}
        action={
          <Link to={`/search?q=${encodeURIComponent(city.name)}`} className={buttonClasses("primary", "tall")}>
            Search {city.name}
          </Link>
        }
      />

      <div className="page-container page-fade flex flex-col gap-20 py-16 md:gap-24 md:py-20">
        <section aria-labelledby="areas-heading">
          <h2 id="areas-heading" className="text-h2 text-ink">Pick an area</h2>
          <div className="mt-6">
            <AreaLinks citySlug={city.slug} areas={areas} />
          </div>
        </section>

        <section aria-labelledby="rooms-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="rooms-heading" className="text-h2 text-ink">Rooms in {city.name} now</h2>
            <Link to={`/search?q=${encodeURIComponent(city.name)}`} className={cn(buttonClasses("tertiary", "compact"), "-ml-4 sm:-mr-4 sm:ml-0")}>
              See every room
            </Link>
          </div>
          <ListingGrid
            className="mt-6"
            listings={listings}
            isLoading={isLoading}
            error={isError ? true : undefined}
            onRetry={() => refetch()}
            emptyTitle={`No rooms in ${city.name} yet`}
            emptyDescription="New rooms go up every week. Save a search to hear first."
          />
        </section>

        <section aria-labelledby="how-heading">
          <h2 id="how-heading" className="text-h2 text-ink">How it works here</h2>
          <div className="mt-8">
            <TrustFacts />
          </div>
        </section>

        <section aria-labelledby="city-faq-heading" className="mx-auto w-full max-w-[720px]">
          <h2 id="city-faq-heading" className="text-h2 text-ink">Questions about {city.name}</h2>
          <FaqList items={faq} className="mt-6" />
        </section>
      </div>
    </>
  );
}
