import { Link } from "react-router";

import { buttonClasses } from "@/components/ui/component-utils";

/* Closing line of the landing page, resting on the sky above the torn footer. */
export function BottomCTA() {
  return (
    <section
      className="px-5 pb-24 pt-12 md:px-12 md:pb-28"
      aria-labelledby="bottom-cta-heading"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <h2 id="bottom-cta-heading" className="text-display max-w-[16ch] text-ink">
          Your next home is a few good conversations away.
        </h2>
        <Link to="/discover" className={buttonClasses("primary", "tall")}>
          Start matching
        </Link>
      </div>
    </section>
  );
}
