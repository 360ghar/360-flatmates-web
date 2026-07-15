import { useMemo, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { OrDivider } from "@/components/ui/OrDivider";

interface LoginSocialButtonsProps {
  redirectTo: string;
  highlightedMethod: string | undefined;
  onError: (message: string | null) => void;
}

export function LoginSocialButtons({ redirectTo, highlightedMethod, onError }: LoginSocialButtonsProps) {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  /** Apple Sign-In is only available on iOS/Safari browsers. */
  const isAppleSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    // The WebKit-only `-webkit-touch-callout` CSS prop is the real gate — every
    // iOS Safari version supports it, and no desktop browser does.
    const supportsTouchCallout =
      typeof CSS !== "undefined" && typeof CSS.supports === "function"
        ? CSS.supports("-webkit-touch-callout", "none")
        : false;
    if (supportsTouchCallout) return true;

    // Fallback UA sniff: only treat as Apple when the UA *also* contains
    // "Mobile" or "Mac" (desktop Safari shares the engine but a separate
    // product, and we don't ship Apple Sign-In there). Crucially, exclude
    // Chrome / Edge / Opera on iOS — they all masquerade as "Safari" in the UA
    // but are not the platform owner.
    const ua = navigator.userAgent;
    const isAppleDevice = /iPhone|iPad|iPod/.test(ua);
    const isMacSafari =
      /Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua);
    return isAppleDevice || isMacSafari;
  }, []);

  const handleGoogleLogin = async () => {
    onError(null);
    setGoogleLoading(true);
    try {
      // The masked hint + last-method bookkeeping happens after the redirect
      // completes (AuthCallbackPage); here we only kick off the OAuth redirect.
      await signInWithGoogle(redirectTo);
    } catch (err: unknown) {
      setGoogleLoading(false);
      onError(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
    }
  };

  const handleAppleLogin = async () => {
    onError(null);
    setAppleLoading(true);
    try {
      await signInWithApple(redirectTo);
    } catch (err: unknown) {
      setAppleLoading(false);
      onError(err instanceof Error ? err.message : "Apple sign-in failed. Please try again.");
    }
  };

  return (
    <>
      <Button
        fullWidth
        variant="google"
        className="mt-5"
        aria-label="Continue with Google"
        data-method-highlight={highlightedMethod === "google" ? "true" : undefined}
        loading={googleLoading}
        onClick={handleGoogleLogin}
      >
        <span className="flex items-center justify-center gap-2">
          <GoogleIcon className="h-4 w-4" />
          Continue with Google
        </span>
      </Button>

      {isAppleSupported && (
        <Button
          fullWidth
          variant="secondary"
          className="mt-3 bg-black text-white hover:bg-black/90"
          aria-label="Continue with Apple"
          data-method-highlight={highlightedMethod === "apple" ? "true" : undefined}
          loading={appleLoading}
          onClick={handleAppleLogin}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.05 12.04c-.03-3.18 2.6-4.71 2.72-4.78-1.49-2.18-3.81-2.47-4.62-2.51-1.97-.2-3.84 1.16-4.84 1.16-1 0-2.54-1.13-4.18-1.1-2.15.03-4.13 1.25-5.24 3.18-2.23 3.87-.57 9.6 1.61 12.74 1.06 1.54 2.33 3.28 4 3.22 1.61-.07 2.22-1.04 4.16-1.04 1.94 0 2.49 1.04 4.18 1.01 1.73-.03 2.82-1.57 3.88-3.12 1.22-1.79 1.73-3.52 1.75-3.61-.04-.02-3.36-1.29-3.39-5.11zM14.06 3.42c.89-1.08 1.49-2.58 1.33-4.08-1.28.05-2.84.85-3.76 1.93-.83.96-1.55 2.49-1.36 3.96 1.43.11 2.9-.72 3.79-1.81z"/>
            </svg>
            Continue with Apple
          </span>
        </Button>
      )}

      <OrDivider className="my-5" />
    </>
  );
}
