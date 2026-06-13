import { Navigate, Outlet, useLocation } from "react-router";
import { useStore } from "zustand";
import { useAuth } from "@/hooks/useAuth";
import { authStore } from "@/lib/stores/auth-store";
import { PageSpinner } from "@/components/ui/Spinner";

const AUTH_ROUTES = new Set(["/login", "/signup", "/forgot-password"]);

/** Routes that are part of the gate flow (not bounced by the auth-state guard). */
const GATE_ROUTES = new Set([
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
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

export function AuthRedirectGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();
  // OTP verification signs the user in mid-flow (before the mandatory
  // set-password / new-password step). Hold the redirect until the flow ends.
  const midAuthFlow = useStore(authStore, (s) => s.midAuthFlow);

  if (loading) {
    return <PageSpinner />;
  }

  if (user && !midAuthFlow && AUTH_ROUTES.has(location.pathname)) {
    return <Navigate to="/home" replace />;
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
  const authStage = useStore(authStore, (s) => s.authStage);
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

  // Don't redirect if already on a gate route.
  if (GATE_ROUTES.has(location.pathname)) {
    return <Outlet />;
  }

  if (authStage === "profile_completion") {
    return <Navigate to="/complete-profile" replace />;
  }

  if (authStage === "app_onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
