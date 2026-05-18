import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PageSpinner } from "@/components/ui/Spinner";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/home";

    async function handleCallback() {
      if (code) {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/home";
          navigate(safeNext, { replace: true });
          return;
        }
      }
      navigate("/login?error=auth", { replace: true });
    }

    handleCallback();
  }, [searchParams, navigate]);

  return <PageSpinner />;
}
