import { Link } from "react-router";
import { buttonClasses } from "@/components/ui/Button";

export function BottomCTA() {
  return (
    <section
      className="relative py-24 md:py-36 overflow-hidden"
      aria-labelledby="bottom-cta-heading"
    >
      {/* Accent gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent to-accent-700" />
      {/* Subtle pattern overlay */}
      <div className="noise-texture absolute inset-0 pointer-events-none opacity-10" aria-hidden="true" />

      <div className="mx-auto max-w-5xl px-5 md:px-12 relative z-10 text-center">
        <p className="text-eyebrow mb-6 text-white/70">Get started</p>
        <h2 id="bottom-cta-heading" className="text-display mb-10 text-white">
          Ready to find your person?
        </h2>

        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
          <Link
            to="/discover"
            className={buttonClasses("primary", "tall") + " min-w-[220px] !bg-white !text-accent shadow-cta hover:!bg-paper"}
          >
            Get started, it's free
          </Link>
          <Link
            to="/login?intent=list-property"
            className="text-label-lg text-white/80 hover:text-white transition-colors duration-300 border-b border-white/30 hover:border-white pb-1"
          >
            List your property
          </Link>
        </div>

        <div className="mt-14 pt-10 border-t border-white/20 max-w-2xl mx-auto">
          <p className="text-body-md text-white/70">
            Join <span className="text-white font-semibold">10,000+</span> people who stopped settling for random flatmates.
          </p>
        </div>
      </div>
    </section>
  );
}
