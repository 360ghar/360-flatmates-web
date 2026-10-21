import { useStore } from "zustand";
import { Check } from "lucide-react";
import { RadioGroup } from "radix-ui";
import { PaperMiniScene } from "@/components/paper/PaperScene";
import { Page, PageHeader } from "@/components/ui/Layout";
import { cn, focusRing } from "@/components/ui/component-utils";
import { uiStore, type ThemePreference, THEME_OPTIONS } from "@/lib/stores/ui-store";

const DESCRIPTIONS: Record<ThemePreference, string> = {
  light: "Daylight paper. The default.",
  dark: "Night paper, easier on the eyes after dark.",
  system: "Follows your device setting."
};

/** The neighbourhood in one theme, so each option shows what you get. */
function ThemeWindow({ theme }: { theme: "light" | "dark" }) {
  return (
    <div data-theme={theme} className="h-full bg-sky">
      <PaperMiniScene prop="house" className="h-full w-full max-w-none" />
    </div>
  );
}

export function AppearancePage() {
  const theme = useStore(uiStore, (s) => s.theme);
  const setTheme = useStore(uiStore, (s) => s.setTheme);

  return (
    <Page width="default">
      <PageHeader title="Appearance" description="Choose how 360 Flatmates looks on this device." />
      <RadioGroup.Root
        value={theme}
        onValueChange={(value) => setTheme(value as ThemePreference)}
        aria-label="Theme"
        className="grid gap-4 sm:grid-cols-3"
      >
        {THEME_OPTIONS.map((option) => {
          const selected = option.value === theme;
          return (
            <RadioGroup.Item
              key={option.value}
              value={option.value}
              className={cn(
                "paper-grain flex flex-col overflow-hidden rounded-hand bg-surface text-left shadow-sm transition-[box-shadow,background-color] duration-200",
                focusRing,
                selected ? "bg-paper-3 shadow-md ring-2 ring-clay" : "hover:bg-paper-3"
              )}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                {option.value === "system" ? (
                  <div className="grid h-full grid-cols-2">
                    <div className="overflow-hidden"><div className="h-full w-[200%]"><ThemeWindow theme="light" /></div></div>
                    <div className="overflow-hidden"><div className="-ml-[100%] h-full w-[200%]"><ThemeWindow theme="dark" /></div></div>
                  </div>
                ) : (
                  <ThemeWindow theme={option.value} />
                )}
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <span className="min-w-0">
                  <span className="block text-body-lg font-semibold text-ink">{option.label}</span>
                  <span className="mt-0.5 block text-caption text-ink-3">{DESCRIPTIONS[option.value]}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2", selected ? "border-clay bg-clay text-on-clay" : "border-ink-4")}
                >
                  {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
                </span>
              </div>
            </RadioGroup.Item>
          );
        })}
      </RadioGroup.Root>
    </Page>
  );
}
