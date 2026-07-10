import { useStore } from "zustand";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Sun, Moon, Monitor, Bell, Star } from "lucide-react";
import {
  uiStore,
  type ThemePreference,
  THEME_OPTIONS,
} from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { SelectableCardGrid } from "@/components/molecules/SelectableCardGrid";

const THEME_ICONS: Record<ThemePreference, React.ReactNode> = {
  light: <Sun aria-hidden="true" className="h-6 w-6" />,
  dark: <Moon aria-hidden="true" className="h-6 w-6" />,
  system: <Monitor aria-hidden="true" className="h-6 w-6" />,
};
const THEME_DESCRIPTIONS: Record<ThemePreference, string> = {
  light: "Clean white canvas with dark text. The app default.",
  dark: "Dark charcoal background with light text.",
  system: "Light or dark based on your device setting. Defaults to light.",
};

const PREVIEW_SWATCHES = [
  { token: "Paper", className: "bg-paper" },
  { token: "Surface", className: "bg-surface" },
  { token: "Accent", className: "bg-accent" },
  { token: "Ink", className: "bg-ink" },
];

const DEFAULT_THEME: ThemePreference = "light";

/** Resolve "system" to the current effective theme so the preview matches
 *  what the user actually sees on screen. */
function useResolvedTheme(theme: ThemePreference): "light" | "dark" {
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return theme === "system" ? systemTheme : theme;
}

export function AppearancePage() {
  const navigate = useNavigate();
  const theme = useStore(uiStore, (s) => s.theme);
  const setTheme = useStore(uiStore, (s) => s.setTheme);
  const resolvedTheme = useResolvedTheme(theme);

  return (
    <div className="flex flex-col gap-5 page-fade">
      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          size="icon"
          aria-label="Back to profile"
          onClick={() => navigate("/profile")}
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h1 className="text-h1">Appearance</h1>
      </div>

      <h2 className="text-label-md text-ink-3 px-1">Theme</h2>
      <SelectableCardGrid<ThemePreference>
        options={THEME_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label + (o.value === DEFAULT_THEME ? " (default)" : ""),
          description: THEME_DESCRIPTIONS[o.value],
        }))}
        iconMap={THEME_ICONS}
        selected={theme}
        onSelect={setTheme}
      />

      <h2 className="text-label-md text-ink-3 mt-2 px-1">Theme Preview</h2>
      <div data-theme={resolvedTheme} className="flex flex-col gap-3">
        <Card className="flex flex-col gap-3 p-4">
          <p className="text-label-md text-ink-3">
            {resolvedTheme === "dark" ? "Dark" : "Light"} mode preview
            {theme === "system" ? " · following system" : ""}
          </p>
          <div className="flex flex-wrap gap-3">
            {PREVIEW_SWATCHES.map((swatch) => (
              <div key={swatch.token} className="flex flex-col items-center gap-1.5">
                <div className="h-12 w-12 rounded-xl border border-line" style={{ background: `var(--color-${swatch.token.toLowerCase()})` }} />
                <span className="text-caption text-ink-3">{swatch.token}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-col gap-3 border-t border-line/60 pt-4">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-surface p-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Bell aria-hidden="true" className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-body-md font-semibold text-ink truncate">Sample notification</p>
                  <p className="text-caption text-ink-3 truncate">Preview of a list row</p>
                </div>
              </div>
              <Button size="compact" variant="primary" leadingIcon={<Star aria-hidden="true" className="h-4 w-4" />}>
                Action
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip variant="info" selected>Active</Chip>
              <Chip variant="info">Info</Chip>
              <Chip variant="info" className="bg-warning-soft text-warning">Warning</Chip>
              <Chip variant="info" className="bg-success-soft text-success">Success</Chip>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
