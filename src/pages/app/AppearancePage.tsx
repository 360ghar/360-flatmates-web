import { useStore } from "zustand";
import { useNavigate } from "react-router";
import { ArrowLeft, Sun, Moon, Monitor } from "lucide-react";
import { uiStore, type ThemePreference, THEME_OPTIONS } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SelectableCardGrid } from "@/components/molecules/SelectableCardGrid";

const THEME_ICONS: Record<ThemePreference, React.ReactNode> = {
  light: <Sun aria-hidden="true" className="h-6 w-6" />,
  dark: <Moon aria-hidden="true" className="h-6 w-6" />,
  system: <Monitor aria-hidden="true" className="h-6 w-6" />,
};
const THEME_DESCRIPTIONS: Record<ThemePreference, string> = {
  light: "Warm off-white paper background with dark text",
  dark: "Warm charcoal background with light text",
  system: "Follows your device appearance setting",
};

const LIGHT_SWATCHES = [
  { token: "Paper", className: "bg-paper" },
  { token: "Surface", className: "bg-surface" },
  { token: "Accent", className: "bg-accent" },
  { token: "Ink", className: "bg-ink" }
];

const DARK_SWATCHES = [
  { token: "Paper (dark)", className: "bg-[#1a1612]" },
  { token: "Surface (dark)", className: "bg-[#2a2520]" },
  { token: "Accent", className: "bg-accent" },
  { token: "Ink (dark)", className: "bg-[#f4f3ee]" }
];

export function AppearancePage() {
  const navigate = useNavigate();
  const theme = useStore(uiStore, (s) => s.theme);
  const setTheme = useStore(uiStore, (s) => s.setTheme);

  return (
    <div className="flex flex-col gap-5 page-fade">
      <div className="flex items-center gap-3">
        <Button variant="icon" size="icon" onClick={() => navigate("/profile")}>
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h1 className="text-h1">Appearance</h1>
      </div>

      <SelectableCardGrid<ThemePreference>
        options={THEME_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label,
          description: THEME_DESCRIPTIONS[o.value],
        }))}
        iconMap={THEME_ICONS}
        selected={theme}
        onSelect={setTheme}
      />

      <h2 className="text-label-md text-ink-3 mt-2 px-1">Theme Preview</h2>
      <Card className="p-4">
        <p className="text-label-md text-ink-3 mb-3">Light mode tokens</p>
        <div className="flex flex-wrap gap-3">
          {LIGHT_SWATCHES.map((swatch) => (
            <div key={swatch.token} className="flex flex-col items-center gap-1.5">
              <div
                className={`h-12 w-12 rounded-xl border border-line ${swatch.className}`}
              />
              <span className="text-caption text-ink-3">{swatch.token}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <p className="text-label-md text-ink-3 mb-3">Dark mode tokens</p>
        <div className="flex flex-wrap gap-3">
          {DARK_SWATCHES.map((swatch) => (
            <div key={swatch.token} className="flex flex-col items-center gap-1.5">
              <div
                className={`h-12 w-12 rounded-xl border border-line ${swatch.className}`}
                data-theme-swatch="dark"
              />
              <span className="text-caption text-ink-3">{swatch.token}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
