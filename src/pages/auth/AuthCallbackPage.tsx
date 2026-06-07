import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PageSpinner } from "@/components/ui/Spinner";
import { setLastAuthMethod } from "@/lib/lastAuthMethod";
import { reportLastMethod } from "@/lib/api/auth";

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
          // OAuth (Google) success — record last-used method now that we have a
          // session. The provider is read from the user identities; default to
          // google since this callback handles the OAuth redirect flow.
          const user = data.session?.user;
          const email = typeof user?.email === "string" ? user.email : undefined;
          setLastAuthMethod("google", email);
          await reportLastMethod("google");

          // New Google users have no phone → route to the skippable add-phone
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
