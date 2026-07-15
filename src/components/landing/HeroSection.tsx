import { Link } from "react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { buttonClasses } from "@/components/ui/component-utils";
import { cn } from "@/components/ui/component-utils";
import { AppStoreBadges } from "./AppStoreBadges";
import { LandingSearch } from "./LandingSearch";
import { MascotScene } from "./MascotScene";

export function HeroSection() {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-line-low bg-paper px-5 py-12 md:px-12 md:py-16",
        /* Fit the full two-column hero below the 72px sticky public header */
        "lg:flex lg:min-h-[calc(100dvh-72px)] lg:items-center lg:py-8",
      )}
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)] lg:gap-10">
        <div className="relative z-[1]">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-caption font-semibold text-ink-2 shadow-xs lg:mb-5">
            <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
            Flatmate search, fixed
          </div>

          <h1
            id="hero-heading"
            className="text-hero-display max-w-[14ch] text-ink"
          >
            Find your flatmate, not a nightmare.
          </h1>

          <p data-hero-summary className="mt-4 max-w-[48ch] text-body-lg text-ink-2 lg:mt-5">
            Search verified rooms, compare lifestyle fit, chat with context, and book visits without jumping between apps.
          </p>

          <div className="mt-6">
            <LandingSearch />
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link to="/discover" className={cn(buttonClasses("primary", "tall"), "min-w-[190px] rounded-full")}>
              Start matching
            </Link>
            <Link
              to="/login?intent=list-property"
              className="inline-flex items-center gap-1.5 text-body-md font-semibold text-ink-2 transition-colors hover:text-ink"
            >
              List a room
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-5 flex flex-col gap-2">
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
