import { SeoHelmet, SITE_URL } from "@/lib/seo";

import SemanticSearchClient from "@/components/page-clients/SemanticSearchClient";

const breadcrumb = [
  { name: "Search", item: `${SITE_URL}/search` },
  { name: "Semantic Search", item: `${SITE_URL}/search/semantic` },
];

export function SemanticSearchPage() {
  return (
    <>
      <SeoHelmet
        title="Semantic Search | Find Your Ideal Home"
        description="Describe your ideal home in plain language and let 360 Flatmates find the best matches. Search by vibe, budget, amenities, and lifestyle preferences."
        canonicalUrl={`${SITE_URL}/search/semantic`}
        breadcrumb={breadcrumb}
        noindex
      />
      <SemanticSearchClient />
    </>
  );
}
