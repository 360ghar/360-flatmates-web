import { SeoHelmet, SITE_URL } from "@/lib/seo";

import StatsClient from "@/components/page-clients/StatsClient";

const breadcrumb = [{ name: "City Stats", item: `${SITE_URL}/stats` }];

export function StatsPage() {
  return (
    <>
      <SeoHelmet
        title="Platform Stats: 360 Flatmates Key Metrics"
        description="Live key metrics for the 360 Flatmates platform — total matches made, verified rooms, active seekers, average compatibility score, and city-level growth across Bangalore and Gurugram."
        canonicalUrl={`${SITE_URL}/stats`}
        breadcrumb={breadcrumb}
      />
      <StatsClient />
    </>
  );
}
