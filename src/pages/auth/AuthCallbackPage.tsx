import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PageSpinner } from "@/components/ui/Spinner";
import { setLastAuthMethod } from "@/lib/lastAuthMethod";
import { reportLastMethod } from "@/lib/api/auth";
import type { AuthMethod } from "@/lib/lastAuthMethod";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/home";

    async function handleCallback() {
      if (code) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
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
          return;
        }
      }
      navigate("/login?error=auth", { replace: true });
    }

    handleCallback();
  }, [searchParams, navigate]);

  return <PageSpinner />;
}
