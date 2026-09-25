import { HeroSection } from "./HeroSection";
import { HowItWorks } from "./HowItWorks";
import { CompatibilitySection } from "./CompatibilitySection";

/* Top cluster of the landing page: the diorama hero, the three steps and
   the compatibility story. Rendered eagerly as the first-content stack. */
export function LandingClientSections() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <CompatibilitySection />
    </>
  );
}
