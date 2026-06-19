import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { onboardingStore } from "@/lib/stores/onboarding-store";
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
      onboardingStore.getState().clearDraft();
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, queryClient]);

  useEffect(() => {
    const token = session?.access_token ?? null;
    setAccessToken(token);
  }, [session?.access_token, loading]);

  // Fetch the backend-computed auth gate stage when the user is authenticated.
  // Routed through TanStack Query so retries, dedup, and refetch-on-focus are
  // handled by the cache. `useAuthStateQuery` re-checks `midAuthFlow` after the
  // response resolves so a multi-step auth flow that started while the request
  // was in flight is not stomped on.
  useAuthStateQuery(isAuthenticated);

  useEffect(() => {
    setRefreshTokenHandler(async () => {
      if (refreshPromise) return refreshPromise;

      // NOTE (F10 #5): there is a benign race window between the consumer
      // calling `setRefreshTokenHandler` and the first 401. In the normal
      // cold-load path the handler is set before any user-driven call could
      // trigger a 401. The dedupe (`refreshPromise` here + `refreshing` on
      // HttpApiClient) is correct in steady state. Flag for follow-up if this
      // ever becomes user-visible.
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

/**
 * Fetch the backend-computed auth gate stage while the user is authenticated.
 * The `midAuthFlow` post-resolve check (F10 fix #4) prevents the gate from
 * stomping on a multi-step auth flow that started after the request was
 * issued.
 */
function useAuthStateQuery(isAuthenticated: boolean) {
  const query = useQuery({
    queryKey: ["auth-state", "flatmates"],
    queryFn: ({ signal }) => getAuthState("flatmates", signal),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false
  });

  useEffect(() => {
    if (!query.data) return;
    if (query.isStale && !query.isFetching) return;
    if (authStore.getState().midAuthFlow) return;
    authStore.getState().setAuthStage(query.data.stage, query.data.missing_fields);
  }, [query.data, query.isStale, query.isFetching]);
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
    () => {
      const client = new QueryClient({
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
              if (
                error instanceof ApiClientError &&
                error.appError.type === "forbidden"
              ) {
                return false;
              }
              if (
                error instanceof ApiClientError &&
                error.appError.type === "rate_limit"
              ) {
                return failureCount < 1;
              }
              if (
                error instanceof ApiClientError &&
                error.appError.type === "validation"
              ) {
                return false;
              }
              if (
                error instanceof ApiClientError &&
                error.appError.type === "bad_request"
              ) {
                return false;
              }
              return failureCount < 1;
            },
            staleTime: 60_000
          }
        }
      });

      // Catalog queries (cities, amenities, localities) are static-feeling and
      // rarely change. Override the global `staleTime` so we don't re-fetch
      // them on every consumer mount. 30 min matches the per-query override
      // on `useCatalogs`.
      client.setQueryDefaults(["catalogs"], { staleTime: 30 * 60 * 1000 });
      return client;
    }
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
