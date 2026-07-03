import {
  CalendarClock,
  Check,
  Home,
  MessageCircleQuestion,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import { RevealSection } from "@/components/ui/RevealSection";

const oldWayItems = [
  { label: "Is the room still available?", Icon: MessageCircleQuestion },
  { label: "What are the house rules?", Icon: Search },
  { label: "Can I book a visit?", Icon: CalendarClock },
  { label: "Will we actually get along?", Icon: UserRound },
];

const newWayItems = [
  "Verified room",
  "Lifestyle match",
  "Context chat",
  "Visit slot",
];

export function ComparisonFlow() {
  return (
    <section className="bg-surface py-20 md:py-28" aria-labelledby="comparison-heading">
      <div className="mx-auto max-w-7xl px-5 md:px-12">
        <RevealSection className="mx-auto max-w-2xl text-center">
          <h2 id="comparison-heading" className="text-display text-ink md:text-5xl">
            Flatmate search without the chaos.
          </h2>
          <p className="mx-auto mt-5 max-w-[58ch] text-body-lg text-ink-2">
            Most rental journeys scatter trust, compatibility, chat, and visits across different places. Flatmates keeps the loop in one workspace.
          </p>
        </RevealSection>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <RevealSection>
            <article className="min-h-[360px] rounded-[var(--radius-promo)] border border-line-low bg-paper p-6 shadow-hard-paper md:p-8">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-h2 text-ink">The old way</h3>
                  <p className="mt-1 text-body-md text-ink-3">Too many tabs, groups, and repeated questions.</p>
                </div>
                <span className="rounded-full bg-surface px-3 py-1 text-caption text-ink-3">Slow</span>
              </div>
              <div className="relative flex min-h-[230px] flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl bg-surface p-4 sm:flex-row sm:gap-0">
                <div className="absolute inset-0 map-grid-bg opacity-25" aria-hidden="true" />
                <div className="relative z-[1] flex h-16 w-16 items-center justify-center rounded-full bg-ink text-body-md font-semibold text-paper">
                  You
                </div>
                <div className="relative z-[1] h-8 w-px bg-ink-4 sm:mx-3 sm:h-px sm:max-w-20 sm:flex-1" />
                <div className="relative z-[1] grid w-full max-w-[280px] gap-2">
                  {oldWayItems.map(({ label, Icon }, index) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-caption text-ink-2 shadow-xs"
                      style={{ transform: `translateX(${index % 2 === 0 ? -4 : 6}px)` }}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                      <span className="min-w-0 flex-1">{label}</span>
                      <X className="ml-auto h-3.5 w-3.5 text-error" aria-hidden="true" />
                    </div>
                  ))}
                </div>
                <div className="relative z-[1] h-8 w-px bg-ink-4 sm:mx-3 sm:h-px sm:max-w-20 sm:flex-1" />
                <div className="relative z-[1] flex h-14 w-14 items-center justify-center rounded-full bg-accent text-paper">
                  <Home className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </article>
          </RevealSection>

          <RevealSection staggerIndex={2}>
            <article className="min-h-[360px] rounded-[var(--radius-promo)] border border-accent/10 bg-lavender p-6 shadow-hard-accent md:p-8">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-h2 text-ink">The Flatmates way</h3>
                  <p className="mt-1 text-body-md text-ink-2">One compatibility-led path from search to visit.</p>
                </div>
                <span className="rounded-full bg-action px-3 py-1 text-caption font-semibold text-action-ink">Clear</span>
              </div>
              <div className="flex min-h-[230px] flex-col justify-center gap-5 rounded-2xl bg-surface/72 p-5">
                <div className="grid items-center justify-items-center gap-3 sm:grid-cols-[auto_minmax(24px,1fr)_auto_minmax(24px,1fr)_auto] sm:gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-body-md font-semibold text-paper">
                    You
                  </div>
                  <div className="h-8 w-px bg-ink-4 sm:h-px sm:w-full" />
                  <div className="rounded-full border-[1.5px] border-ink bg-surface px-5 py-3 text-center shadow-sm sm:px-7">
                    <span className="font-serif text-3xl text-ink">360</span>
                    <span className="ml-1 text-h3 text-accent">Flatmates</span>
                  </div>
                  <div className="h-8 w-px bg-ink-4 sm:h-px sm:w-full" />
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-paper">
                    <Home className="h-6 w-6" aria-hidden="true" />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  {newWayItems.map((label) => (
                    <div
                      key={label}
                      className="flex items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-3 py-2 text-caption font-semibold text-ink-2"
                    >
                      <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="mx-auto flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 text-body-md font-semibold text-accent">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span>6-dimension compatibility</span>
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
            </article>
          </RevealSection>
        </div>
      </div>
    </section>
  );
}
