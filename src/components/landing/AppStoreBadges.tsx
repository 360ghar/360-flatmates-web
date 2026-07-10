import { useStore } from "zustand";
import { useEffect, useState } from "react";
import { uiStore } from "@/lib/stores/ui-store";
import { APP_STORE_URL, PLAY_STORE_URL } from "./landing-data";

interface AppStoreBadgesProps {
  variant?: "light" | "dark";
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.46 2.208 3.09 3.792 3.029 1.52-.065 2.09-.987 3.925-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
    </svg>
  );
}

function GooglePlayLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.485 1.485 0 0 0-.227.795v21.44a1.49 1.49 0 0 0 .227.852l11.268-11.19L1.337.924zm11.625 12.376l1.696-1.688L3.334 23.15c.276.177.609.22.918.071l12.214-6.904-3.504-3.017zM3.334.822l11.324 11.579 3.504-3.017L6.252.751A1.49 1.49 0 0 0 3.334.822z" />
    </svg>
  );
}

/** Mirrors the pattern in MapView.tsx — reads the app's theme store and the
 *  OS media query so "System" mode works correctly too. */
function useIsDark() {
  const theme = useStore(uiStore, (s) => s.theme);
  const [systemDark, setSystemDark] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return theme === "dark" || (theme === "system" && systemDark);
}

const BADGES = [
  {
    href: APP_STORE_URL,
    label: "Download 360 Flatmates on the App Store",
    Icon: AppleLogo,
    eyebrow: "Download on the",
    name: "App Store",
  },
  {
    href: PLAY_STORE_URL,
    label: "Download 360 Flatmates on Google Play",
    Icon: GooglePlayLogo,
    eyebrow: "Get it on",
    name: "Google Play",
  },
] as const;

export function AppStoreBadges({ variant = "light" }: AppStoreBadgesProps) {
  const isDark = useIsDark();

  const base =
    "inline-flex items-center gap-2.5 rounded-[8px] px-4 py-2.5 transition-all duration-200 hover:-translate-y-px active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2";

  // "dark" variant: always on a dark section background (e.g. BottomCTA) — white glass pill.
  // Does not need to adapt to app theme; it lives on a permanently dark surface.
  const darkVariantProps = {
    className:
      base +
      " bg-white/15 text-white border border-white/20 hover:bg-white/25 backdrop-blur-sm focus-visible:outline-white",
    style: undefined as React.CSSProperties | undefined,
  };

  // "light" variant: adapts to the current app theme using inline styles so the
  // result is immune to CSS-cascade ordering (Tailwind v4 dark: uses OS media
  // query, not [data-theme="dark"], so class-based dark: utilities don't fire
  // when OS ≠ app theme).
  //   Light mode → dark charcoal pill (#222222 bg, #ffffff text)
  //   Dark mode  → white pill         (#ffffff bg, #222222 text)
  const lightVariantProps = isDark
    ? {
        // Dark mode: white pill → use dark outline so it's visible against white bg
        className: base + " focus-visible:outline-[#222222]",
        style: {
          backgroundColor: "#ffffff",
          color: "#222222",
          border: "1px solid rgba(0,0,0,0.10)",
        } satisfies React.CSSProperties,
      }
    : {
        // Light mode: dark pill → use white outline so it's visible against dark bg
        className: base + " focus-visible:outline-white",
        style: {
          backgroundColor: "#222222",
          color: "#ffffff",
          border: "1px solid rgba(34,34,34,0.10)",
        } satisfies React.CSSProperties,
      };

  const props = variant === "dark" ? darkVariantProps : lightVariantProps;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {BADGES.map(({ href, label, Icon, eyebrow, name }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={props.className}
          style={props.style}
          aria-label={label}
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="flex flex-col text-left leading-none">
            <span className="text-[9px] font-medium opacity-75 tracking-wide uppercase mb-0.5">
              {eyebrow}
            </span>
            <span className="text-[13px] font-semibold tracking-tight">
              {name}
            </span>
          </span>
        </a>
      ))}
    </div>
  );
}
