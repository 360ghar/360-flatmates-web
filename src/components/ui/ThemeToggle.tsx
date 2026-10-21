import { useStore } from "zustand";
import { Monitor, Moon, Sun } from "lucide-react";
import { uiStore, type ThemePreference, THEME_OPTIONS } from "@/lib/stores/ui-store";
import { cn, focusRing, interactiveMotion } from "@/components/ui/component-utils";

const THEME_ICONS: Record<ThemePreference, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

export interface ThemeToggleProps {
  /** Kept for call-site compatibility; the control is always one 44 px button. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * One icon button that cycles Light → Dark → System. The labelled choice
 * lives on /settings/appearance.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useStore(uiStore, (s) => s.theme);
  const setTheme = useStore(uiStore, (s) => s.setTheme);
  const index = THEME_OPTIONS.findIndex((o) => o.value === theme);
  const current = THEME_OPTIONS[index] ?? THEME_OPTIONS[0];
  const next = THEME_OPTIONS[(index + 1) % THEME_OPTIONS.length];
  const Icon = THEME_ICONS[current.value];

  return (
    <button
      type="button"
      onClick={() => setTheme(next.value)}
      aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
      title={`Theme: ${current.label}`}
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-cut-md text-ink-2 hover:bg-surface-soft hover:text-ink",
        interactiveMotion,
        focusRing,
        className
      )}
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}
