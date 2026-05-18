import { Link } from "react-router";
import {
  BedDouble,
  Heart,
  MapPin,
  Moon,
  SprayCan,
  Utensils,
  Users,
  Wine,
} from "lucide-react";

import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useScrollProgress } from "@/hooks/useScrollProgress";

const DIMENSIONS = [
  { label: "Sleep", icon: Moon, tint: "bg-purple-soft/30 text-purple-mid" },
  { label: "Clean", icon: SprayCan, tint: "bg-blue-soft/30 text-blue-mid" },
  { label: "Food", icon: Utensils, tint: "bg-green-soft/30 text-green-mid" },
  { label: "Guests", icon: Users, tint: "bg-orange-soft/30 text-orange-mid" },
  { label: "Work", icon: BedDouble, tint: "bg-teal-soft/30 text-teal-mid" },
  { label: "Lifestyle", icon: Wine, tint: "bg-pink-soft/30 text-pink-mid" },
];

function ListingMockup() {
  return (
    <div className="relative z-10 w-full max-w-[440px] perspective-1000">
      <div className="animate-float-subtle transition-transform duration-700 hover:rotate-y-[-4deg] hover:rotate-x-[2deg]">
        <Card variant="elevated" className="overflow-hidden border-none shadow-lg">
          <div className="relative h-64 w-full overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80"
              alt="A warm shared living room with natural light"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <button className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white transition-all duration-300 hover:bg-white/20 hover:scale-110 active:scale-95" aria-label="Save to favorites">
              <Heart className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
          <div className="p-6 bg-surface">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-display text-2xl tabular text-ink">
                  &#8377;18,000
                  <span className="text-body-md font-medium text-ink-3">/mo</span>
                </p>
                <h3 className="mt-2 text-h3 text-ink">Sunlit room in Koramangala</h3>
              </div>
              <ProgressRing value={86} size="md" label="Match" />
            </div>
            <p className="mt-3 flex items-center gap-2 text-body-md text-ink-3">
              <MapPin className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              Koramangala 4th Block, Bangalore
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Private room", "Balcony", "Wifi"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-line-low px-3 py-1 text-label-md text-ink-2"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-6 gap-2">
              {DIMENSIONS.map((dim) => {
                const DimIcon = dim.icon;
                return (
                  <div
                    key={dim.label}
                    className={`flex flex-col items-center justify-center rounded-lg p-2 transition-all duration-300 hover:bg-paper-2 ${dim.tint}`}
                    title={dim.label}
                  >
                    <DimIcon className="h-4 w-4" />
                  </div>
                );
              })}
            </div>
            <div className="mt-8">
              <Link
                to="/discover"
                className={buttonClasses("primary", "default") + " w-full justify-center shadow-cta hover:shadow-hover"}
              >
                View Details
              </Link>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Decorative elements for the luxury feel */}
      <div className="absolute -bottom-6 -left-6 -z-10 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute -right-12 -top-12 -z-10 h-48 w-48 rounded-full bg-accent/5 blur-3xl" />
    </div>
  );
}

function WordReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`hero-animate inline-block ${className ?? ""}`}>
      {children}
    </span>
  );
}

export function HeroSection() {
  const { ref: parallaxRef } = useScrollProgress<HTMLElement>();

  return (
    <section
      ref={parallaxRef}
      className="relative flex min-h-[85dvh] md:min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 py-14 md:px-12 lg:py-24"
      aria-labelledby="hero-heading"
      style={{ ["--scroll-progress" as string]: 0 }}
    >
      {/* Refined atmospheric effects */}
      <div
        className="pointer-events-none absolute inset-0 hero-glow animate-gradient-shift opacity-60"
        aria-hidden="true"
      />
      
      {/* Subtle noise texture */}
      <div className="noise-texture absolute inset-0 pointer-events-none opacity-20" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="flex flex-col items-center text-center">
          <WordReveal className="hero-stagger-1">
            <p className="text-eyebrow mb-5">
              Exclusive flatmate matching
            </p>
          </WordReveal>

          <h1
            id="hero-heading"
            className="text-display max-w-4xl text-ink"
          >
            <WordReveal className="hero-stagger-2">Find Your{" "}</WordReveal>
            <WordReveal className="hero-stagger-3">
              <span className="text-serif-italic text-accent mx-1.5 italic">Flatmate</span>,{" "}
            </WordReveal>
            <br className="hidden md:block" />
            <WordReveal className="hero-stagger-3">Find Your{" "}</WordReveal>
            <WordReveal className="hero-stagger-4">
              <span className="text-serif-italic text-accent mx-1.5 italic">Vibe</span>
            </WordReveal>
          </h1>

          <WordReveal className="hero-stagger-4">
            <p className="mt-6 max-w-[50ch] text-body-lg text-ink-3">
              Curated homes. Verified members. A sophisticated approach to shared living across India&apos;s premier neighborhoods.
            </p>
          </WordReveal>

          <WordReveal className="hero-stagger-5">
            <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:gap-4">
              <Link to="/discover" className={buttonClasses("primary", "tall") + " min-w-[200px] shadow-cta"}>
                Begin Your Search
              </Link>
              <Link
                to="/discover"
                className="text-label-lg text-ink-2 hover:text-accent transition-colors duration-300 border-b border-ink-4 hover:border-accent pb-1"
              >
                Explore Curated Listings
              </Link>
            </div>
          </WordReveal>
        </div>

        <div className="mt-14 flex flex-col items-center lg:mt-20 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="hero-animate hero-stagger-5 w-full lg:w-1/2">
            <div
              className="flex justify-center lg:justify-start"
              style={{
                transform: "translateY(calc(var(--scroll-progress, 0) * -60px))",
              }}
            >
              <ListingMockup />
            </div>
          </div>

          <div className="hero-animate hero-stagger-5 mt-12 w-full max-w-md lg:mt-0 lg:text-left">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {[47, 12, 44, 33].map((imgId, i) => (
                    <div
                      key={i}
                      className="h-12 w-12 overflow-hidden rounded-full border-2 border-surface shadow-sm transition-transform hover:scale-110"
                      style={{ zIndex: 4 - i }}
                    >
                      <img
                        src={`https://i.pravatar.cc/150?img=${imgId}`}
                        alt="Verified Member"
                        width={48}
                        height={48}
                        className="object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-h3 text-ink">2,400+ Members</p>
                  <p className="text-body-md text-ink-3">Joined this month in prime locations</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-ink-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <p className="text-body-md">Verified professional background checks</p>
                </div>
                <div className="flex items-center gap-3 text-ink-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <p className="text-body-md">AI-driven lifestyle compatibility scoring</p>
                </div>
                <div className="flex items-center gap-3 text-ink-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <p className="text-body-md">Premium listings in gated communities</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refined Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2" aria-hidden="true">
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-[1px] bg-gradient-to-b from-ink-4 to-transparent animate-float-subtle" />
          <span className="text-eyebrow text-ink-3">Scroll</span>
        </div>
      </div>
    </section>
  );
}
