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
        description="360 Flatmates is an India-first flatmate and room-rental platform built around 6-dimension lifestyle compatibility, reviewed listings, and in-app visit scheduling. Meet the team and the values behind the product."
        canonicalUrl={`${SITE_URL}/about`}
        breadcrumb={[{ name: "About", item: `${SITE_URL}/about` }]}
      />
      <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-16 md:px-12">
        <div className="text-center mb-16">
          <p className="text-eyebrow text-accent uppercase tracking-widest">About</p>
          <h1 className="mt-4 text-display text-4xl md:text-6xl text-ink font-normal leading-tight tracking-tight max-w-3xl mx-auto">
            Finding a home starts with <span className="text-serif-italic text-accent italic font-normal text-5xl md:text-7xl">finding your people</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-body-lg text-ink-2">
            We help young professionals find homes and build harmonious lives through compatibility, verified
            listings, and safety-first workflows.
          </p>
        </div>

        <section className="py-16 border-t border-line-low">
          <h2 className="text-display text-3xl md:text-4xl text-ink font-normal text-center mb-10">Our values</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {VALUES.map((value) => (
              <Card
                key={value.title}
                className="flex flex-col gap-4 p-6 border border-line-low hover:border-accent/20 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <div className="flex justify-between items-start">
                  <TrustBadge variant={value.badge} />
                </div>
                <h3 className="text-h3 text-ink mt-2">{value.title}</h3>
                <p className="text-body-md text-ink-2 leading-relaxed">{value.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-16 border-t border-line-low">
          <div className="bg-paper/50 border border-line-low rounded-2xl p-8 md:p-12 max-w-3xl mx-auto text-center relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-20%] w-[50%] aspect-square rounded-full bg-accent/5 blur-[80px] pointer-events-none" />
            <h2 className="text-display text-3xl text-ink font-normal mb-6">The team</h2>
            <p className="text-body-lg text-ink-2 leading-relaxed max-w-2xl mx-auto font-serif italic text-lg md:text-xl">
              "We are a small team of engineers and designers based in India, building the flatmate
              experience we wished we had. If you have ever moved into a place and realized too late
              that your flatmate keeps the AC on 18 degrees all night, you understand our mission."
            </p>
            <p className="mt-6 text-eyebrow text-accent uppercase tracking-wider">The 360 Flatmates Team</p>
          </div>
        </section>

        <div className="mt-8 text-center">
          <Link to="/discover" className={buttonClasses("primary", "tall") + " shadow-cta"}>
            Browse Listings
          </Link>
        </div>
      </main>
    </>
  );
}
