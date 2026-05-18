import { useParams } from "react-router";
import { SeoHelmet, SITE_URL, buildBreadcrumbJsonLd, homeBreadcrumb } from "@/lib/seo";

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
        formatRent(property.monthly_rent),
        property.bedrooms ? `${property.bedrooms} bed` : undefined,
        property.area_sqft ? `${property.area_sqft} sq ft` : undefined,
      ]
        .filter(Boolean)
        .join(" — ") + ". Verified listing on 360 Flatmates."
    : "View verified room and flatmate listings on 360 Flatmates with compatibility scores, society vibe tags, and visit scheduling.";

  const breadcrumbLd = buildBreadcrumbJsonLd([
    homeBreadcrumb(),
    { name: "Discover", item: `${SITE_URL}/discover` },
    { name: property?.title ?? "Listing", item: url },
  ]);

  const listingLd = property
    ? {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        name: property.title,
        description: property.description ?? `Verified listing in ${property.locality}, ${property.city}`,
        url,
        ...(property.main_image_url ? { image: property.main_image_url } : {}),
        offers: {
          "@type": "Offer",
          price: property.monthly_rent,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: property.locality,
          addressRegion: property.city,
          addressCountry: "IN",
        },
      }
    : null;

  return (
    <>
      <SeoHelmet
        title={metaTitle}
        description={metaDescription}
        canonicalUrl={url}
        ogImage={property?.main_image_url}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbLd),
          }}
        />
        {listingLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(listingLd),
            }}
          />
        )}
      </SeoHelmet>
      <ListingDetailClient />
    </>
  );
}
