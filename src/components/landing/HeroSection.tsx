import { Link } from "react-router";
import {
  CheckCircle,
  Heart,
  MapPin,
} from "lucide-react";

import { buttonClasses } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { HERO_MINI_CARDS } from "./landing-data";
import { AppStoreBadges } from "./AppStoreBadges";

function HeroMiniCards() {
  const listingCard = HERO_MINI_CARDS.find((c) => c.type === "listing");
  const compatibilityCard = HERO_MINI_CARDS.find((c) => c.type === "compatibility");
  const chatCard = HERO_MINI_CARDS.find((c) => c.type === "chat");
  const verifiedCard = HERO_MINI_CARDS.find((c) => c.type === "verified");

  const renderCard = (card: typeof HERO_MINI_CARDS[number]) => {
    if (card.type === "listing") {
      return (
        <div className="flex flex-col w-full">
          <div className="relative h-32 w-full overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&fm=webp&fit=crop&q=80"
              alt="Listing room mockup"
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              width={500}
              height={320}
            />
            <button
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-xs text-accent transition-all duration-200 hover:bg-accent hover:text-white shadow-xs"
              aria-label="Save to favorites"
            >
              <Heart className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-success/90 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
              <span>92% Vibe Match</span>
            </div>
          </div>
          <div className="p-4 flex flex-col gap-1 bg-surface">
            <div className="flex items-center justify-between">
              <p className="text-display text-xl tabular text-ink font-semibold">{card.price}</p>
              <span className="text-label-md text-ink-3 uppercase tracking-wider text-[10px]">Koramangala</span>
            </div>
            <h3 className="text-h3 text-ink mt-0.5 line-clamp-1">{card.title}</h3>
            <p className="flex items-center gap-1 text-body-md text-ink-3">
              <MapPin className="h-3.5 w-3.5 text-accent shrink-0" aria-hidden="true" />
              <span className="line-clamp-1 text-[13px]">{card.location}</span>
            </p>
            <div className="flex items-center gap-1.5 mt-1 overflow-x-auto no-scrollbar">
              {["Private room", "Wifi", "AC"].map((tag) => (
                <span key={tag} className="rounded-full border border-line bg-paper px-2 py-0.5 text-label-md text-ink-2 text-[11px] whitespace-nowrap">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (card.type === "compatibility" && card.score && card.label) {
      return (
        <div className="flex items-center gap-3 w-full">
          <div className="shrink-0 bg-success-soft rounded-full p-1 border border-success/10">
            <ProgressRing value={card.score} size="sm" label={card.label} />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <p className="text-h2 text-success leading-none font-bold">{card.score}%</p>
              <p className="text-label-md text-success font-bold uppercase tracking-wider text-[10px]">vibe score</p>
            </div>
            <p className="text-caption text-ink-3 mt-1 leading-normal max-w-[130px] text-[11px]">High alignment in sleep & guest policies.</p>
          </div>
        </div>
      );
    }

    if (card.type === "chat" && card.message) {
      return (
        <div className="flex items-start gap-3 w-full">
          <div className="relative h-10 w-10 shrink-0 rounded-full flex items-center justify-center border border-line bg-accent-soft text-accent font-semibold text-sm mt-0.5" aria-hidden="true">
            RK
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-label-md font-semibold text-ink text-[13px]">Rohan K.</span>
              <span className="text-caption text-ink-3 font-medium text-[10px]">{card.time}</span>
            </div>
            <div className="mt-1 bg-accent-soft/50 rounded-2xl rounded-tl-xs px-3 py-1.5 border border-accent/5">
              <p className="text-body-md text-ink leading-snug text-[13px]">{card.message}</p>
            </div>
          </div>
        </div>
      );
    }

    if (card.type === "verified" && card.label) {
      return (
        <div className="flex items-center gap-3 w-full">
          <div className="relative h-11 w-11 shrink-0 rounded-xl flex items-center justify-center border border-line bg-accent-soft text-accent font-semibold text-sm" aria-hidden="true">
            AM
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success border-2 border-surface" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-label-md text-ink font-semibold text-[13px]">Anya M.</p>
              <div className="inline-flex items-center gap-0.5 bg-success-soft text-success px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase border border-success/15">
                <CheckCircle className="h-2.5 w-2.5" />
                <span>Verified</span>
              </div>
            </div>
            <p className="text-label-md text-ink-3 mt-0.5 text-[11px]">Product Designer • 24</p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Desktop Layered/Floating Mockup (lg viewport) */}
      <div className="relative w-full max-w-[480px] h-[450px] hidden lg:block" aria-hidden="true">
        {/* Decorative background visual elements */}
        <div className="absolute inset-0 rounded-full border border-line-low/50 scale-90 translate-y-4 pointer-events-none" />
        <div className="absolute inset-0 rounded-full border border-line-low/30 scale-75 -translate-y-4 pointer-events-none" />

        {/* 1. Main Listing Card (Center/Bottom layer) */}
        {listingCard && (
          <div className="absolute left-[8%] bottom-[8%] w-[84%] z-10 rotate-1 bento-card overflow-hidden shadow-md hover:rotate-0 hover:scale-[1.02] hover:shadow-lg transition-all duration-350 bg-surface">
            {renderCard(listingCard)}
          </div>
        )}

        {/* 2. Compatibility Score (Top-Left overlay) */}
        {compatibilityCard && (
          <div className="absolute left-[-2%] top-[12%] z-20 -rotate-6 bento-card p-4 shadow-lg hover:rotate-0 hover:scale-[1.05] hover:shadow-xl transition-all duration-350 bg-surface border-line">
            {renderCard(compatibilityCard)}
          </div>
        )}

        {/* 3. Verified Profile Badge (Top-Right overlay) */}
        {verifiedCard && (
          <div className="absolute right-[0%] top-[4%] z-20 rotate-3 bento-card p-4 shadow-lg hover:rotate-0 hover:scale-[1.05] hover:shadow-xl transition-all duration-350 bg-surface border-line">
            {renderCard(verifiedCard)}
          </div>
        )}

        {/* 4. Chat Bubble (Bottom-Right overlay) */}
        {chatCard && (
          <div className="absolute right-[-4%] bottom-[2%] w-[240px] z-20 -rotate-2 bento-card p-4 shadow-lg hover:rotate-0 hover:scale-[1.05] hover:shadow-xl transition-all duration-350 bg-surface border-line">
            {renderCard(chatCard)}
          </div>
        )}
      </div>

      {/* Mobile/Tablet fallback layout (plain grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[540px] lg:hidden">
        {HERO_MINI_CARDS.map((card) => (
          <div key={card.type} className="bento-card bg-surface overflow-hidden flex items-stretch">
            <div className="w-full flex items-center">
              {renderCard(card)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function HeroSection() {
  return (
    <section
      className="relative flex min-h-[85dvh] md:min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 py-16 md:px-12 lg:py-24 bg-paper"
      aria-labelledby="hero-heading"
    >
      {/* Atmospheric glow */}
      <div
        className="pointer-events-none absolute inset-0 hero-glow animate-gradient-shift opacity-60"
        aria-hidden="true"
      />
      <div className="noise-texture absolute inset-0 pointer-events-none opacity-20" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-6 items-center">
          {/* Left text column */}
          <div className="flex flex-col items-center text-center lg:text-left lg:items-start lg:col-span-7">
            <div className="hero-animate hero-stagger-1">
              <p className="text-eyebrow mb-4">
                Flatmate search, fixed
              </p>
            </div>

            <h1
              id="hero-heading"
              className="hero-animate hero-stagger-2 text-display text-4xl sm:text-5xl lg:text-[4rem] text-ink leading-[1.08] tracking-tight"
            >
              Find your flatmate, <br className="hidden sm:inline" />
              <span className="text-serif-italic text-accent italic inline-block leading-[1.1] pb-1 text-5xl sm:text-6xl lg:text-[4.75rem]">not a nightmare</span>
            </h1>

            <div data-hero-summary className="hero-animate hero-stagger-3 mt-6 max-w-[46ch] text-body-lg text-ink-2 lg:mx-0 mx-auto leading-relaxed">
              6-dimension lifestyle matching and 100% verified rooms. Move in with someone whose vibe actually fits yours.
            </div>

            <div className="hero-animate hero-stagger-4 mt-10 flex flex-col items-center gap-4 sm:flex-row lg:mx-0 mx-auto">
              <Link to="/discover" className={buttonClasses("primary", "tall") + " min-w-[200px] shadow-cta"}>
                Start matching
              </Link>
              <a
                href="#how-it-works-heading"
                className="text-label-lg text-ink-2 hover:text-accent transition-colors duration-300 border-b border-ink-4 hover:border-accent pb-1"
              >
                How it works
              </a>
            </div>

            <div className="hero-animate hero-stagger-6 mt-6 flex flex-col items-center gap-2.5 lg:items-start lg:mx-0 mx-auto">
              <p className="text-label-md text-ink-3 dark:text-ink-2 uppercase tracking-wider text-[10px]">Also available on</p>
              <AppStoreBadges variant="light" />
            </div>
          </div>

          {/* Right bento/visual showcase column */}
          <div className="hero-animate hero-stagger-5 lg:col-span-5 flex justify-center lg:justify-end">
            <HeroMiniCards />
          </div>
        </div>
      </div>
    </section>
  );
}

