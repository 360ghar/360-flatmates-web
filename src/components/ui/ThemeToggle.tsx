import { useStore } from "zustand";
import { Sun, Moon, Monitor } from "lucide-react";
import {
  uiStore,
  type ThemePreference,
  THEME_OPTIONS,
} from "@/lib/stores/ui-store";
import { cn, focusRing } from "@/components/ui/component-utils";

const THEME_ICONS: Record<ThemePreference, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export interface ThemeToggleProps {
  /** "sm" for compact top-bar use (32px), "md" for standalone sections (40px) */
  size?: "sm" | "md";
  className?: string;
}

export function ThemeToggle({ size = "md", className }: ThemeToggleProps) {
  const theme = useStore(uiStore, (s) => s.theme);
  const setTheme = useStore(uiStore, (s) => s.setTheme);

  const btnSize = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const btnPx = size === "sm" ? 36 : 44;
  const gapPx = 4;
  const padPx = 4;
  const activeIndex = THEME_OPTIONS.findIndex((o) => o.value === theme);
  const indicatorLeft = padPx + activeIndex * (btnPx + gapPx);

  return (
    <div
      className={cn(
        "relative flex items-center gap-1 rounded-cut-md bg-paper-2 p-1",
        className
      )}
      role="radiogroup"
      aria-label="Theme preference"
    >
      {/* Active choice = a paper tab one layer up, sliding between options. */}
      <span
        aria-hidden="true"
        className="absolute rounded-cut-md bg-surface shadow-sm transition-[left] duration-200 ease-[var(--ease-paper-out)] motion-reduce:transition-none"
        style={{
          left: `${indicatorLeft}px`,
          top: `${padPx}px`,
          width: `${btnPx}px`,
          height: `calc(100% - ${padPx * 2}px)`,
        }}
      />
      {THEME_OPTIONS.map((option) => {
        const Icon = THEME_ICONS[option.value];
        const isActive = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={option.label}
            onClick={() => setTheme(option.value)}
            className={cn(
              "relative z-10 inline-flex items-center justify-center rounded-cut-md transition-colors duration-200",
              btnSize,
              focusRing,
              isActive
                ? "text-accent font-semibold"
                : "text-ink-2 hover:text-ink"
            )}
          >
            <Icon aria-hidden="true" className={cn(iconSize)} />
          </button>
        );
      })}
    </div>
  );
}
