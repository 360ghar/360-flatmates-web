import { useEffect, useState } from "react";
import { X, Smartphone, ArrowRight } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "../ui/Button";
import { cn } from "../ui/component-utils";
import { PWAInstallInstructionsModal } from "../organisms/PWAInstallInstructionsModal";

const STORAGE_KEY = "pwa-banner-dismissed-until";
const DISMISS_DAYS = 7;
const PAGEVIEW_KEY = "pwa-banner-pageviews";

interface PWAInstallBannerProps {
  className?: string;
  /**
   * Show the banner only for the first N pageviews in this session.
   * Set to 0 to disable pageview gating.
   */
  pageviewLimit?: number;
  /**
   * Render a smaller, single-row variant (suitable for public-facing surfaces
   * where the full-width app-shell banner would feel too heavy).
   */
  variant?: "default" | "compact";
}

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  const ts = Number.parseInt(raw, 10);
  if (!Number.isFinite(ts)) return false;
  return Date.now() < ts;
}

function recordDismiss() {
  if (typeof window === "undefined") return;
  const expires = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(expires));
  } catch {
    // localStorage may be unavailable (private mode); fail open
  }
}

function getPageviewCount(): number {
  if (typeof window === "undefined") return 0;
  return Number.parseInt(window.sessionStorage.getItem(PAGEVIEW_KEY) ?? "0", 10) || 0;
}

function incrementPageview() {
  if (typeof window === "undefined") return;
  const next = getPageviewCount() + 1;
  try {
    window.sessionStorage.setItem(PAGEVIEW_KEY, String(next));
  } catch {
    // sessionStorage may be unavailable; fail open
  }
}

export function PWAInstallBanner({ className, pageviewLimit = 0, variant = "default" }: PWAInstallBannerProps) {
  const { isInstallable, isInstalled, isIOS, isIPad, isInApp, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(isDismissed);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (pageviewLimit > 0) {
      incrementPageview();
    }
  }, [pageviewLimit]);

  const handleDismiss = () => {
    recordDismiss();
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (isInstallable) {
      await installApp();
    } else if (isIOS || isIPad) {
      setShowInstructions(true);
    }
  };

  const eligibleByPageview =
    pageviewLimit <= 0 || getPageviewCount() <= pageviewLimit;
  const visible =
    !isInstalled &&
    (isInstallable || isIOS || isIPad) &&
    !isInApp &&
    !dismissed &&
    eligibleByPageview;

  if (!visible) return null;

  if (variant === "compact") {
    return (
      <>
        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl border border-accent/25 bg-accent-soft px-4 py-3 shadow-sm",
            className
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
              <Smartphone className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-body-md font-semibold text-ink">Get the 360 Flatmates app</p>
              <p className="truncate text-caption text-ink-2">Faster, full-screen matching experience.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="compact" variant="primary" onClick={handleInstall} className="shrink-0">
              Install <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
            <button
              type="button"
              aria-label="Dismiss banner"
              onClick={handleDismiss}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-paper-3 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <PWAInstallInstructionsModal open={showInstructions} onClose={() => setShowInstructions(false)} />
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          "relative flex flex-col items-start justify-between gap-4 rounded-2xl border border-accent/25 bg-accent-soft p-4 shadow-sm sm:flex-row sm:items-center",
          className
        )}
      >
        <button
          aria-label="Dismiss banner"
          onClick={handleDismiss}
          className="absolute right-3 top-3 text-ink-3 hover:text-ink transition-colors duration-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-sm">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-body-md font-semibold text-ink">Get the 360 Flatmates App</h3>
            <p className="mt-0.5 text-caption text-ink-2">
              Install the app on your screen for a faster, full-screen matching experience.
            </p>
          </div>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
          <Button size="compact" variant="primary" onClick={handleInstall} className="w-full sm:w-auto">
            Install <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <PWAInstallInstructionsModal open={showInstructions} onClose={() => setShowInstructions(false)} />
    </>
  );
}
