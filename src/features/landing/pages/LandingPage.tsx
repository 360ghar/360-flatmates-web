import { FAQAccordion } from "@/features/landing/components/FAQAccordion";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { MatchDemo } from "@/features/landing/components/MatchDemo";
import { MoveInStory } from "@/features/landing/components/MoveInStory";
import { NeighbourhoodPostcards } from "@/features/landing/components/NeighbourhoodPostcards";
import { FAQ_ITEMS } from "@/features/landing/lib/landing-data";
import { SeoHelmet, SITE_URL, buildFaqPageSchema, buildServiceSchema, buildSpeakableSchema } from "@/lib/seo";

/**
 * One day in the neighbourhood: morning in the hero, paper layers down the
 * page, and night in the footer (SiteFooter).
 */
export function LandingPage() {
  return (
    <>
      <SeoHelmet
        title="Find Compatible Flatmates & Verified Rooms Across India"
        description="Find compatible flatmates and verified rental listings across India. Lifestyle compatibility matching, verified listings, visit scheduling, and in-app chat."
        canonicalUrl={SITE_URL}
        jsonLd={[
          buildFaqPageSchema(FAQ_ITEMS),
          buildServiceSchema(),
          buildSpeakableSchema(["main h1", "[data-hero-summary]"])
        ]}
      />
      {/* The hero's torn edge opens onto this paper-1 band, which carries the
          search sheet and the match demo, then tears back to the sky. */}
      <div className="paper-edge-torn-bottom paper-grain bg-paper-1 pb-[var(--torn-depth)]">
        <HeroSection />
        <MatchDemo />
      </div>
      <MoveInStory />
      <NeighbourhoodPostcards />
      <FAQAccordion />
    </>
  );
}
