import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PageSpinner } from "@/components/ui/Spinner";
import { setLastAuthMethod } from "@/lib/lastAuthMethod";
import { reportLastMethod } from "@/lib/api/auth";
import { consumeOAuthNext } from "@/lib/auth/oauth-redirect";
import { mapSupabaseAuthError } from "@/lib/authErrors";
import type { AuthMethod } from "@/lib/lastAuthMethod";

const EXCHANGE_TIMEOUT_MS = 10_000;

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // The OAuth code is single-use: exchange it once even under StrictMode
  // double effects or a changed searchParams identity (W9).
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void handleCallback();

    async function handleCallback() {
      const code = searchParams.get("code");
      const oauthError =
        searchParams.get("error_description") || searchParams.get("error");
      // Prefer sessionStorage stash (clean redirectTo); URL ?next= is legacy fallback.
      const next = consumeOAuthNext(searchParams.get("next"));

      if (oauthError) {
        navigate(`/login?error=${encodeURIComponent(oauthError)}`, {
          replace: true,
        });
        return;
      }

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
          navigate(
            `/login?error=${encodeURIComponent(mapSupabaseAuthError(error))}`,
            { replace: true }
          );
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
        // Best-effort: never hold the user on a spinner for analytics.
        void reportLastMethod(method).catch(() => undefined);

        // New OAuth users have no phone → route to the skippable add-phone
        // interstitial; otherwise honor the validated `next` target.
        const hasPhone = typeof user?.phone === "string" && user.phone.length > 0;
        const destination = hasPhone
          ? next
          : `/add-phone?next=${encodeURIComponent(next)}`;
        navigate(destination, { replace: true });
      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);
        navigate(
          `/login?error=${encodeURIComponent(mapSupabaseAuthError(err))}`,
          { replace: true }
        );
      }
    }
  }, [searchParams, navigate]);

  return <PageSpinner />;
}
