import {
  FeatureBento,
  HowItWorks,
  CitiesShowcase,
  FAQAccordion,
  BottomCTA,
} from "@/components/landing";
import { LandingClientSections } from "@/components/landing/LandingClientSections";
import { FAQ_ITEMS } from "@/components/landing/landing-data";
import { SeoHelmet, SITE_URL } from "@/lib/seo";

export function LandingPage() {
  return (
    <>
      <SeoHelmet
        title="Find Compatible Flatmates & Verified Rooms Across India"
        description="Find compatible flatmates and verified rental listings across India. 6-dimension compatibility matching, society vibe tags, visit scheduling, and in-app chat for better living."
        canonicalUrl={SITE_URL}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQ_ITEMS.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer,
                },
              })),
            }),
          }}
        />
      </SeoHelmet>
      <main id="main" suppressHydrationWarning>
        <LandingClientSections />
        <FeatureBento />
        <HowItWorks />
        <CitiesShowcase />
        <FAQAccordion />
        <BottomCTA />
      </main>
    </>
  );
}
