import { Link } from "react-router";
import { buttonClasses } from "@/components/ui/Button";

export function BottomCTA() {
  return (
    <section
      className="relative bg-surface py-24 md:py-36 overflow-hidden border-t border-line-low"
      aria-labelledby="bottom-cta-heading"
    >
      {/* Refined atmospheric glow */}
      <div
        className="pointer-events-none absolute inset-0 hero-glow animate-gradient-shift opacity-30"
        aria-hidden="true"
      />
      
      <div className="mx-auto max-w-5xl px-5 md:px-12 relative z-10 text-center">
        <p className="text-eyebrow mb-6">Get Started</p>
        <h2 id="bottom-cta-heading" className="text-display mb-10 text-ink">
          Your next home, <br className="hidden md:block" />
          <span className="text-serif-italic text-accent italic">meticulously</span> matched.
        </h2>
        
        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
          <Link
            to="/discover"
            className={buttonClasses("primary", "tall") + " min-w-[240px] shadow-cta"}
          >
            Start Your Application
          </Link>
          <Link
            to="/login?intent=list-property"
            className="text-label-lg text-ink-2 hover:text-accent transition-colors duration-300 border-b border-ink-4 hover:border-accent pb-1"
          >
            List a Premium Property
          </Link>
        </div>
        
        <div className="mt-14 pt-10 border-t border-line-low max-w-2xl mx-auto">
          <p className="text-body-md text-ink-3">
            Join <span className="text-ink font-semibold">10,000+</span> professionals who have elevated their shared living experience through our curated network.
          </p>
        </div>
      </div>
    </section>
  );
}
