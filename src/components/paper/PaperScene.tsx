import { useId, useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/components/ui/component-utils";
import { paperArt, type PaperArtName } from "./art";

/** Shared drop shadow for one cut-paper layer: tight, down-right (DESIGN.md §4). */
function PaperShadowFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="1" dy="2" stdDeviation="0.75" style={{ floodColor: "var(--scene-shadow)" }} />
    </filter>
  );
}

function ArtPath({ name, fill, filter }: { name: PaperArtName; fill: string; filter?: string }) {
  const shape = paperArt[name];
  return (
    <path
      d={shape.d}
      fill={fill}
      fillRule={shape.evenOdd ? "evenodd" : "nonzero"}
      filter={filter ? `url(#${filter})` : undefined}
    />
  );
}

/* Back-to-front layers of the hero scene with their parallax travel (px) as
   the scene scrolls out. Far layers travel further, so they read as distant. */
const HERO_LAYERS: ReadonlyArray<{ name: PaperArtName; fill: string; travel: number }> = [
  { name: "sun", fill: "var(--color-scene-sun)", travel: 70 },
  { name: "cloudA", fill: "var(--color-scene-cloud)", travel: 56 },
  { name: "cloudB", fill: "var(--color-scene-cloud)", travel: 60 },
  { name: "hillsFar", fill: "var(--color-scene-hill-far)", travel: 40 },
  { name: "townFar", fill: "var(--color-scene-town-far)", travel: 30 },
  { name: "hillsNear", fill: "var(--color-scene-hill-near)", travel: 18 },
  { name: "townWindows", fill: "var(--color-scene-window)", travel: 8 },
  { name: "townNear", fill: "var(--color-scene-town)", travel: 8 },
  { name: "tree", fill: "var(--color-scene-tree)", travel: 4 }
];

function HeroLayer({
  name,
  fill,
  travel,
  progress,
  still
}: {
  name: PaperArtName;
  fill: string;
  travel: number;
  progress: MotionValue<number>;
  still: boolean;
}) {
  const y = useTransform(progress, [0, 1], [0, still ? 0 : travel]);
  const filterId = useId().replace(/:/g, "");
  const shape = paperArt[name];
  return (
    <motion.svg
      aria-hidden="true"
      viewBox={`0 0 ${shape.w} ${shape.h}`}
      preserveAspectRatio="xMidYMax slice"
      // Bottom-anchored band at the art's own aspect (0.3) on wide screens;
      // never shorter than the container allows on phones, where it crops in.
      className="absolute inset-x-0 bottom-0 h-[min(85%,max(30vw,300px))] w-full will-change-transform"
      style={{ y }}
    >
      <defs>
        <PaperShadowFilter id={filterId} />
      </defs>
      <ArtPath name={name} fill={fill} filter={name === "townWindows" ? undefined : filterId} />
    </motion.svg>
  );
}

/**
 * The signature cut-paper neighbourhood (DESIGN.md §6). Layers sit at
 * opacity 1 from the first paint; scrolling only shifts them (parallax),
 * and reduced motion keeps them still. A torn paper edge closes the bottom.
 */
export function PaperScene({
  className,
  children,
  edgeClassName = "bg-paper",
  torn = true
}: {
  className?: string;
  children?: ReactNode;
  /** Colour of the torn paper that closes the scene: match what sits below. */
  edgeClassName?: string;
  /** Close the bottom with a torn paper strip (off when the scene ends the page). */
  torn?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  return (
    <div
      ref={ref}
      className={cn("relative isolate overflow-hidden bg-sky", className)}
      data-testid="paper-scene"
    >
      {HERO_LAYERS.map((layer) => (
        <HeroLayer key={layer.name} {...layer} progress={scrollYProgress} still={reduceMotion} />
      ))}
      {children ? <div className="relative z-10 h-full">{children}</div> : null}
      {torn ? <div
        aria-hidden="true"
        className={cn("paper-edge-torn-top paper-grain absolute inset-x-0 bottom-0 z-10 h-[calc(var(--torn-depth)+2px)]", edgeClassName)}
      /> : null}
    </div>
  );
}

export type PaperProp = "house" | "chat" | "heart" | "magnifier" | "bell" | "rainCloud";

const PROP_FILL: Record<PaperProp, string> = {
  house: "var(--color-clay)",
  chat: "var(--color-pine)",
  heart: "var(--color-clay)",
  magnifier: "var(--color-pine)",
  bell: "var(--color-marigold)",
  rainCloud: "var(--color-ink-3)"
};

/**
 * Compact scene for empty, error and offline states: small hills, the sun
 * and one prop standing on the near hill. Decorative (aria-hidden).
 */
export function PaperMiniScene({ prop, className }: { prop: PaperProp; className?: string }) {
  const filterId = useId().replace(/:/g, "");
  const showSun = prop !== "rainCloud";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 320 200"
      className={cn("h-auto w-full max-w-[260px]", className)}
      data-testid="paper-mini-scene"
      data-prop={prop}
    >
      <defs>
        <PaperShadowFilter id={filterId} />
        <clipPath id={`${filterId}-clip`}>
          <rect width="320" height="200" rx="18" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${filterId}-clip)`}>
        <rect width="320" height="200" fill="var(--color-sky)" />
        {showSun ? <ArtPath name="miniSun" fill="var(--color-scene-sun)" filter={filterId} /> : null}
        <ArtPath name="miniHillsFar" fill="var(--color-scene-hill-far)" filter={filterId} />
        <ArtPath name="miniHillsNear" fill="var(--color-scene-hill-near)" filter={filterId} />
      </g>
      {/* The prop is 160 x 160; scaled to 96 and centred on the near hill. */}
      <g transform="translate(112 58) scale(0.6)">
        <ArtPath name={prop} fill={PROP_FILL[prop]} filter={filterId} />
      </g>
    </svg>
  );
}
