import { useState, useEffect, useRef } from "react";
import { RevealSection } from "@/components/ui/RevealSection";
import { TESTIMONIALS } from "./landing-data";

const AVATAR_MAP: Record<string, number> = {
  "Priya M.": 47,
  "Rohan K.": 12,
  "Ananya S.": 44,
  "Vikram T.": 33,
};

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startInterval = () => {
    if (intervalRef.current === null) {
      intervalRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
      }, 6000);
    }
  };

  const stopInterval = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    startInterval();

    const handleVisibility = () => {
      if (document.hidden) {
        stopInterval();
      } else {
        startInterval();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <section className="bg-surface py-20 md:py-24" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-7xl px-5 md:px-12">
        <RevealSection className="mb-14">
          <p className="text-eyebrow mb-5">Testimonials</p>
          <h2 id="testimonials-heading" className="text-h1 text-ink">
            Hear from our curated community
          </h2>
        </RevealSection>

        <div className="relative min-h-[340px]" role="region" aria-roledescription="carousel" aria-live="polite">
          {TESTIMONIALS.map((testimonial, i) => (
            <div
              key={testimonial.name}
              aria-hidden={i !== activeIndex ? "true" : undefined}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                i === activeIndex 
                  ? "opacity-100 translate-y-0 pointer-events-auto" 
                  : "opacity-0 translate-y-8 pointer-events-none"
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-center">
                <div className="space-y-6">
                  <blockquote className="relative">
                    {/* Large decorative opening quote */}
                    <span className="absolute -top-10 -left-8 text-[120px] leading-none text-paper-2 font-serif-italic select-none pointer-events-none opacity-40">
                      &ldquo;
                    </span>
                    <p className="text-h2 text-ink leading-tight relative z-10 md:text-2xl lg:text-3xl">
                      {testimonial.quote}
                    </p>
                    {/* Subtle decorative accent line */}
                    <div className="mt-5 h-[1px] w-16 bg-accent/20" />
                  </blockquote>
                  
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full overflow-hidden border border-line-low shadow-sm bg-paper-2">
                      <img
                        src={`https://i.pravatar.cc/150?img=${AVATAR_MAP[testimonial.name] ?? 1}`}
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div>
                      <p className="text-h1 text-xl md:text-2xl text-ink">{testimonial.name}</p>
                      <p className="text-label-md text-ink-3 uppercase tracking-widest">{testimonial.city}</p>
                    </div>
                  </div>
                </div>
                
                <div className="hidden lg:flex flex-col items-center justify-center p-8 bg-paper rounded-3xl border border-line-low">
                  <div className="text-display text-accent text-5xl mb-1">{testimonial.compatibility}%</div>
                  <p className="text-eyebrow text-ink-3">Compatibility Match</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress indicators */}
        <div className="mt-14 flex justify-center lg:justify-start gap-3">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="group relative h-12 w-12 flex items-center justify-center"
              aria-label={`Go to testimonial ${i + 1}`}
              aria-current={i === activeIndex ? "true" : undefined}
            >
              <div className={`h-1.5 rounded-full transition-all duration-500 ${
                i === activeIndex ? "w-8 bg-accent" : "w-1.5 bg-line-low group-hover:bg-ink-4"
              }`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
