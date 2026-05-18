import { Link } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";

import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TrustBadge } from "@/components/ui/TrustBadge";

const VALUES = [
  {
    title: "Compatibility over convenience",
    description:
      "A cheap room with the wrong flatmate costs more than rent. We match on lifestyle, not just location and budget.",
    badge: "reviewed" as const,
  },
  {
    title: "Verified, always",
    description:
      "Every listing is reviewed, every user is phone-verified. No fake profiles, no bait-and-switch photos.",
    badge: "verified" as const,
  },
  {
    title: "Safety as default",
    description:
      "In-app chat, scheduled visits, and reporting tools. Your phone number stays private until you choose to share it.",
    badge: "safe" as const,
  },
  {
    title: "Context-rich decisions",
    description:
      "Compatibility scores, society vibe tags, and visit scheduling built into the flow. Move in with confidence.",
    badge: "privacy" as const,
  },
] as const;

export function AboutPage() {
  return (
    <>
      <SeoHelmet
        title="About Us"
        description="Learn about 360 Flatmates, our mission to make flatmate matching smarter through compatibility scores, verified listings, and safety-first workflows across India."
        canonicalUrl={`${SITE_URL}/about`}
      />
      <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-12 md:px-6">
        <div className="text-center">
          <p className="text-eyebrow text-accent">About</p>
          <h1 className="mt-3 text-h1">360 Flatmates</h1>
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-ink-2">
            We help young professionals find homes and people through compatibility, verified
            listings, and safety-first workflows.
          </p>
        </div>

        <section className="mt-12">
          <h2 className="text-h2 text-center">Our values</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {VALUES.map((value) => (
              <Card key={value.title} className="flex flex-col gap-3 p-5">
                <TrustBadge variant={value.badge} />
                <h3 className="text-h3">{value.title}</h3>
                <p className="text-body-md text-ink-2">{value.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-h2 text-center">The team</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-body-lg text-ink-2">
            We are a small team of engineers and designers based in India, building the flatmate
            experience we wished we had. If you have ever moved into a place and realized too late
            that your flatmate keeps the AC on 18 degrees all night, you understand our mission.
          </p>
        </section>

        <div className="mt-10 text-center">
          <Link to="/discover" className={buttonClasses()}>
            Browse Listings
          </Link>
        </div>
      </main>
    </>
  );
}
