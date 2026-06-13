import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSSE } from "@/hooks/useSSE";
import { ApiClientError, setAccessToken, setRefreshTokenHandler } from "@/lib/api";
import { getAuthState } from "@/lib/api/auth";
import { authStore } from "@/lib/stores/auth-store";
import { useStore } from "zustand";
import { uiStore } from "@/lib/stores/ui-store";
import type { PalettePreference, ThemePreference } from "@/lib/stores/ui-store";
import { searchStore } from "@/lib/stores/search-store";
import { Toast, ToastViewport } from "@/components/ui/Toast";


let refreshPromise: Promise<string | null> | null = null;

function ProviderInternals({
  children,
}: {
  children: ReactNode;
}) {
  const { session, loading } = useAuth();

  const isAuthenticated = !loading && !!session;

  const queryClient = useQueryClient();
  const wasAuthenticated = useRef(isAuthenticated);

  useEffect(() => {
    if (wasAuthenticated.current && !isAuthenticated) {
      queryClient.clear();
      searchStore.getState().resetFilters();
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, queryClient]);

  useEffect(() => {
    const token = session?.access_token ?? null;
    setAccessToken(token);
  }, [session?.access_token, loading]);

  // Fetch the backend-computed auth gate stage when the user is authenticated
  // and not in the middle of a multi-step auth flow. The GateGuard reads
  // authStore.authStage to route profile-completion / onboarding screens.
  useEffect(() => {
    const midAuthFlow = authStore.getState().midAuthFlow;
    if (!isAuthenticated || midAuthFlow) return;

    let cancelled = false;
    getAuthState("flatmates")
      .then((data) => {
        if (!cancelled) {
          authStore.getState().setAuthStage(data.stage, data.missing_fields);
        }
      })
      .catch(() => {
        // Non-fatal: default stage is "active" so the user proceeds.
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    setRefreshTokenHandler(async () => {
      if (refreshPromise) return refreshPromise;

      refreshPromise = (async () => {
        try {
          const supabase = getSupabaseBrowserClient();
          const { data, error } = await supabase.auth.refreshSession();
          if (error) throw error;
          const newToken = data.session?.access_token ?? null;
          if (newToken) setAccessToken(newToken);
          return newToken;
        } catch {
          return null;
        } finally {
          refreshPromise = null;
        }
      })();

      return refreshPromise;
    });

    return () => setRefreshTokenHandler(null);
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    return session?.access_token ?? null;
  }, [session?.access_token]);

  useSSE(isAuthenticated, getToken);

  useEffect(() => {
    const applyTheme = (theme: ThemePreference) => {
      const isDark =
        theme === "dark" ||
        (theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      if (isDark) {
        document.documentElement.dataset.theme = "dark";
      } else {
        delete document.documentElement.dataset.theme;
      }
    };

    const applyPalette = (palette: PalettePreference) => {
      document.documentElement.dataset.palette = palette;
    };

    applyTheme(uiStore.getState().theme);
    applyPalette(uiStore.getState().palette);

    let prevTheme = uiStore.getState().theme;
    let prevPalette = uiStore.getState().palette;
    const unsub = uiStore.subscribe((state) => {
      if (state.theme !== prevTheme) {
        prevTheme = state.theme;
        applyTheme(state.theme);
      }
      if (state.palette !== prevPalette) {
        prevPalette = state.palette;
        applyPalette(state.palette);
      }
    });

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (uiStore.getState().theme === "system") {
        applyTheme("system");
      }
    };
    mql.addEventListener("change", onSystemChange);

    return () => {
      unsub();
      mql.removeEventListener("change", onSystemChange);
    };
  }, []);

  return children;
}

function ToastContainer() {
  const toasts = useStore(uiStore, (s) => s.toasts);
  const dismissToast = useStore(uiStore, (s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <ToastViewport>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          description={toast.description}
          onClick={() => dismissToast(toast.id)}
        />
      ))}
    </ToastViewport>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (
                error instanceof ApiClientError &&
                error.appError.type === "auth"
              ) {
                if (failureCount === 0) return true;
                return false;
              }
              return failureCount < 1;
            },
            staleTime: 60_000
          }
        }
      })
  );

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <ProviderInternals>{children}</ProviderInternals>
        <ToastContainer />
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
