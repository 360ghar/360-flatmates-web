import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { SeoHelmet, SITE_URL, SUPPORTED_CITIES, buildCollectionPageSchema, buildFaqPageSchema } from "@/lib/seo";
import { getNeighborhoodsForCity, type Neighborhood } from "@/lib/seo/neighborhoods";
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
import { neighbourhoodFaq } from "@/features/places/lib/place-faq";

export function NeighborhoodPage() {
  const { slug, neighborhood } = useParams<{ slug: string; neighborhood: string }>();
  const city = SUPPORTED_CITIES.find((c) => c.slug === slug);
  const areas = city ? getNeighborhoodsForCity(city.slug) : [];
  const area: Neighborhood | undefined = areas.find((n) => n.slug === neighborhood);

  // Filter on the locality field, not free text, so the grid holds rooms
  // actually tagged with this area.
  const filters: SearchFilters = { city: city?.name || "", locality: area?.name || "", limit: 12 };
  const { data: searchResults, isLoading, isError, refetch } = useWebSearch(filters);
  const listings: ListingCardData[] = useMemo(() => {
    if (!searchResults?.results) return [];
    return searchResults.results
      .filter((r): r is Extract<typeof r, { property_type: unknown }> => "property_type" in (r as unknown as Record<string, unknown>))
      .map((r) => propertyToListingCardProps(r as Parameters<typeof propertyToListingCardProps>[0]));
  }, [searchResults]);

  if (!city || !area) {
    return (
      <>
        <SeoHelmet
          title="Area not found"
          description="We don't have listings for this area yet. Browse all verified rooms and compatible flatmates on 360 Flatmates."
          canonicalUrl={`${SITE_URL}/cities/${slug ?? ""}/${neighborhood ?? ""}`}
          noindex
        />
        <div className="page-container page-fade py-16">
          <EmptyState scene="rainCloud" title="We do not cover this area yet" description="Pick another area or browse every room." />
          <div className="flex justify-center">
            <Link to={city ? `/cities/${city.slug}` : "/discover"} className={buttonClasses("secondary")}>
              {city ? `Areas in ${city.name}` : "Browse rooms"}
            </Link>
          </div>
        </div>
      </>
    );
  }

  const nearby = areas.filter((n) => n.slug !== area.slug);
  const url = `${SITE_URL}/cities/${city.slug}/${area.slug}`;
  const breadcrumb = [
    { name: city.name, item: `${SITE_URL}/cities/${city.slug}` },
    { name: area.name, item: url }
  ];
  const faq = neighbourhoodFaq(city.name, area, nearby);
  const collectionLd = buildCollectionPageSchema({
    name: `Flatmates & Rooms in ${area.name}, ${city.name}`,
    description: `Find compatible flatmates and verified rental listings in ${area.name}, ${city.name}. ${area.blurb}`,
    url,
    breadcrumb
  });
  const search = `/search?q=${encodeURIComponent(area.name)}`;

  return (
    <>
      <SeoHelmet
        title={`Flatmates in ${area.name}, ${city.name}`}
        description={`Find compatible flatmates and verified rooms in ${area.name}, ${city.name}. ${area.blurb}`}
        canonicalUrl={url}
        breadcrumb={breadcrumb}
        jsonLd={[collectionLd, buildFaqPageSchema(faq)]}
      />

      <PlaceHero
        crumbs={[{ label: "Home", to: "/" }, { label: city.name, to: `/cities/${city.slug}` }, { label: area.name }]}
        title={`Rooms in ${area.name}`}
        lead={area.blurb}
        city={city.slug as CityArtName}
        action={
          <Link to={search} className={buttonClasses("primary", "tall")}>
            Search {area.name}
          </Link>
        }
      />

      <div className="page-container page-fade flex flex-col gap-20 py-16 md:gap-24 md:py-20">
        <section aria-labelledby="rooms-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="rooms-heading" className="text-h2 text-ink">Rooms in {area.name} now</h2>
            <Link to={search} className={cn(buttonClasses("tertiary", "compact"), "-ml-4 sm:-mr-4 sm:ml-0")}>
              See every room
            </Link>
          </div>
          <ListingGrid
            className="mt-6"
            listings={listings}
            isLoading={isLoading}
            error={isError ? true : undefined}
            onRetry={() => refetch()}
            emptyTitle={`No rooms in ${area.name} yet`}
            emptyDescription="Try a nearby area below, or save a search to hear first."
          />
        </section>

        <section aria-labelledby="nearby-heading">
          <h2 id="nearby-heading" className="text-h2 text-ink">Nearby areas</h2>
          <div className="mt-6">
            <AreaLinks citySlug={city.slug} areas={nearby} />
          </div>
        </section>

        <section aria-labelledby="how-heading">
          <h2 id="how-heading" className="text-h2 text-ink">How it works here</h2>
          <div className="mt-8">
            <TrustFacts />
          </div>
        </section>

        <section aria-labelledby="area-faq-heading" className="mx-auto w-full max-w-[720px]">
          <h2 id="area-faq-heading" className="text-h2 text-ink">Questions about {area.name}</h2>
          <FaqList items={faq} className="mt-6" />
        </section>
      </div>
    </>
  );
}
