import { RevealSection } from "@/components/ui/RevealSection";
import { STEPS } from "./landing-data";

/* Connected stepper: three nodes sit on a single hairline connector (desktop),
   replacing the previous three-equal-bordered-columns layout. The connector is
   the rhythm change; on mobile the steps simply stack. */

export function HowItWorks() {
  return (
    <section
      className="bg-paper py-20 md:py-28 border-b border-line-low"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-12">
        <RevealSection className="mb-16 text-center">
          <p className="text-eyebrow mb-5">How it works</p>
          <h2 id="how-it-works-heading" className="text-display max-w-xl mx-auto text-ink text-4xl md:text-5xl">
            Three steps to your{" "}
            <span className="text-serif-italic text-accent italic font-normal text-5xl md:text-6xl">next home</span>
          </h2>
        </RevealSection>

        <div className="relative grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          {/* Connector line runs between the three node centers (desktop only) */}
          <div
            className="pointer-events-none absolute top-8 hidden h-px bg-line md:block md:left-[16.67%] md:right-[16.67%]"
            aria-hidden="true"
          />

          {STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            return (
              <RevealSection
                key={step.number}
                staggerIndex={idx + 1}
                className="relative flex flex-col items-center text-center md:px-4"
              >
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border border-line bg-surface shadow-sm">
                  <span className="font-serif-italic italic text-2xl text-accent select-none">
                    {step.number}
                  </span>
                </div>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <StepIcon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <h3 className="text-h1 text-2xl text-ink leading-snug">{step.title}</h3>
                </div>
                <p className="mt-3 max-w-xs text-body-lg text-ink-3 leading-relaxed">
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
