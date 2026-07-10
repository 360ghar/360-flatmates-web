import { Link, useParams } from "react-router";
import { SeoHelmet, SITE_URL, buildFaqPageSchema } from "@/lib/seo";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Check, X } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

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
  /** Optional per-comparison FAQ overrides. Falls back to generic FAQs when absent. */
  faqs?: FaqItem[];
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
  "360-flatmates-vs-housing": {
    slug: "360-flatmates-vs-housing",
    title: "360 Flatmates vs Housing.com: Which is Better for Finding Flatmates?",
    description:
      "Compare 360 Flatmates and Housing.com for flatmate matching, compatibility scoring, and listing quality.",
    ourName: "360 Flatmates",
    theirName: "Housing.com",
    features: [
      { name: "Compatibility-based matching", us: true, them: false, note: "6-dimension lifestyle matching" },
      { name: "Phone-verified users", us: true, them: true },
      { name: "Listing verification", us: true, them: true },
      { name: "Society vibe tags", us: true, them: false },
      { name: "In-app chat with context", us: true, them: true },
      { name: "Visit scheduling", us: true, them: true },
      { name: "Free to use", us: true, them: false, note: "Housing.com charges for premium features" },
      { name: "Flatmate-focused platform", us: true, them: false, note: "Housing.com is property-focused" },
    ],
    ctaText: "Try 360 Flatmates Free",
    faqs: [
      {
        question: "Is 360 Flatmates better than Housing.com for finding flatmates?",
        answer:
          "360 Flatmates is purpose-built for flatmate matching with 6-dimension compatibility scoring, society vibe tags, and phone-verified users. Housing.com is a full-featured property platform that also lists flatmates, but its core strength is property search rather than flatmate compatibility. If matching with the right person is your priority, 360 Flatmates offers a more focused experience.",
      },
      {
        question: "How does 360 Flatmates pricing compare to Housing.com?",
        answer:
          "Searching, matching, and visit scheduling on 360 Flatmates are completely free. Housing.com offers free browsing but charges for premium features such as broker connect and priority listing visibility. For flatmate seekers who want a cost-free experience, 360 Flatmates has no paywalls on core matching features.",
      },
      {
        question: "Does 360 Flatmates have verified listings like Housing.com?",
        answer:
          "Yes. 360 Flatmates phone-verifies every user and reviews listings before they go live. Housing.com also has verification processes for its property listings, leveraging its larger team and infrastructure. Both platforms take listing quality seriously, though 360 Flatmates focuses verification specifically on the flatmate context.",
      },
      {
        question: "Which cities does 360 Flatmates cover compared to Housing.com?",
        answer:
          "Housing.com operates across many cities in India with a significantly larger footprint. 360 Flatmates currently focuses on major metros like Bangalore and Gurugram, with plans to expand. Housing.com has broader city coverage, but 360 Flatmates offers deeper flatmate-specific features in the cities it serves.",
      },
    ],
  },
  "360-flatmates-vs-magicbricks": {
    slug: "360-flatmates-vs-magicbricks",
    title: "360 Flatmates vs MagicBricks: Which is Better for Finding Flatmates?",
    description:
      "Compare 360 Flatmates and MagicBricks for flatmate matching, listing quality, and user experience.",
    ourName: "360 Flatmates",
    theirName: "MagicBricks",
    features: [
      { name: "Compatibility-based matching", us: true, them: false, note: "6-dimension lifestyle matching" },
      { name: "Phone-verified users", us: true, them: true },
      { name: "Listing verification", us: true, them: true },
      { name: "Society vibe tags", us: true, them: false },
      { name: "In-app chat with context", us: true, them: false, note: "MagicBricks uses basic contact forms" },
      { name: "Visit scheduling", us: true, them: false },
      { name: "Free to use", us: true, them: false, note: "MagicBricks charges for owner plans" },
      { name: "Flatmate-focused platform", us: true, them: false, note: "MagicBricks is property-focused" },
    ],
    ctaText: "Try 360 Flatmates Free",
    faqs: [
      {
        question: "Is 360 Flatmates better than MagicBricks for finding flatmates?",
        answer:
          "360 Flatmates is designed specifically for flatmate matching, with compatibility scoring, society vibe tags, and in-app scheduling. MagicBricks is one of India's largest property portals with a massive inventory, but flatmate matching is not its primary focus. For finding the right flatmate (not just a flat), 360 Flatmates provides a more targeted experience.",
      },
      {
        question: "How does 360 Flatmates pricing compare to MagicBricks?",
        answer:
          "360 Flatmates is free for all core features including searching, matching, and visit scheduling. MagicBricks operates a freemium model where basic browsing is free, but property owners pay for listing plans and premium visibility. Flatmate seekers on 360 Flatmates face no paywalls.",
      },
      {
        question: "Does 360 Flatmates have verified listings like MagicBricks?",
        answer:
          "Yes. 360 Flatmates verifies users via phone and reviews listings before publishing. MagicBricks also has verification mechanisms for its large property database, including RERA compliance checks for projects. Both platforms work to reduce fake listings, though 360 Flatmates focuses specifically on the flatmate context.",
      },
      {
        question: "Which cities does 360 Flatmates cover compared to MagicBricks?",
        answer:
          "MagicBricks covers thousands of localities across India, reflecting its status as a major national property portal. 360 Flatmates currently focuses on key metros like Bangalore and Gurugram. While MagicBricks has far broader geographic coverage, 360 Flatmates provides deeper flatmate-specific features and compatibility matching in the cities it serves.",
      },
    ],
  },
  "360-flatmates-vs-flatmate-india": {
    slug: "360-flatmates-vs-flatmate-india",
    title: "360 Flatmates vs FlatMate India: Which is Better for Finding Flatmates?",
    description:
      "Compare 360 Flatmates and FlatMate India for flatmate matching, safety features, and overall experience.",
    ourName: "360 Flatmates",
    theirName: "FlatMate India",
    features: [
      { name: "Compatibility-based matching", us: true, them: false, note: "6-dimension lifestyle matching" },
      { name: "Phone-verified users", us: true, them: true },
      { name: "Listing verification", us: true, them: false },
      { name: "Society vibe tags", us: true, them: false },
      { name: "In-app chat with context", us: true, them: false, note: "Limited to basic messaging" },
      { name: "Visit scheduling", us: true, them: false },
      { name: "Free to use", us: true, them: true },
      { name: "Flatmate-focused platform", us: true, them: true },
    ],
    ctaText: "Try 360 Flatmates Free",
    faqs: [
      {
        question: "Is 360 Flatmates better than FlatMate India for finding flatmates?",
        answer:
          "Both platforms focus on flatmate matching, but 360 Flatmates offers more advanced features like 6-dimension compatibility scoring, society vibe tags, and verified listings. FlatMate India provides a straightforward listing-based approach. If you want a data-driven match rather than browsing listings, 360 Flatmates has an edge.",
      },
      {
        question: "How does 360 Flatmates pricing compare to FlatMate India?",
        answer:
          "Both 360 Flatmates and FlatMate India are free for core flatmate-finding features. Neither platform charges flatmate seekers for searching or browsing. 360 Flatmates keeps all matching, scheduling, and chat features free without subscription tiers.",
      },
      {
        question: "Does 360 Flatmates have verified listings like FlatMate India?",
        answer:
          "360 Flatmates phone-verifies every user and reviews listings before they go live, adding a layer of trust and safety. FlatMate India has lighter verification processes. For users concerned about listing authenticity and scam prevention, 360 Flatmates provides more robust verification.",
      },
      {
        question: "Which cities does 360 Flatmates cover compared to FlatMate India?",
        answer:
          "Both platforms are growing and currently focus on major Indian cities. FlatMate India has listings in several cities across India. 360 Flatmates currently focuses on Bangalore and Gurugram with plans to expand to more metros. City coverage is comparable, though availability varies by platform.",
      },
    ],
  },
};

