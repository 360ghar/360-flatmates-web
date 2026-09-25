import { Link } from "react-router";
import { Check } from "lucide-react";

import { PaperMiniScene } from "@/components/paper/PaperScene";
import { buttonClasses, cn } from "@/components/ui/component-utils";

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
    <section aria-labelledby="compatibility-heading">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-12 md:py-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <RevealSection className="lg:col-span-6">
            <h2
              id="compatibility-heading"
              className="text-display max-w-[16ch] text-ink"
            >
              Budget and pin code don't make a home.
            </h2>
            <p className="mt-6 max-w-[52ch] text-body-lg text-ink-2 leading-relaxed">
              Most apps stop at rent and location. We score six lifestyle dimensions,
              so the person across the hall actually fits how you live, not just where.
            </p>
            <Link to="/discover" className={cn(buttonClasses("secondary"), "mt-8")}>
              See who fits
            </Link>
          </RevealSection>

          <RevealSection className="lg:col-span-6">
            <div
              ref={ref}
              className="paper-grain overflow-hidden rounded-hand bg-surface shadow-md"
            >
              <div className="grid gap-0">
                <div className="flex items-center justify-center bg-paper-1 p-6">
                  <PaperMiniScene prop="heart" className="max-w-[240px]" />
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-5 pb-6">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center text-success">
                      {inView ? (
                        <ProgressRing value={92} size="xl" label="Example compatibility score" />
                      ) : (
                        <span className="h-20 w-20" aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <p className="text-h2 text-ink">92% vibe match</p>
                      <p className="mt-1 max-w-[28ch] text-body-md text-ink-2">
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
                          className="flex min-h-11 items-center gap-2 rounded-cut-md bg-surface-soft px-3 text-ink"
                        >
                          <DimIcon className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                          <span className="truncate text-label-md">{dim.label}</span>
                          <Check className="ml-auto h-4 w-4 shrink-0 text-success" aria-hidden="true" />
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
