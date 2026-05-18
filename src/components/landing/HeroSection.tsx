import { Link } from "react-router";
import {
  CheckCircle,
  Heart,
  MapPin,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";

import { buttonClasses } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { HERO_MINI_CARDS } from "./landing-data";

function HeroMiniCards() {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-[420px]">
      {HERO_MINI_CARDS.map((card) => {
        if (card.type === "listing") {
          return (
            <div key={card.type} className="bento-card flex flex-col gap-2 p-4 col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-display text-xl tabular text-ink">{card.price}</p>
                  <h3 className="text-h3 text-ink mt-0.5">{card.title}</h3>
                </div>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent transition-all duration-200 hover:bg-accent hover:text-white"
                  aria-label="Save to favorites"
                >
                  <Heart className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <p className="flex items-center gap-1.5 text-body-md text-ink-3">
                <MapPin className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                {card.location}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {["Private room", "Wifi", "Balcony"].map((tag) => (
                  <span key={tag} className="rounded-full border border-line-low px-2.5 py-0.5 text-label-md text-ink-2">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        }

        if (card.type === "compatibility") {
          return (
            <div key={card.type} className="bento-card flex items-center gap-3 p-4">
              <ProgressRing value={card.score} size="md" label={card.label} />
              <div>
                <p className="text-h3 text-ink">{card.score}%</p>
                <p className="text-label-md text-ink-3">{card.label}</p>
              </div>
            </div>
          );
        }

        if (card.type === "chat") {
          return (
            <div key={card.type} className="bento-card p-4">
              <div className="flex items-start gap-2.5">
                <div className="h-8 w-8 shrink-0 rounded-full bg-accent-soft flex items-center justify-center text-accent">
                  <MessageSquareText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-body-md text-ink">{card.message}</p>
                  <p className="text-caption text-ink-3 mt-1">{card.time}</p>
                </div>
              </div>
            </div>
          );
        }

        if (card.type === "verified") {
          return (
            <div key={card.type} className="bento-card flex items-center gap-3 p-4">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-success-soft flex items-center justify-center text-success">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-h3 text-ink">{card.label}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span className="text-label-md text-ink-3">ID + Background</span>
                </div>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

export function HeroSection() {
  return (
    <section
      className="relative flex min-h-[85dvh] md:min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 py-14 md:px-12 lg:py-24"
      aria-labelledby="hero-heading"
    >
      {/* Atmospheric glow */}
      <div
        className="pointer-events-none absolute inset-0 hero-glow animate-gradient-shift opacity-60"
        aria-hidden="true"
      />
      <div className="noise-texture absolute inset-0 pointer-events-none opacity-20" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="flex flex-col items-center text-center lg:text-left lg:items-start">
          <div className="hero-animate hero-stagger-1">
            <p className="text-eyebrow mb-5">
              Flatmate search, fixed
            </p>
          </div>

          <h1
            id="hero-heading"
            className="hero-animate hero-stagger-2 text-display max-w-3xl text-ink"
          >
            Find your flatmate,{" "}
            <span className="text-serif-italic text-accent italic">not a nightmare</span>
          </h1>

          <div className="hero-animate hero-stagger-3 mt-6 max-w-[48ch] text-body-lg text-ink-3 lg:mx-0 mx-auto">
            6-dimension matching. Verified listings. No more WhatsApp groups from hell.
          </div>

          <div className="hero-animate hero-stagger-4 mt-10 flex flex-col items-center gap-4 sm:flex-row lg:mx-0 mx-auto">
            <Link to="/discover" className={buttonClasses("primary", "tall") + " min-w-[180px] shadow-cta"}>
              Start swiping
            </Link>
            <Link
              to="/discover"
              className="text-label-lg text-ink-2 hover:text-accent transition-colors duration-300 border-b border-ink-4 hover:border-accent pb-1"
            >
              See how it works
            </Link>
          </div>
        </div>

        {/* Bento mini-cards — right side on desktop, below on mobile */}
        <div className="hero-animate hero-stagger-5 mt-14 flex justify-center lg:justify-end lg:-mt-48 lg:ml-auto">
          <HeroMiniCards />
        </div>
      </div>
    </section>
  );
}
