import { Link } from "react-router";
import { buttonClasses } from "@/components/ui/Button";
import { AppStoreBadges } from "./AppStoreBadges";

export function BottomCTA() {
  return (
    <section
      className="relative py-24 md:py-36 overflow-hidden bg-accent-950"
      aria-labelledby="bottom-cta-heading"
    >
      {/* Accent gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-700 via-accent-900 to-accent-950 opacity-90" />
      
      {/* Animated Mesh Glows */}
      <div className="absolute top-[-50%] left-[-20%] w-[80%] aspect-square rounded-full bg-accent-400/15 blur-[120px] pointer-events-none animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-[-50%] right-[-20%] w-[80%] aspect-square rounded-full bg-accent-600/25 blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />

      {/* Noise pattern overlay */}
      <div className="noise-texture absolute inset-0 pointer-events-none opacity-[0.04]" aria-hidden="true" />

      <div className="mx-auto max-w-5xl px-5 md:px-12 relative z-10 text-center">
        <p className="text-eyebrow mb-6 text-accent-300">Get started</p>
        <h2 id="bottom-cta-heading" className="text-display mb-10 text-white text-4xl md:text-5xl lg:text-6xl max-w-2xl mx-auto leading-tight tracking-tight">
          Ready to find your <span className="text-serif-italic text-accent-300 italic font-normal text-5xl md:text-6xl lg:text-7xl">vibe match</span>?
        </h2>

        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
          <Link
            to="/discover"
            className={buttonClasses("primary", "tall") + " min-w-[220px] !bg-white !text-accent shadow-cta hover:!bg-paper hover:scale-[1.04] active:scale-[0.96] transition-all duration-200"}
          >
            Start matching
          </Link>
          <Link
            to="/login?intent=list-property"
            className="text-label-lg text-white/80 hover:text-white transition-colors duration-300 border-b border-white/30 hover:border-white pb-1 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            List your property
          </Link>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-label-md text-white/50 uppercase tracking-wider text-[10px]">Download the app</p>
          <AppStoreBadges variant="dark" />
        </div>

        <div className="mt-10 pt-10 border-t border-white/15 max-w-2xl mx-auto">
          <p className="text-body-md text-white/70">
            Free to search and match. No WhatsApp groups required.
          </p>
        </div>
      </div>
    </section>
  );
}

