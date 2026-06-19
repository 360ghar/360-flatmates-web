import type { QueryClient } from "@tanstack/react-query";
import { bootstrapOptions } from "@/hooks/queries/useBootstrap";
import { myPropertiesOptions } from "@/hooks/queries/useProperties";
import { myProfileOptions, peerProfilesOptions } from "@/hooks/queries/useProfiles";
import { swipeDeckOptions } from "@/hooks/queries/useSwipes";
import { conversationsOptions } from "@/hooks/queries/useConversations";
import { matchesOptions, incomingLikesOptions } from "@/hooks/queries/useMatches";
import { notificationsOptions } from "@/hooks/queries/useNotifications";
import { catalogsOptions } from "@/hooks/queries/useCatalogs";

type PrefetchFn = (qc: QueryClient, signal: AbortSignal) => Promise<unknown>;

const ROUTE_PREFETCH_MAP: Record<string, PrefetchFn[]> = {
  "/home": [(qc) => qc.prefetchQuery(bootstrapOptions), (qc) => qc.prefetchQuery(myProfileOptions), (qc) => qc.prefetchQuery(myPropertiesOptions), (qc) => qc.prefetchQuery(peerProfilesOptions()), (qc) => qc.prefetchQuery(swipeDeckOptions())],
  "/swipe": [(qc) => qc.prefetchQuery(swipeDeckOptions())],
  "/likes": [(qc) => qc.prefetchQuery(incomingLikesOptions()), (qc) => qc.prefetchQuery(matchesOptions), (qc) => qc.prefetchQuery(peerProfilesOptions())],
  "/chats": [(qc) => qc.prefetchQuery(conversationsOptions)],
  "/notifications": [(qc) => qc.prefetchQuery(notificationsOptions())],
  "/explore": [(qc) => qc.prefetchQuery(catalogsOptions), (qc) => qc.prefetchQuery(peerProfilesOptions())],
  // Dashboard stats are now derived from /properties/me, which is already
  // prefetched for /home and /manage. Avoid a redundant request here.
  "/manage": [(qc) => qc.prefetchQuery(myPropertiesOptions), (qc) => qc.prefetchQuery(myProfileOptions)],
  "/profile": [(qc) => qc.prefetchQuery(myProfileOptions)],
  "/search": [(qc) => qc.prefetchQuery(catalogsOptions)]
  // /dashboard, /saved-searches: removed - dashboard is derived locally,
  // saved-searches/alerts are localStorage-backed and need no prefetch.
};

interface NetworkConnection {
  saveData?: boolean;
  effectiveType?: "2g" | "3g" | "4g" | "slow-2g";
  addEventListener?: (type: string, listener: EventListener) => void;
  removeEventListener?: (type: string, listener: EventListener) => void;
}

function getConnection(): NetworkConnection | null {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as Navigator & {
    connection?: NetworkConnection;
    mozConnection?: NetworkConnection;
    webkitConnection?: NetworkConnection;
  };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
}

/**
 * Returns true if the current connection is too slow/expensive to justify
 * a speculative route prefetch. We bail on save-data mode and on any
 * connection slower than 4g (which includes 2g, 3g, and slow-2g).
 */
export function shouldPrefetch(): boolean {
  const conn = getConnection();
  if (!conn) return true;
  if (conn.saveData) return false;
  if (conn.effectiveType && conn.effectiveType !== "4g") return false;
  return true;
}

let activeController: AbortController | null = null;

export async function prefetchRouteQueries(
  queryClient: QueryClient,
  pathname: string
): Promise<void> {
  if (!shouldPrefetch()) return;

  const fns = ROUTE_PREFETCH_MAP[pathname];
  if (!fns) return;

  // Cancel any in-flight prefetch from a previous route. This avoids
  // burning bandwidth on queries the user is no longer about to need.
  if (activeController) activeController.abort();
  activeController = new AbortController();
  const { signal } = activeController;

  try {
    await Promise.all(fns.map((fn) => fn(queryClient, signal)));
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") return;
    // Non-abort errors are swallowed — the real fetch will run on mount.
  } finally {
    if (activeController?.signal === signal) activeController = null;
  }
}
