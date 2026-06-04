import { lazy, Suspense } from "react";

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

const TestimonialsSection = lazy(() =>
  import("@/components/landing/TestimonialsSection").then((m) => ({
    default: m.TestimonialsSection,
  })),
);

function TestimonialsFallback() {
  return (
    <section className="bg-paper py-20 md:py-28 border-b border-line-low">
      <div className="mx-auto max-w-7xl px-5 md:px-12 text-center">
        <h2 className="text-display text-4xl md:text-5xl text-ink">
          10,000 people stopped settling.
        </h2>
      </div>
    </section>
  );
}

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
        <Suspense fallback={<TestimonialsFallback />}>
          <TestimonialsSection />
        </Suspense>
        <FAQAccordion />
        <BottomCTA />
      </main>
    </>
  );
}
