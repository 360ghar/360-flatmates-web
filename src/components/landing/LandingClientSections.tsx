import { HeroSection } from "./HeroSection";
import { TrustStrip } from "./TrustStrip";
import { CompatibilitySection } from "./CompatibilitySection";
import { ComparisonFlow } from "./ComparisonFlow";

/* Top cluster of the landing page: hero, the trust band directly beneath it,
   and the compatibility spine. All lightweight, so rendered eagerly. */
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
