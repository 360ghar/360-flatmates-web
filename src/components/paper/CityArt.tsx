import { useId } from "react";
import { cn } from "@/components/ui/component-utils";
import { paperArt, type PaperArtName } from "./art";

export type CityArtName = "bangalore" | "gurugram";

const CITY_LAYERS: Record<CityArtName, ReadonlyArray<{ name: PaperArtName; fill: string; shadow?: boolean }>> = {
  gurugram: [
    { name: "cardSun", fill: "var(--color-scene-sun)", shadow: true },
    { name: "cardHillsFar", fill: "var(--color-scene-hill-far)", shadow: true },
    { name: "gurugramWindows", fill: "var(--color-scene-window)" },
    { name: "gurugramTowers", fill: "var(--color-scene-town-far)", shadow: true },
    { name: "cardHillsNear", fill: "var(--color-scene-hill-near)", shadow: true }
  ],
  bangalore: [
    { name: "cardSun", fill: "var(--color-scene-sun)", shadow: true },
    { name: "cardHillsFar", fill: "var(--color-scene-hill-far)", shadow: true },
    { name: "bangaloreWindows", fill: "var(--color-scene-window)" },
    { name: "bangaloreTown", fill: "var(--color-scene-town)", shadow: true },
    { name: "bangaloreTree", fill: "var(--color-scene-tree)", shadow: true }
  ]
};

/**
 * A city in cut paper (480 x 200): Gurugram's glass towers, Bangalore's
 * rooftops under a peepal. Used on postcards and city page headers.
 */
export function CityArt({ city, className }: { city: CityArtName; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg aria-hidden="true" viewBox="0 0 480 200" preserveAspectRatio="xMidYMax slice" className={cn("block h-auto w-full", className)}>
      <defs>
        <filter id={`${id}-s`} x="-5%" y="-5%" width="110%" height="115%">
          <feDropShadow dx="1" dy="2" stdDeviation="0.75" style={{ floodColor: "var(--scene-shadow)" }} />
        </filter>
      </defs>
      <rect width="480" height="200" fill="var(--color-sky)" />
      {CITY_LAYERS[city].map(({ name, fill, shadow }) => {
        const shape = paperArt[name];
        return (
          <path
            key={name}
            d={shape.d}
            fill={fill}
            fillRule={shape.evenOdd ? "evenodd" : "nonzero"}
            filter={shadow ? `url(#${id}-s)` : undefined}
            className={name === "cardSun" ? "scene-day-only" : undefined}
          />
        );
      })}
    </svg>
  );
}
