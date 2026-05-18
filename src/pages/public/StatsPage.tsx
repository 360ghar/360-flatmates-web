import { Helmet } from "react-helmet-async";

import StatsClient from "@/components/page-clients/StatsClient";
import { buildBreadcrumbJsonLd, homeBreadcrumb } from "@/lib/utils/seo";
import { BASE_URL } from "@/lib/config";

const breadcrumbLd = buildBreadcrumbJsonLd([
  homeBreadcrumb(),
  { name: "City Stats", item: `${BASE_URL}/stats` },
]);

export function StatsPage() {
  return (
    <>
      <Helmet>
        <title>City Stats — Flatmate Market Data | 360 Flatmates</title>
        <meta name="description" content="Explore flatmate market statistics across Indian cities. Active seekers, verified listings, average rents, and growth trends on 360 Flatmates." />
        <link rel="canonical" href={`${BASE_URL}/stats`} />
        <meta property="og:title" content="City Stats — Flatmate Market Data" />
        <meta property="og:description" content="Explore flatmate market statistics across Indian cities. Active seekers, verified listings, average rents, and growth trends." />
        <meta property="og:url" content={`${BASE_URL}/stats`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="360 Flatmates" />
      </Helmet>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbLd),
        }}
      />
      <StatsClient />
    </>
  );
}
