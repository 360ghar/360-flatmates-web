import { RevealSection } from "@/components/ui/RevealSection";
import { TESTIMONIALS } from "./landing-data";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TestimonialsSection() {
  return (
    <section className="bg-sky py-20 md:py-28 border-b border-line-low" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-7xl px-5 md:px-12">
        <RevealSection className="mb-14 text-center">
          <h2 id="testimonials-heading" className="text-display text-ink">
            People are choosing fit over guesswork.
          </h2>
        </RevealSection>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <RevealSection
              key={testimonial.name}
              className={
                index === 0
                  ? "relative flex flex-col justify-between rounded-[var(--radius-promo)] border border-line-low bg-lavender p-8 lg:col-span-2"
                  : "relative flex flex-col justify-between rounded-[var(--radius-promo)] border border-line-low bg-surface p-8"
              }
            >
              <div className="relative">
                <span className="absolute -left-1 -top-6 select-none font-sans text-7xl font-light text-accent/20" aria-hidden="true">&ldquo;</span>
                <p className={index === 0 ? "relative z-10 max-w-2xl font-sans text-3xl italic leading-snug text-ink md:text-4xl" : "relative z-10 text-body-lg leading-relaxed text-ink"}>
                  {testimonial.quote}
                </p>
              </div>

              <div className="mt-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-label-lg font-semibold text-accent shadow-sm select-none"
                    aria-hidden="true"
                  >
                    {getInitials(testimonial.name)}
                  </div>
                  <div>
                    <p className="text-h3 text-ink font-semibold">{testimonial.name}</p>
                    <p className="text-label-md text-ink-3 uppercase tracking-wider mt-0.5">{testimonial.city}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-success/15 bg-success-soft px-3.5 py-1 text-success shadow-xs">
                  <span className="text-label-lg font-bold tabular">{testimonial.compatibility}%</span>
                  <span className="text-label-md uppercase tracking-wider">match</span>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}
