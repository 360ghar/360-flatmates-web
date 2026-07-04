import { Navigate, Outlet, useLocation, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "zustand";
import { useAuth } from "@/hooks/useAuth";
import { authStore } from "@/lib/stores/auth-store";
import { PageSpinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { resolveRedirect } from "@/lib/redirect";
import { uiStore } from "@/lib/stores/ui-store";

// /signup intentionally omitted: it's a <Navigate to="/login">, never guarded
// content — a signed-in user is bounced to /home via the /login entry anyway.
const AUTH_ROUTES = new Set(["/login", "/forgot-password"]);

/** Routes that are part of the gate flow (not bounced by the auth-state guard). */
const GATE_ROUTES = new Set([
  "/profile/edit",
  "/complete-profile",
  "/onboarding",
  "/add-phone",
]);

export function AuthGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageSpinner />;
  }

  if (!user) {
    const redirectTo = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}

export function AdminGuard() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.app_metadata?.role !== "admin") {
    uiStore.getState().pushToast({
      type: "warning",
      title: "Access denied",
      description: "You don't have permission to access that page.",
    });
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

export function AuthRedirectGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  // OTP verification signs the user in mid-flow (before the mandatory
  // set-password / new-password step). Hold the redirect until the flow ends.
  const midAuthFlow = useStore(authStore, (s) => s.midAuthFlow);
  const authStage = useStore(authStore, (s) => s.authStage);

  if (loading) {
    return <PageSpinner />;
  }

  if (user && !midAuthFlow && AUTH_ROUTES.has(location.pathname)) {
    if (authStage === "unknown") {
      return <PageSpinner />;
    }
    if (authStage === "password_setup" && location.pathname === "/login") {
      return <Outlet />;
    }
    const target = resolveRedirect(searchParams.get("redirect"));
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}

/**
 * Gate-state guard: enforces the PROFILE_COMPLETION and APP_ONBOARDING gates.
 *
 * After a user is authenticated, this guard fetches the backend-computed auth
 * stage (`GET /users/me/auth-state`) and redirects to the appropriate gate
 * screen if the stage is not yet `active`. The gate state is cached in the
 * authStore so it is not re-fetched on every navigation.
 */
export function GateGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const authStage = useStore(authStore, (s) => s.authStage);
  const authStageError = useStore(authStore, (s) => s.authStageError);
  const midAuthFlow = useStore(authStore, (s) => s.midAuthFlow);

  if (loading) {
    return <PageSpinner />;
  }

  // No gate enforcement for unauthenticated users or during mid-auth flows
  // (OTP / set-password / password-reset steps create a session before the
  // flow is complete).
  if (!user || midAuthFlow) {
    return <Outlet />;
  }

  if (authStageError) {
    return (
      <AuthGateError
        message={authStageError}
        onRetry={() => {
          authStore.getState().setAuthStageUnknown();
          void queryClient.invalidateQueries({ queryKey: ["auth-state", "flatmates"] });
        }}
      />
    );
  }

  if (authStage === "unknown") {
    return <PageSpinner />;
  }

  if (authStage === "password_setup") {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?flow=set-password&redirect=${redirect}`} replace />;
  }

  // Don't redirect if already on a gate route.
  // Prefix-match /onboarding so /onboarding/:step is also treated as a gate route.
  if (
    GATE_ROUTES.has(location.pathname) ||
    location.pathname.startsWith("/onboarding/")
  ) {
    return <Outlet />;
  }

  if (authStage === "profile_completion") {
    return <Navigate to="/profile/edit" replace />;
  }

  if (authStage === "app_onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

function AuthGateError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 text-ink">
      <section className="w-full max-w-md rounded-[16px] border border-line bg-surface p-6 text-center shadow-sm">
        <h1 className="text-h2">Could not verify your account</h1>
        <p className="mt-2 text-body-md text-ink-2">
          {message || "Please check your connection and try again."}
        </p>
        <Button className="mt-5" fullWidth onClick={onRetry}>
          Try again
        </Button>
      </section>
    </main>
  );
}
