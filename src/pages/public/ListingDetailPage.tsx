import { useParams } from "react-router";
import { SeoHelmet, SITE_URL, buildResidenceSchema } from "@/lib/seo";

import ListingDetailClient from "@/components/page-clients/ListingDetailClient";
import { useProperty } from "@/hooks/queries";
import { formatLocation, formatRent } from "@/lib/utils";

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const propertyId = Number(id);

  const { data: property } = useProperty(propertyId);

  const url = `${SITE_URL}/discover/${id}`;

  const metaTitle = property?.title ?? "Listing Details";
  const metaDescription = property
    ? [
        property.title,
        formatLocation(property.locality, property.city),
        property.monthly_rent ? formatRent(property.monthly_rent) : undefined,
        property.bedrooms ? `${property.bedrooms} bed` : undefined,
        property.area_sqft ? `${property.area_sqft} sq ft` : undefined,
      ]
        .filter(Boolean)
        .join(", ") + ". Verified listing on 360 Flatmates."
    : "View verified room and flatmate listings on 360 Flatmates with compatibility scores, society vibe tags, and visit scheduling.";

  const breadcrumb = [
    { name: "Discover", item: `${SITE_URL}/discover` },
    { name: property?.title ?? "Listing", item: url },
  ];

  const listingLd = property
    ? buildResidenceSchema({
        name: property.title,
        description: property.description ?? `Verified listing in ${property.locality}, ${property.city}`,
        url,
        image: property.main_image_url,
        monthlyRent: property.monthly_rent,
        locality: property.locality,
        city: property.city,
        bedrooms: property.bedrooms,
        areaSqft: property.area_sqft,
      })
    : null;

  return (
    <>
      <SeoHelmet
        title={metaTitle}
        description={metaDescription}
        canonicalUrl={url}
        ogImage={property?.main_image_url}
        breadcrumb={breadcrumb}
        jsonLd={listingLd ?? undefined}
      />
      <ListingDetailClient />
    </>
  );
}
