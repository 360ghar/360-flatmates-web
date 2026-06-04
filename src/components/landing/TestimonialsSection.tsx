import { RevealSection } from "@/components/ui/RevealSection";
import { TESTIMONIALS } from "./landing-data";

const AVATAR_MAP: Record<string, string> = {
  "Priya M.": "/avatars/priya.png",
  "Rohan K.": "/avatars/rohan.png",
};

export function TestimonialsSection() {
  return (
    <section className="bg-paper py-20 md:py-28 border-b border-line-low" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-7xl px-5 md:px-12">
        <RevealSection className="mb-14 text-center">
          <h2 id="testimonials-heading" className="text-display text-4xl md:text-5xl text-ink">
            10,000 people stopped settling.
          </h2>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {TESTIMONIALS.map((testimonial) => (
            <RevealSection key={testimonial.name} className="bento-card card-glow relative flex flex-col justify-between p-8 md:p-10 bg-surface border border-line-low hover:border-accent/15 transition-all duration-300">
              <div className="relative pl-6">
                <span className="font-serif-italic text-accent/25 text-7xl select-none absolute -left-2 -top-5 font-light" aria-hidden="true">&ldquo;</span>
                <p className="font-serif-italic text-2xl md:text-3xl text-ink leading-relaxed font-light italic relative z-10">
                  {testimonial.quote}
                </p>
              </div>

              <div className="mt-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full overflow-hidden border border-line shadow-sm bg-paper-2">
                    <img
                      src={AVATAR_MAP[testimonial.name] ?? "/avatars/anya.png"}
                      alt={testimonial.name}
                      width={44}
                      height={44}
                      className="object-cover h-full w-full"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div>
                    <p className="text-h3 text-ink font-semibold">{testimonial.name}</p>
                    <p className="text-label-md text-ink-3 uppercase tracking-wider mt-0.5">{testimonial.city}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-success/15 bg-success-soft px-3.5 py-1 text-success shadow-xs">
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

