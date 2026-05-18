import { lazy, Suspense } from "react";
import { HeroSection } from "./HeroSection";

const StatsStrip = lazy(() =>
  import("./StatsStrip").then((m) => ({ default: m.StatsStrip }))
);

const TestimonialsSection = lazy(() =>
  import("./TestimonialsSection").then((m) => ({ default: m.TestimonialsSection }))
);

function StatsStripFallback() {
  return (
    <section className="relative bg-surface py-16 md:py-20 border-y border-line-low">
      <div className="mx-auto max-w-7xl px-5 md:px-12 text-center">
        <p className="text-eyebrow mb-4">By the numbers</p>
        <h2 className="text-h1 text-ink">The proof is in the platform</h2>
      </div>
    </section>
  );
}

function TestimonialsFallback() {
  return (
    <section className="bg-surface py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-5 md:px-12">
        <p className="text-eyebrow mb-5">Don't take our word for it</p>
        <h2 className="text-h1 text-ink">Real people, real flatmates</h2>
      </div>
    </section>
  );
}

export function LandingClientSections() {
  return (
    <>
      <HeroSection />
      <Suspense fallback={<StatsStripFallback />}>
        <StatsStrip />
      </Suspense>
      <Suspense fallback={<TestimonialsFallback />}>
        <TestimonialsSection />
      </Suspense>
    </>
  );
}
