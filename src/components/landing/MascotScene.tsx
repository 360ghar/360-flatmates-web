import { CalendarCheck, HeartHandshake, Home, ShieldCheck } from "lucide-react";

const HERO_ASSET = "/brand/flatmate-hero-companion.webp";

export function MascotScene() {
  return (
    <div
      className={
        "relative min-h-[280px] h-[min(420px,calc(100dvh-16rem))] overflow-hidden " +
        "rounded-[var(--radius-promo)] border border-line-low bg-lavender shadow-sm " +
        "lg:h-[min(520px,calc(100dvh-12rem))] lg:min-h-[360px]"
      }
    >
      <div className="absolute inset-0 map-grid-bg opacity-35" aria-hidden="true" />
      <div className="absolute left-6 top-6 rounded-2xl border border-line bg-surface px-4 py-3 shadow-sm">
        <p className="text-label-md text-ink-3">Vibe match</p>
        <p className="mt-1 text-display text-3xl text-ink">92%</p>
      </div>
      <div className="absolute right-5 top-20 hidden max-w-[210px] rounded-2xl border border-line bg-surface px-4 py-3 shadow-sm sm:block">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-accent" aria-hidden="true" />
          <p className="text-h4 text-ink">Visit booked</p>
        </div>
        <p className="mt-1 text-caption text-ink-3">Saturday, 11:30 AM</p>
      </div>
      <img
        src={HERO_ASSET}
        alt="Two flatmates exchanging keys beside moving boxes"
        className="absolute bottom-0 left-1/2 h-[80%] max-w-none -translate-x-1/2 object-contain sm:h-[86%] lg:h-[90%]"
        width={1568}
        height={1003}
        loading="eager"
        decoding="async"
      />
      <div className="absolute bottom-5 left-5 right-5 grid grid-cols-3 gap-2">
        {[
          { label: "Verified", Icon: ShieldCheck },
          { label: "Matched", Icon: HeartHandshake },
          { label: "Move-in", Icon: Home },
        ].map(({ label, Icon }) => (
          <div
            key={label}
            className="flex items-center justify-center gap-1.5 rounded-full border border-white/70 bg-surface/88 px-2 py-2 text-caption font-semibold text-ink shadow-xs backdrop-blur-sm"
          >
            <Icon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
