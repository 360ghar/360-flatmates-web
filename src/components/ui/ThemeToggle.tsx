import { useStore } from "zustand";
import { motion } from "framer-motion";
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
  const reducedMotion = useStore(uiStore, (s) => s.reducedMotion);

  const btnSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-[9px] bg-paper-2 p-1",
        className
      )}
      role="radiogroup"
      aria-label="Theme preference"
    >
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
              "relative inline-flex items-center justify-center rounded-[7px] transition-colors duration-200",
              btnSize,
              focusRing,
              isActive
                ? "text-accent font-semibold"
                : "text-ink-3 hover:bg-paper-3/40 hover:text-ink"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="activeThemeBubble"
                className="absolute inset-0 rounded-[7px] bg-accent-soft"
                transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icon aria-hidden="true" className={cn("relative z-10", iconSize)} />
          </button>
        );
      })}
    </div>
  );
}
