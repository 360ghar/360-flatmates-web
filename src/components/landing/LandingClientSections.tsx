import { HeroSection } from "./HeroSection";
import { TrustStrip } from "./TrustStrip";
import { CompatibilitySection } from "./CompatibilitySection";
import { ComparisonFlow } from "./ComparisonFlow";

/* Top cluster of the landing page: hero, trust band, comparison flow, and the
   compatibility spine. Rendered eagerly as the first-content landing stack. */
export function LandingClientSections() {
  return (
    <>
      <HeroSection />
      <TrustStrip />
      <ComparisonFlow />
      <CompatibilitySection />
    </>
  );
}
