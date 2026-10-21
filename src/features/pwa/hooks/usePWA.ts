import { useEffect, useState } from "react";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

function isIPadOS(userAgent: string): boolean {
  // iPadOS 13+ identifies as Mac with multi-touch. Legacy iPad regex is also
  // matched for older devices.
  if (/ipad|iphone|ipod/.test(userAgent)) return true;
  return /macintosh/.test(userAgent) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1;
}

const IN_APP_BROWSER_PATTERNS: RegExp[] = [
  /\bfban\//i,
  /\bfbav\//i,
  /instagram/i,
  /\btwitter/i,
  /\bline\//i,
  /micromessenger/i,
  /\bsnapchat/i,
  /\blinkedinapp/i,
  /\bgsa\//i, // Google Search App
  /\bpinterest/i,
];

function isInAppBrowser(userAgent: string): boolean {
  return IN_APP_BROWSER_PATTERNS.some((re) => re.test(userAgent));
}

export function usePWA() {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://")
    );
  });
  const [isIOS] = useState(() => {
    if (typeof window === "undefined") return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return isIPadOS(userAgent) && !("MSStream" in window);
  });
  const [isIPad] = useState(() => {
    if (typeof window === "undefined") return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    // Specifically iPadOS (not iPhone) — used to render the install instructions
    // for iPad users in the same way as iPhone Safari.
    return /ipad/.test(userAgent) ||
      (/macintosh/.test(userAgent) && navigator.maxTouchPoints > 1);
  });
  const [isInApp] = useState(() => {
    if (typeof window === "undefined") return false;
    return isInAppBrowser(window.navigator.userAgent);
  });

  useEffect(() => {
    // 1. Listen for the native beforeinstallprompt event (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the browser's default mini-infobar prompt
      e.preventDefault();
      // Store the event so we can trigger it on user action
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // 2. Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    if (!installPromptEvent) {
      console.warn("PWA installation prompt is not available.");
      return false;
    }

    try {
      // Trigger the native browser prompt
      await installPromptEvent.prompt();

      // Wait for the user's decision
      const { outcome } = await installPromptEvent.userChoice;
      if (outcome === "accepted") {
        setIsInstallable(false);
        setInstallPromptEvent(null);
        return true;
      }
    } catch (error) {
      console.error("Failed to install app:", error);
    }
    return false;
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isIPad,
    isInApp,
    installApp,
  };
}
