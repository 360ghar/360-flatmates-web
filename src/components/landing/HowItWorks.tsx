import { RevealSection } from "@/components/ui/RevealSection";
import { STEPS } from "./landing-data";

export function HowItWorks() {
  return (
    <section
      className="bg-surface py-20 md:py-24"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-12">
        <RevealSection className="mb-14 text-center">
          <p className="text-eyebrow mb-5">How it works</p>
          <h2 id="how-it-works-heading" className="text-display max-w-xl mx-auto text-ink">
            Three steps to your next home
          </h2>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step) => {
            const StepIcon = step.icon;
            return (
              <RevealSection key={step.number} className="bento-card flex flex-col gap-5 p-6">
                <div className="flex items-center gap-3">
                  <span className="accent-pill">{step.number}</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <StepIcon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-h1 text-xl md:text-2xl text-ink mb-2">{step.title}</h3>
                  <p className="text-body-md text-ink-3 leading-relaxed">{step.description}</p>
                </div>
              </RevealSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
