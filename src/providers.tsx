import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { type ReactNode, useCallback, useEffect, useRef, useSyncExternalStore, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useSSE } from "@/hooks/useSSE";
import { ApiClientError, setAccessToken, setRefreshTokenHandler } from "@/lib/api";
import { uiStore } from "@/lib/stores/ui-store";
import type { PalettePreference, ThemePreference } from "@/lib/stores/ui-store";
import { searchStore } from "@/lib/stores/search-store";
import { Toast, ToastViewport } from "@/components/ui/Toast";
import { PageSpinner } from "@/components/ui/Spinner";

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

  useEffect(() => {
    setRefreshTokenHandler(async () => {
      if (refreshPromise) return refreshPromise;

      refreshPromise = (async () => {
        try {
          const { getSupabaseBrowserClient } = await import(
            "@/lib/supabase/client"
          );
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

  if (loading) {
    return <PageSpinner />;
  }

  return children;
}

function ToastContainer() {
  const toasts = useSyncExternalStore(
    (cb) => {
      let prev = uiStore.getState().toasts;
      return uiStore.subscribe(() => {
        const next = uiStore.getState().toasts;
        if (next !== prev) {
          prev = next;
          cb();
        }
      });
    },
    () => uiStore.getState().toasts
  );

  if (toasts.length === 0) return null;

  return (
    <ToastViewport>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          description={toast.description}
          onClick={() => uiStore.getState().dismissToast(toast.id)}
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
