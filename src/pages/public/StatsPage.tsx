import { SeoHelmet, SITE_URL, buildBreadcrumbJsonLd, homeBreadcrumb } from "@/lib/seo";

import StatsClient from "@/components/page-clients/StatsClient";

const breadcrumbLd = buildBreadcrumbJsonLd([
  homeBreadcrumb(),
  { name: "City Stats", item: `${SITE_URL}/stats` },
]);

export function StatsPage() {
  return (
    <>
      <SeoHelmet
        title="City Stats — Flatmate Market Data"
        description="Explore flatmate market statistics across Indian cities. Active seekers, verified listings, average rents, and growth trends on 360 Flatmates."
        canonicalUrl={`${SITE_URL}/stats`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbLd),
          }}
        />
      </SeoHelmet>
      <StatsClient />
    </>
  );
}
