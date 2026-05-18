import { Helmet } from "react-helmet-async";

import SemanticSearchClient from "@/components/page-clients/SemanticSearchClient";
import { buildBreadcrumbJsonLd, homeBreadcrumb } from "@/lib/utils/seo";
import { BASE_URL } from "@/lib/config";

export function SemanticSearchPage() {
  const breadcrumbLd = buildBreadcrumbJsonLd([
    homeBreadcrumb(),
    { name: "Search", item: `${BASE_URL}/search` },
    { name: "Semantic Search", item: `${BASE_URL}/search/semantic` },
  ]);

  return (
    <>
      <Helmet>
        <title>Semantic Search — Find Your Ideal Home | 360 Flatmates</title>
        <meta name="description" content="Describe your ideal home in plain language and let 360 Flatmates find the best matches. Search by vibe, budget, amenities, and lifestyle preferences." />
        <link rel="canonical" href={`${BASE_URL}/search/semantic`} />
        <meta property="og:title" content="Semantic Search — Find Your Ideal Home" />
        <meta property="og:description" content="Describe your ideal home in plain language and let 360 Flatmates find the best matches." />
        <meta property="og:url" content={`${BASE_URL}/search/semantic`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="360 Flatmates" />
      </Helmet>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbLd),
        }}
      />
      <SemanticSearchClient />
    </>
  );
}
