import { Link } from "react-router";

import { PaperScene } from "@/components/paper/PaperScene";
import { LandingSearch } from "./LandingSearch";

/* The first screen is the diorama itself: the headline hangs in the paper
   sky, the neighbourhood fills the ground, and the search sheet is pinned
   across the torn edge so it belongs to both layers. */
export function HeroSection() {
  return (
    <section className="relative" aria-labelledby="hero-heading">
      <PaperScene className="h-[min(calc(100dvh-var(--public-header-h)),760px)] min-h-[560px]" edgeClassName="bg-paper-1">
        <div className="page-container pt-[9vh] md:pt-[11vh]">
          <h1 id="hero-heading" className="text-hero-display max-w-[15ch] text-ink">
            Find your flatmate, not a nightmare.
          </h1>
          <p data-hero-summary className="mt-4 max-w-[44ch] text-body-lg text-ink-2">
            Verified rooms, lifestyle fit and visits, in one place.
          </p>
        </div>
      </PaperScene>

      <div className="relative z-20 mx-auto -mt-28 w-full max-w-3xl px-[var(--gutter)] md:-mt-32">
        <div className="paper-grain rounded-hand bg-surface-elevated p-4 shadow-md md:p-6">
          <LandingSearch />
          <p className="mt-4 text-body-md text-ink-2">
            Have a room to share?{" "}
            <Link to="/login?intent=list-property" className="font-semibold text-clay underline-offset-4 hover:underline">
              List it free
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
