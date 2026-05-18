import type { QueryClient } from "@tanstack/react-query";
import { bootstrapOptions } from "@/hooks/queries/useBootstrap";
import { myPropertiesOptions } from "@/hooks/queries/useProperties";
import { myProfileOptions, peerProfilesOptions } from "@/hooks/queries/useProfiles";
import { swipeDeckOptions } from "@/hooks/queries/useSwipes";
import { conversationsOptions } from "@/hooks/queries/useConversations";
import { matchesOptions, incomingLikesOptions } from "@/hooks/queries/useMatches";
import { notificationsOptions } from "@/hooks/queries/useNotifications";
import { catalogsOptions } from "@/hooks/queries/useCatalogs";
import { dashboardOptions } from "@/hooks/queries/useDashboard";
import { savedSearchesOptions } from "@/hooks/queries/useSearch";

type PrefetchFn = (qc: QueryClient) => Promise<unknown>;

const ROUTE_PREFETCH_MAP: Record<string, PrefetchFn[]> = {
  "/home": [(qc) => qc.prefetchQuery(bootstrapOptions), (qc) => qc.prefetchQuery(myProfileOptions), (qc) => qc.prefetchQuery(myPropertiesOptions), (qc) => qc.prefetchQuery(peerProfilesOptions()), (qc) => qc.prefetchQuery(swipeDeckOptions())],
  "/swipe": [(qc) => qc.prefetchQuery(swipeDeckOptions())],
  "/likes": [(qc) => qc.prefetchQuery(incomingLikesOptions()), (qc) => qc.prefetchQuery(peerProfilesOptions())],
  "/matches": [(qc) => qc.prefetchQuery(matchesOptions)],
  "/chats": [(qc) => qc.prefetchQuery(conversationsOptions)],
  "/notifications": [(qc) => qc.prefetchQuery(notificationsOptions())],
  "/explore": [(qc) => qc.prefetchQuery(catalogsOptions), (qc) => qc.prefetchQuery(peerProfilesOptions())],
  "/dashboard": [(qc) => qc.prefetchQuery(dashboardOptions), (qc) => qc.prefetchQuery(myProfileOptions)],
  "/manage": [(qc) => qc.prefetchQuery(myPropertiesOptions), (qc) => qc.prefetchQuery(myProfileOptions)],
  "/profile": [(qc) => qc.prefetchQuery(myProfileOptions)],
  "/saved-searches": [(qc) => qc.prefetchQuery(savedSearchesOptions)],
  "/search": [(qc) => qc.prefetchQuery(catalogsOptions)],
};

export async function prefetchRouteQueries(
  queryClient: QueryClient,
  pathname: string
): Promise<void> {
  const fns = ROUTE_PREFETCH_MAP[pathname];
  if (!fns) return;
  await Promise.all(fns.map((fn) => fn(queryClient)));
}
