import { Link } from "react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/components/ui/component-utils";
import { AppStoreBadges } from "./AppStoreBadges";
import { LandingSearch } from "./LandingSearch";
import { MascotScene } from "./MascotScene";

export function HeroSection() {
  return (
    <section
      className="map-grid-bg relative overflow-hidden rounded-b-[36px] border-b border-line-low px-5 pb-12 pt-14 md:px-12 md:pb-16 md:pt-20"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)]">
        <div className="relative z-[1]">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-caption font-semibold text-ink-2 shadow-xs">
            <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
            Flatmate search, fixed
          </div>

          <h1
            id="hero-heading"
            className="text-hero-display max-w-[11ch] text-ink"
          >
            Find your flatmate, not a nightmare.
          </h1>

          <p data-hero-summary className="mt-6 max-w-[58ch] text-body-lg text-ink-2">
            Search verified rooms, compare lifestyle fit, chat with context, and book visits without jumping between apps.
          </p>

          <div className="mt-8">
            <LandingSearch />
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link to="/discover" className={cn(buttonClasses("primary", "tall"), "min-w-[190px]")}>
              Start matching
            </Link>
            <Link
              to="/login?intent=list-property"
              className="inline-flex items-center gap-1.5 text-label-lg text-ink-2 transition-colors hover:text-accent"
            >
              List a room
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-7 flex flex-col gap-2">
            <p className="text-label-md text-ink-3">Also available on</p>
            <AppStoreBadges variant="light" />
          </div>
        </div>

        <div aria-hidden="true" inert>
          <MascotScene />
        </div>
      </div>
    </section>
  );
}