export function ComparisonPage() {
  const { slug } = useParams<{ slug: string }>();
  const comparison = COMPARISONS[slug ?? ""];

  if (!comparison) {
    return (
      <>
        <SeoHelmet
          title="Comparison Not Found"
          description="This comparison page does not exist. Browse 360 Flatmates to find compatible flatmates and verified rooms across India."
          canonicalUrl={`${SITE_URL}/compare/${slug ?? ""}`}
          noindex
        />
        <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-20 text-center">
          <h1 className="text-h1">Comparison not found</h1>
          <p className="mt-4 text-body-lg text-ink-2">
            We don't have this comparison yet.{" "}
            <Link to="/discover" className="text-accent hover:underline">
              Browse all listings
            </Link>
          </p>
        </main>
      </>
    );
  }

  const url = `${SITE_URL}/compare/${comparison.slug}`;

  const faqItems = comparison.faqs ?? [
    {
      question: `Is 360 Flatmates better than ${comparison.theirName} for finding flatmates?`,
      answer: `360 Flatmates is built specifically for flatmate matching with 6-dimension compatibility scoring, verified listings, and in-app chat. ${comparison.theirName} is more general-purpose. The comparison table above shows the differences across key features.`,
    },
    {
      question: `Is 360 Flatmates free compared to ${comparison.theirName}?`,
      answer: `Searching, matching, and visit scheduling on 360 Flatmates are completely free. Some competing platforms charge brokerage or subscription fees; check the comparison table for the specific differences.`,
    },
    {
      question: `Which platform has safer flatmate listings?`,
      answer: `360 Flatmates phone-verifies every user and reviews each listing before it goes live. This reduces fake listings and scams compared to unmoderated alternatives.`,
    },
    {
      question: `Can I see compatibility scores on ${comparison.theirName}?`,
      answer: `Compatibility-based matching across sleep, cleanliness, food, guests, work, and lifestyle is unique to 360 Flatmates. The comparison table indicates which platform offers this.`,
    },
  ];

  const faqLd = buildFaqPageSchema(faqItems);

  return (
    <>
      <SeoHelmet
        title={comparison.title}
        description={comparison.description}
        canonicalUrl={url}
        breadcrumb={[{ name: "Compare", item: `${SITE_URL}/compare` }, { name: comparison.ourName + " vs " + comparison.theirName, item: url }]}
        jsonLd={faqLd}
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
          <Link to="/signup" className={buttonClasses("primary", "tall") + " mt-6"}>
            {comparison.ctaText}
          </Link>
        </div>
      </main>
    </>
  );
}
