// Component is dead. Plausible is loaded via index.html (the static
// <script defer data-domain="360ghar.com" src="https://plausible.io/js/script.js" />
// tag). Mounting this React component would double-count every pageview.
// If you want client-side control of Plausible, gate the import on a build
// flag and remove the static script tag from index.html first.
import { useEffect } from "react";
import { useLocation } from "react-router";

const PLAUSIBLE_DOMAIN = "360ghar.com";
const PLAUSIBLE_SCRIPT = "https://plausible.io/js/script.js";

declare global {
  interface Window {
    plausible?: (...args: unknown[]) => void;
  }
}

export function PlausibleProvider() {
  const location = useLocation();

  useEffect(() => {
    if (window.plausible) {
      window.plausible("pageview", { u: window.location.href });
    }
  }, [location.pathname]);

  return (
    <script
      defer
      data-domain={PLAUSIBLE_DOMAIN}
      src={PLAUSIBLE_SCRIPT}
    />
  );
}

export function trackEvent(name: string, props?: Record<string, unknown>) {
  if (window.plausible) {
    window.plausible(name, { props });
  }
}
