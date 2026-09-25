import { FeatureBento, CitiesShowcase, FAQAccordion, BottomCTA } from "@/components/landing";
import { LandingClientSections } from "@/components/landing/LandingClientSections";
import { FAQ_ITEMS } from "@/components/landing/landing-data";
import { SeoHelmet, SITE_URL, buildFaqPageSchema, buildServiceSchema, buildSpeakableSchema } from "@/lib/seo";

export function LandingPage() {
  return (
    <>
      <SeoHelmet
        title="Find Compatible Flatmates & Verified Rooms Across India"
        description="Find compatible flatmates and verified rental listings across India. 6-dimension compatibility matching, society vibe tags, visit scheduling, and in-app chat for better living."
        canonicalUrl={SITE_URL}
        jsonLd={[
          buildFaqPageSchema(FAQ_ITEMS),
          buildServiceSchema(),
          buildSpeakableSchema(["main h1", "[data-hero-summary]"]),
        ]}
      />
      <main id="main" suppressHydrationWarning>
        <LandingClientSections />
        <FeatureBento />
        <CitiesShowcase />
        <FAQAccordion />
        <BottomCTA />
      </main>
    </>
  );
}
