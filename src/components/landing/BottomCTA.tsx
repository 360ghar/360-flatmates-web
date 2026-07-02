import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

import { buttonClasses } from "@/components/ui/Button";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { AppStoreBadges } from "./AppStoreBadges";

export function BottomCTA() {
  return (
    <section
      className="bg-surface px-5 py-16 md:px-12 md:py-24"
      aria-labelledby="bottom-cta-heading"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-8 overflow-hidden rounded-[var(--radius-promo)] bg-ink p-6 text-paper shadow-hard md:grid-cols-[1.35fr_0.65fr] md:p-10">
        <div>
          <h2 id="bottom-cta-heading" className="max-w-2xl font-serif text-4xl leading-tight tracking-tight md:text-6xl">
            Ready to find your vibe match?
          </h2>
          <p className="mt-5 max-w-[58ch] text-body-lg text-paper/72">
            Start with verified rooms, real compatibility signals, and visits that stay attached to the listing.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              to="/discover"
              className={buttonClasses("highlight", "tall") + " min-w-[190px]"}
            >
              Start matching
            </Link>
            <Link
              to="/login?intent=list-property"
              className="inline-flex items-center gap-1.5 text-label-lg text-paper/76 transition-colors hover:text-action"
            >
              List a room
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <p className="text-label-md text-paper/55">Download the app</p>
            <AppStoreBadges variant="dark" />
          </div>
        </div>

        <div className="relative hidden min-h-[220px] md:block">
          <div className="absolute inset-0 rounded-full bg-lavender/10" aria-hidden="true" />
          <NetworkImage
            src="/brand/flatmate-cta-companion.webp"
            alt="Flatmate carrying a moving box and keys"
            wrapperClassName="absolute bottom-[-30px] left-1/2 h-[242px] w-[430px] !max-w-none -translate-x-1/2 md:bottom-[-26px] md:h-[280px] md:w-[498px]"
            className="object-contain"
            width={1672}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
