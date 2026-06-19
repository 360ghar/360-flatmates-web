import { Link } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";
import { Wrench } from "lucide-react";
import { focusRing } from "@/components/ui/component-utils";

export function MaintenancePage() {
  return (
    <>
      <SeoHelmet
        title="Site Maintenance"
        description="360 Flatmates is currently undergoing scheduled maintenance. We'll be back shortly."
        canonicalUrl={`${SITE_URL}/maintenance`}
        noindex
      />
      <main id="main" className="flex min-h-screen flex-col items-center justify-center bg-surface text-ink px-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft">
          <Wrench className="h-8 w-8 text-accent" />
        </div>
        <h1 className="mt-6 text-h1">We'll be right back</h1>
        <p className="mt-3 max-w-md text-center text-body-lg text-ink-2">
          360 Flatmates is currently undergoing scheduled maintenance. We're making improvements to serve you better.
        </p>
        <Link
          to="/"
          className={`mt-8 inline-flex h-12 items-center justify-center rounded-[10px] bg-accent px-6 text-label-lg text-white shadow-cta ${focusRing}`}
        >
          Return Home
        </Link>
      </main>
    </>
  );
}
