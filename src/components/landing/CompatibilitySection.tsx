import { Link } from "react-router";
import { ArrowRight, Check } from "lucide-react";

import { useInView } from "@/hooks/useInView";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { RevealSection } from "@/components/ui/RevealSection";
import { DIMENSIONS } from "./landing-data";

/* The spine of the page: the 6-dimension compatibility story gets its own
   asymmetric section instead of being buried in a bento cell. The ring draws
   in when the readout scrolls into view (motion that communicates the score
   arriving), and collapses to a static value under reduced motion via the
   global prefers-reduced-motion block. */

export function CompatibilitySection() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35 });

  return (
    <section className="bg-paper border-b border-line-low" aria-labelledby="compatibility-heading">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-12 md:py-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <RevealSection className="lg:col-span-6">
            <h2
              id="compatibility-heading"
              className="text-display text-ink lg:text-[3.5rem] leading-[1.05] tracking-tight"
            >
              Budget and pin code don't make a home.
            </h2>
            <p className="mt-6 max-w-[52ch] text-body-lg text-ink-2 leading-relaxed">
              Most apps stop at rent and location. We score six lifestyle dimensions,
              so the person across the hall actually fits how you live, not just where.
            </p>
            <Link
              to="/discover"
              className="mt-8 inline-flex items-center gap-1.5 text-label-lg text-accent border-b border-accent/30 hover:border-accent pb-1 transition-colors duration-300 group"
            >
              Start matching
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </RevealSection>

          <RevealSection className="lg:col-span-6">
            <div
              ref={ref}
              className="overflow-hidden rounded-[var(--radius-promo)] border border-line bg-surface shadow-sm"
            >
              <div className="grid gap-0 md:grid-cols-[1fr_1.08fr]">
                <div className="flex min-h-[320px] items-center justify-center bg-lavender p-6">
                  <img
                    src="/brand/compatibility-scene.webp"
                    alt="Compatibility dimensions arranged around a shared home"
                    className="max-h-[300px] w-full object-contain"
                    width={1536}
                    height={1024}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-5 border-b border-line-low pb-6">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center text-success">
                      {inView ? (
                        <ProgressRing value={92} size="xl" label="Example compatibility score" />
                      ) : (
                        <span className="h-20 w-20" aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <p className="text-h2 text-2xl md:text-3xl text-ink leading-tight">92% vibe match</p>
                      <p className="mt-1 max-w-[28ch] text-body-md text-ink-3">
                        High alignment across all six dimensions.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-6 sm:grid-cols-3">
                    {DIMENSIONS.map((dim) => {
                      const DimIcon = dim.icon;
                      return (
                        <div
                          key={dim.label}
                          className={`flex items-center gap-2 rounded-xl border border-line/60 p-3 ${dim.tint}`}
                        >
                          <DimIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span className="truncate text-label-md">{dim.label}</span>
                          <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </div>
    </section>
  );
}
