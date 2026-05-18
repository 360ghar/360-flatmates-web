import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { PageSpinner } from "@/components/ui/Spinner";

const AUTH_ROUTES = new Set(["/login", "/signup", "/forgot-password"]);

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

  if (loading) {
    return <PageSpinner />;
  }

  if (user && AUTH_ROUTES.has(location.pathname)) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
