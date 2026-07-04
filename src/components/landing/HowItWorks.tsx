import { RevealSection } from "@/components/ui/RevealSection";
import { STEPS } from "./landing-data";

export function HowItWorks() {
  return (
    <section
      className="bg-peach py-20 md:py-28 border-b border-line-low"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-12">
        <RevealSection className="mx-auto mb-16 max-w-2xl text-center">
          <h2 id="how-it-works-heading" className="text-display mx-auto max-w-xl text-ink md:text-5xl">
            From first search to first visit.
          </h2>
          <p className="mx-auto mt-5 max-w-[56ch] text-body-lg text-ink-2">
            The flow stays simple because every step carries the context from the one before it.
          </p>
        </RevealSection>

        <div className="relative grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          <div
            className="pointer-events-none absolute left-[16.67%] right-[16.67%] top-14 hidden h-px bg-line md:block"
            aria-hidden="true"
          />

          {STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            return (
              <RevealSection
                key={step.number}
                staggerIndex={idx + 1}
                className="relative rounded-[var(--radius-promo)] border border-line-low bg-paper p-6 text-center"
              >
                <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-line bg-surface text-accent shadow-sm">
                  <StepIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-h2 text-ink leading-snug">{step.title}</h3>
                <p className="mx-auto mt-3 max-w-xs text-body-md text-ink-3 leading-relaxed">
                  {step.description}
                </p>
              </RevealSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
