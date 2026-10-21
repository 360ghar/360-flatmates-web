import { Helmet } from "react-helmet-async";
import { isRouteErrorResponse, Outlet, ScrollRestoration, useRouteError } from "react-router";
import { useRouteHandle } from "@/hooks/useRouteHandle";
import { SITE_NAME } from "@/lib/seo/config";
import { ErrorFallback } from "./ErrorFallback";
import { Providers } from "./providers";

/** Root route element: app-wide providers, the skip link and scroll restoration. */
export function RootLayout() {
  return (
    <Providers>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-max)] focus:rounded-cut-md focus:bg-paper-3 focus:px-4 focus:py-3 focus:text-label-lg focus:text-ink focus:shadow-md"
      >
        Skip to content
      </a>
      <RouteTitle />
      <ScrollRestoration />
      <Outlet />
    </Providers>
  );
}

/** The tab title from the route handle. A page's own SeoHelmet, rendered deeper, wins. */
function RouteTitle() {
  const { title } = useRouteHandle();
  return title ? (
    <Helmet>
      <title>{`${title} | ${SITE_NAME}`}</title>
    </Helmet>
  ) : null;
}

/**
 * errorElement for every layout. A reload also recovers from a lazy chunk that
 * vanished after a deploy, which is the most common route error in an SPA.
 */
export function RouteError() {
  const error = useRouteError();
  const normalized =
    error instanceof Error
      ? error
      : new Error(isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : "Unknown route error");
  return <ErrorFallback error={normalized} reset={() => window.location.reload()} />;
}
