import { useStore } from "zustand";
import { useAuth } from "@/hooks/useAuth";
import { authStore } from "@/lib/stores/auth-store";
import { AppLayout } from "./AppLayout";
import { PublicLayout } from "./PublicLayout";

/**
 * Browse and search are public, but a signed-in user should stay inside the
 * app shell. Mid-auth-flow and mid-onboarding users keep the public header.
 */
export function AdaptiveLayout() {
  const { user, loading } = useAuth();
  const midAuthFlow = useStore(authStore, (s) => s.midAuthFlow);
  const authStage = useStore(authStore, (s) => s.authStage);
  // "unknown" counts as in-app: nearly every signed-in user is past the gate,
  // so the shell shows at once instead of swapping in after the stage loads.
  const inApp = !loading && Boolean(user) && !midAuthFlow && (authStage === "active" || authStage === "unknown");
  return inApp ? <AppLayout /> : <PublicLayout />;
}
