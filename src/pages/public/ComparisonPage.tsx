import { Link } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Check, X } from "lucide-react";

interface ComparisonData {
  slug: string;
  title: string;
  description: string;
  ourName: string;
  theirName: string;
  features: {
    name: string;
    us: boolean;
    them: boolean;
    note?: string;
  }[];
  ctaText: string;
}

const COMPARISONS: Record<string, ComparisonData> = {
  "360-flatmates-vs-nobroker": {
    slug: "360-flatmates-vs-nobroker",
    title: "360 Flatmates vs NoBroker: Which is Better for Finding Flatmates?",
    description: "Compare 360 Flatmates and NoBroker for flatmate matching, listing quality, and safety features.",
    ourName: "360 Flatmates",
    theirName: "NoBroker",
    features: [
      { name: "Compatibility-based matching", us: true, them: false, note: "6-dimension lifestyle matching" },
      { name: "Phone-verified users", us: true, them: true },
      { name: "Listing verification", us: true, them: true },
      { name: "Society vibe tags", us: true, them: false },
      { name: "In-app chat with context", us: true, them: false },
      { name: "Visit scheduling", us: true, them: true },
      { name: "Free to use", us: true, them: false, note: "NoBroker charges brokerage" },
      { name: "Flatmate-focused platform", us: true, them: false, note: "NoBroker is property-focused" },
    ],
    ctaText: "Try 360 Flatmates Free",
  },
  "360-flatmates-vs-facebook-groups": {
    slug: "360-flatmates-vs-facebook-groups",
    title: "360 Flatmates vs Facebook Groups: Safer Flatmate Matching",
    description: "See why 360 Flatmates is safer and more effective than Facebook groups for finding flatmates.",
    ourName: "360 Flatmates",
    theirName: "Facebook Groups",
    features: [
      { name: "Verified listings", us: true, them: false },
      { name: "Phone verification", us: true, them: false },
      { name: "Compatibility scoring", us: true, them: false },
      { name: "Structured profiles", us: true, them: false },
      { name: "In-app messaging", us: true, them: true },
      { name: "Report & moderation", us: true, them: false },
      { name: "Search filters", us: true, them: false, note: "Limited in Facebook" },
      { name: "Visit scheduling", us: true, them: false },
    ],
    ctaText: "Find Verified Flatmates",
  },
};

export function ComparisonPage() {
  const slug = window.location.pathname.split("/").pop();
  const comparison = COMPARISONS[slug || ""] || COMPARISONS["360-flatmates-vs-nobroker"];

  const url = `${SITE_URL}/compare/${comparison.slug}`;

  return (
    <>
      <SeoHelmet
        title={comparison.title}
        description={comparison.description}
        canonicalUrl={url}
      />

      <main id="main" className="page-fade mx-auto max-w-5xl px-5 py-12 md:px-6">
        <div className="text-center">
          <p className="text-eyebrow text-accent">Comparison</p>
          <h1 className="mt-3 text-h1">{comparison.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-ink-2">
            An honest comparison to help you choose the best platform for finding compatible flatmates.
          </p>
        </div>

        <div className="mt-12">
          <Card className="overflow-hidden">
            <div className="grid grid-cols-3 border-b border-line-low">
              <div className="p-5 bg-surface">
                <p className="text-eyebrow text-accent">Feature</p>
              </div>
              <div className="p-5 bg-accent-soft text-center">
                <p className="text-h3 text-accent">{comparison.ourName}</p>
              </div>
              <div className="p-5 text-center">
                <p className="text-h3 text-ink-2">{comparison.theirName}</p>
              </div>
            </div>

            {comparison.features.map((feature, i) => (
              <div
                key={feature.name}
                className={`grid grid-cols-3 ${i < comparison.features.length - 1 ? "border-b border-line-low" : ""}`}
              >
                <div className="p-4 text-body-md text-ink-2">
                  {feature.name}
                  {feature.note && (
                    <p className="text-label-md text-ink-3 mt-0.5">{feature.note}</p>
                  )}
                </div>
                <div className="p-4 flex items-center justify-center bg-accent-soft/30">
                  {feature.us ? (
                    <Check className="h-5 w-5 text-success" />
                  ) : (
                    <X className="h-5 w-5 text-ink-3" />
                  )}
                </div>
                <div className="p-4 flex items-center justify-center">
                  {feature.them ? (
                    <Check className="h-5 w-5 text-success" />
                  ) : (
                    <X className="h-5 w-5 text-ink-3" />
                  )}
                </div>
              </div>
            ))}
          </Card>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-h2">Ready to find your flatmate the smart way?</h2>
          <p className="mt-3 text-body-lg text-ink-2">
            Join thousands who've found compatible flatmates through our platform.
          </p>
          <Link to="/signup" className={buttonClasses("primary", "tall") + " mt-6 shadow-cta"}>
            {comparison.ctaText}
          </Link>
        </div>
      </main>
    </>
  );
}
