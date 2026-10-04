import { useId } from "react";
import { cn } from "@/components/ui/component-utils";

/**
 * A rubber stamp pressed onto paper: a clay double ring, the words around
 * the rim and a tick in the middle. Decorative; say "verified" in text too.
 */
export function Stamp({ text = "360 FLATMATES · VERIFIED LISTING ·", className }: { text?: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg aria-hidden="true" viewBox="0 0 120 120" className={cn("block size-28 text-clay", className)}>
      <defs>
        <path id={`${id}-rim`} d="M60 60m-43 0a43 43 0 1 1 86 0a43 43 0 1 1-86 0" />
        {/* Uneven ink: a fine noise mask so the stamp reads as pressed, not printed. */}
        <filter id={`${id}-ink`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="4" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.25" result="a" />
          <feComposite in="SourceGraphic" in2="a" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${id}-ink)`} fill="none" stroke="currentColor">
        <circle cx="60" cy="60" r="56" strokeWidth="3" />
        <circle cx="60" cy="60" r="31" strokeWidth="2" />
        <text fill="currentColor" stroke="none" fontSize="10.5" fontWeight="700" letterSpacing="1.6" fontFamily="system-ui, sans-serif">
          <textPath href={`#${id}-rim`} startOffset="0">{text}</textPath>
        </text>
        <path d="M47 61l9 9 17-19" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
