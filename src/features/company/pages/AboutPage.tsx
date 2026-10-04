import { SeoHelmet, SITE_URL } from "@/lib/seo";
import { PaperScene } from "@/components/paper/PaperScene";
import { cn } from "@/components/ui/component-utils";

const VALUES = [
  {
    title: "Compatibility over convenience",
    body: "A cheap room with the wrong flatmate costs more than rent. We match on how people live, not only on location and budget."
  },
  {
    title: "Verified, always",
    body: "Every listing is reviewed and every user is phone-verified. No fake profiles and no bait-and-switch photos."
  },
  {
    title: "Safety as the default",
    body: "Chat, visits and reports happen in the app. Your phone number stays private until you choose to share it."
  },
  {
    title: "Decisions with context",
    body: "Scores, society details and visit times sit next to every choice, so you can move in with confidence."
  }
] as const;

const TILTS = ["md:-rotate-[0.8deg]", "md:rotate-[0.6deg] md:translate-y-4", "md:rotate-[0.5deg]", "md:-rotate-[0.7deg] md:translate-y-4"];

export function AboutPage() {
  return (
    <>
      <SeoHelmet
        title="About Us"
        description="360 Flatmates is an India-first flatmate and room-rental platform built around lifestyle compatibility, reviewed listings, and in-app visit scheduling. Meet the team and the values behind the product."
        canonicalUrl={`${SITE_URL}/about`}
        breadcrumb={[{ name: "About", item: `${SITE_URL}/about` }]}
      />

      <PaperScene className="h-[460px] md:h-[540px]" edgeClassName="bg-paper">
        <div className="page-container pt-12 md:pt-20">
          <h1 className="max-w-[24ch] text-h1 text-ink sm:text-hero-display">Finding a home starts with finding your people.</h1>
          <p className="mt-5 max-w-[46ch] text-body-lg text-ink-2">
            We help people who move for work find a room and the flatmates to share it with.
          </p>
        </div>
      </PaperScene>

      <div className="page-container page-fade flex flex-col gap-20 py-16 md:gap-28 md:py-24">
        <section aria-labelledby="story-heading" className="grid gap-6 lg:grid-cols-12 lg:gap-10">
          <h2 id="story-heading" className="text-display text-ink lg:col-span-5">Why we built it</h2>
          <div className="flex max-w-[62ch] flex-col gap-5 text-body-lg text-ink-2 lg:col-span-7">
            <p>
              We are a small team of engineers and designers in India. Most of us have moved cities for a job and
              chosen a flat in a hurry, from a group chat, a stranger and three photos.
            </p>
            <p>
              Rent and pin code were easy to compare. What we could not see was whether the person across the hall
              slept at ten or at three, cooked every night or never, and kept the AC at 18 degrees until morning.
            </p>
            <p className="text-ink">So we built the flatmate search we wished we had.</p>
          </div>
        </section>

        <section aria-labelledby="values-heading">
          <h2 id="values-heading" className="text-display text-ink">What we hold to</h2>
          <ul className="mt-10 grid gap-5 md:grid-cols-2 md:gap-6">
            {VALUES.map((value, index) => (
              <li key={value.title} className={cn("paper-grain rounded-hand bg-surface p-6 shadow-sm md:p-8", TILTS[index])}>
                <h3 className="text-h2 text-ink">{value.title}</h3>
                <p className="mt-2 max-w-[46ch] text-body-lg text-ink-2">{value.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
