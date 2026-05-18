import { RevealSection } from "@/components/ui/RevealSection";
import { TESTIMONIALS } from "./landing-data";

const AVATAR_MAP: Record<string, number> = {
  "Priya M.": 47,
  "Rohan K.": 12,
};

export function TestimonialsSection() {
  return (
    <section className="bg-surface py-20 md:py-24" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-7xl px-5 md:px-12">
        <RevealSection className="mb-14">
          <p className="text-eyebrow mb-5">Don't take our word for it</p>
          <h2 id="testimonials-heading" className="text-h1 text-ink">
            Real people, real flatmates
          </h2>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((testimonial) => (
            <RevealSection key={testimonial.name} className="bento-card flex flex-col justify-between p-6 md:p-8">
              <div>
                <span className="text-serif-italic text-accent text-5xl leading-none select-none pointer-events-none">&ldquo;</span>
                <p className="text-h2 text-ink leading-snug -mt-4 md:text-2xl">
                  {testimonial.quote}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden border border-line-low shadow-sm bg-paper-2">
                    <img
                      src={`https://i.pravatar.cc/150?img=${AVATAR_MAP[testimonial.name] ?? 1}`}
                      alt={testimonial.name}
                      width={40}
                      height={40}
                      className="object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div>
                    <p className="text-h3 text-ink">{testimonial.name}</p>
                    <p className="text-label-md text-ink-3">{testimonial.city}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-success-soft px-3 py-1">
                  <span className="text-label-lg text-success tabular">{testimonial.compatibility}%</span>
                  <span className="text-label-md text-success">match</span>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}
