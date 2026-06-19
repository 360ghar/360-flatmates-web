import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";
import { setLastAuthMethod } from "@/lib/lastAuthMethod";
import { reportLastMethod } from "@/lib/api/auth";
import type { AuthMethod } from "@/lib/lastAuthMethod";

const EXCHANGE_TIMEOUT_MS = 10_000;

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [failed, setFailed] = useState(false);

  const handleCallback = useCallback(async () => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/home";

    if (!code) {
      navigate("/login?error=auth", { replace: true });
      return;
    }

    const supabase = getSupabaseBrowserClient();

    // Race the exchange against a 10s timeout. `exchangeCodeForSession` has
    // been observed to hang indefinitely in dev (PKCE verifier lookup that
    // never resolves when localStorage is unavailable), leaving the user on
    // a blank spinner. The timeout surfaces a retry-able error state.
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error("OAuth callback timed out")),
        EXCHANGE_TIMEOUT_MS
      );
    });

    try {
      const { data, error } = await Promise.race([
        supabase.auth.exchangeCodeForSession(code),
        timeoutPromise,
      ]);
      if (timeoutId) clearTimeout(timeoutId);

      if (error) {
        setFailed(true);
        return;
      }

      const user = data.session?.user;
      const email = typeof user?.email === "string" ? user.email : undefined;

      // Detect the OAuth provider from the user identities to record the
      // correct last-auth-method (google or apple).
      const identities = user?.identities ?? [];
      const provider = identities.length > 0 ? identities[0]?.provider : "google";
      const method: AuthMethod = provider === "apple" ? "apple" : "google";

      setLastAuthMethod(method, email);
      await reportLastMethod(method);

      // New OAuth users have no phone → route to the skippable add-phone
      // interstitial; otherwise honor the validated `next` target.
      const hasPhone = typeof user?.phone === "string" && user.phone.length > 0;
      const safeNext =
        next.startsWith("/") && !next.startsWith("//") ? next : "/home";
      const destination = hasPhone ? safeNext : "/add-phone";
      navigate(destination, { replace: true });
    } catch {
      if (timeoutId) clearTimeout(timeoutId);
      setFailed(true);
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    // Fire-and-forget: handleCallback navigates or sets the failed state.
    // Calling setState inside the effect is intentional here (the function
    // doesn't render-react to React state — it just kicks off the auth
    // exchange). The cascade only happens on the error path, which is rare.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleCallback();
  }, [handleCallback]);

  if (failed) {
    return (
      <Card className="flex flex-col items-center gap-4 p-6 text-center">
        <h1 className="text-h2">Sign-in failed</h1>
        <p className="text-body-md text-ink-2">
          We couldn&apos;t complete that sign-in. Please try again.
        </p>
        <div className="flex w-full flex-col gap-2">
          <Button fullWidth onClick={() => {
            setFailed(false);
            void handleCallback();
          }}>
            Retry
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={() => navigate("/login?error=auth", { replace: true })}
          >
            Back to login
          </Button>
        </div>
      </Card>
    );
  }

  return <PageSpinner />;
}
