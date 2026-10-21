import { useMatches } from "react-router";

/**
 * Route metadata set with `handle` in app/routes.tsx: the page title, the nav
 * tab to mark active, and where Back goes when there is no in-app history.
 */
export interface RouteHandle {
  title?: string;
  navTab?: string;
  back?: string;
}

/** Merged handle values of the current route (deepest match wins). */
export function useRouteHandle(): RouteHandle {
  const matches = useMatches();
  const merged: RouteHandle = {};
  for (const match of matches) Object.assign(merged, match.handle as RouteHandle | undefined);
  return merged;
}
