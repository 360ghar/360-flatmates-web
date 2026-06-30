/**
 * Build-time prerendering for the 360 Flatmates SPA.
 *
 * Runs AFTER `vite build`. Serves the built dist/ with `vite preview`, launches
 * headless Chromium (imported from `@playwright/test`, which is already a
 * devDependency and ships/installs its browser via the e2e workflow), navigates
 * to each public route, waits for the app to render + react-helmet-async to
 * flush meta/JSON-LD, then writes the fully-rendered HTML to dist/<route>/index.html
 * (or dist/index.html for "/"). Real files on disk take precedence over the
 * SPA fallback ("/* /index.html 200" in _redirects), so crawlers that do not
 * run JS (GPTBot, ClaudeBot, CCBot, Applebot, Meta-ExternalAgent, ...) get real
 * HTML with real meta, JSON-LD, and visible content.
 *
 * Route coverage mirrors `scripts/generate-sitemap.ts` exactly: static public
 * routes, every supported city, every neighborhood, and every discoverable
 * listing page (`/discover/:id`) from the shared build-time fetch
 * in `scripts/lib/listings.ts`. Sharing that fetch guarantees the sitemap never
 * advertises a URL that this step has not rendered.
 *
 * CONTRACT (read this if the build is failing with stale or empty dist/):
 *   - This step requires `npx playwright install chromium` to have run (the
 *     e2e workflow already does this; a build-only job must too). A build
 *     without that install will fail at `chromium.launch()` — that is the
 *     intended behaviour (a misconfigured CI must not ship un-prerendered
 *     HTML to crawlers).
 *   - Per-route failures are logged and the build continues; an infrastructure
 *     failure (no dist/, preview server, browser launch) is fatal.
 *   - A route present in the sitemap but NOT prerendered is a bug — both
 *     sources are derived from the same `fetchDiscoverableListings` call so
 *     they cannot drift under normal operation.
 *
 * Robustness:
 *  - A single route failure logs a warning and continues; the build never fails
 *    because of one flaky route.
 *  - Listing prerendering is the build-time-expensive part (one page per
 *    listing). Set `PRERENDER_LISTINGS=0` to skip it; otherwise it runs with a
 *    bounded concurrency (PRERENDER_CONCURRENCY, default 4) to keep build time
 *    sane. Route counts are logged up front so the scale is visible.
 *  - Infrastructure failures (no dist/, preview server won't start, Chromium
 *    can't launch) DO fail the build — if the step cannot run at all there is
 *    nothing to degrade gracefully to. Per-route failures never reach that path.
 *
 * Environment: Vite inlines VITE_* vars from .env into the built bundle at
 * `vite build` time, so the served bundle already contains valid Supabase/API
 * config and validateEnv() in entry.tsx passes. No extra env is needed for a
 * local build that has .env. In CI, ensure the VITE_* vars are present in the
 * build environment, and that `npx playwright install chromium` has run (the
 * e2e workflow already does this; a build-only job must too).
 */
import { chromium, type Browser, type Page } from "@playwright/test";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CITY_NEIGHBORHOODS } from "../src/lib/seo/neighborhoods";
import { SUPPORTED_CITIES } from "../src/lib/seo/config";
import { fetchDiscoverableListings } from "./lib/listings";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(__dirname, "..", "dist");
const PREVIEW_PORT = Number(process.env.PRERENDER_PORT ?? 4178);
const PREVIEW_HOST = "127.0.0.1";
const BASE_URL = `http://${PREVIEW_HOST}:${PREVIEW_PORT}`;
/** Max simultaneous Chromium tabs while capturing. Listing pages are the volume driver. */
const CONCURRENCY = Math.max(1, Number(process.env.PRERENDER_CONCURRENCY ?? 20));
/** Set PRERENDER_LISTINGS=0 to skip per-listing pages (e.g. for a fast smoke build). */
const PRERENDER_LISTINGS = process.env.PRERENDER_LISTINGS !== "0";

/**
 * Static public routes to prerender (derived from src/App.tsx public layout).
 *
 * IMPORTANT: only include routes that are (a) under <PublicLayout/> (not
 * <AuthGuard>/<AdminGuard>) and (b) allowed by public/robots.txt. Authenticated
 * routes (e.g. /search/semantic) are disallowed for crawlers and would render a
 * login redirect at build time — they must NOT be here. City routes are derived
 * from SUPPORTED_CITIES (not hardcoded) so a new city is picked up automatically.
 */
const STATIC_ROUTES: readonly string[] = [
  "/",
  "/discover",
  "/blog",
  "/blog/how-to-find-compatible-flatmates",
  "/blog/flatmate-agreement-essentials",
  "/blog/bangalore-rental-market-guide",
  "/blog/moving-in-with-strangers",
  "/blog/room-inspection-checklist",
  "/blog/flatmate-conflict-resolution",
  "/compare/360-flatmates-vs-nobroker",
  "/compare/360-flatmates-vs-facebook-groups",
  "/compare/360-flatmates-vs-housing",
  "/compare/360-flatmates-vs-magicbricks",
  "/compare/360-flatmates-vs-flatmate-india",
  "/about",
  "/terms",
  "/privacy",
];

/** City landing routes — one per supported city (keeps sitemap ↔ prerender in sync). */
function buildCityRoutes(): string[] {
  return SUPPORTED_CITIES.map((c) => `/cities/${c.slug}`);
}

/** Neighborhood routes generated dynamically from neighborhoods data. */
function buildNeighborhoodRoutes(): string[] {
  const routes: string[] = [];
  for (const city of CITY_NEIGHBORHOODS) {
    // Verify the city slug is a known supported city.
    if (!SUPPORTED_CITIES.some((c) => c.slug === city.citySlug)) continue;
    for (const n of city.neighborhoods) {
      routes.push(`/cities/${city.citySlug}/${n.slug}`);
    }
  }
  return routes;
}

/**
 * Per-listing routes (`/discover/:id`) from the same shared
 * build-time fetch the sitemap uses, so the two never advertise different sets.
 */
async function buildListingRoutes(): Promise<string[]> {
  if (!PRERENDER_LISTINGS) return [];
  const { listings } = await fetchDiscoverableListings();
  const routes: string[] = [];
  for (const l of listings) {
    routes.push(`/discover/${l.id}`);
  }
  return routes;
}

interface RouteResult {
  route: string;
  ok: boolean;
  bytes: number;
  /** True if the route never proved it rendered its own content (still-home / timeout). */
  stale?: boolean;
  /** Rendered + deduped HTML, captured into memory and flushed to disk only AFTER all routes are captured. */
  html?: string;
  error?: string;
}

function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  return new Promise((resolvePromise, rejectPromise) => {
    const tick = (): void => {
      fetch(url, { method: "GET" })
        .then(() => resolvePromise())
        .catch(() => {
          if (Date.now() - start > timeoutMs) {
            rejectPromise(new Error(`Preview server did not start at ${url}`));
          } else {
            setTimeout(tick, 250);
          }
        });
    };
    tick();
  });
}

function startPreview(): { promise: Promise<void>; stop: () => Promise<void> } {
  const child = spawn(
    "npx",
    ["vite", "preview", "--port", String(PREVIEW_PORT), "--host", PREVIEW_HOST, "--strictPort"],
    { cwd: resolve(__dirname, ".."), stdio: "ignore", shell: process.platform === "win32" }
  );

  const stop = async (): Promise<void> => {
    if (!child.killed) child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 200));
  };

  const promise = waitForServer(BASE_URL, 30_000).catch((err) => {
    void stop();
    throw err;
  });

  return { promise, stop };
}

/** Convert a route path into its destination HTML file inside dist/. */
function htmlPathForRoute(route: string): string {
  if (route === "/") return resolve(DIST_DIR, "index.html");
  const clean = route.replace(/^\/+/, "").replace(/\/+$/, "");
  return resolve(DIST_DIR, clean, "index.html");
}

/**
 * The full static fallback title baked into dist/index.html. Used to detect
 * the failure mode where a route is still showing the HOME fallback instead
 * of its own content. Must be the FULL title (not a fragment) because every
 * SeoHelmet appends "| 360 Flatmates" — a fragment would match all pages.
 */
const HOME_FALLBACK_TITLE =
  "Find Compatible Flatmates & Verified Rooms Across India | 360 Flatmates";

type WaitResult = "ready" | "stale" | "timeout";

/**
 * Wait for react-helmet-async to flush the ROUTE-SPECIFIC head and for React
 * Router to have mounted the real route (tearing down the home shell).
 *
 * This is route-aware, not just "any meta exists" — the original predicate
 * (title + description + >=1 ld+json) was already satisfied by the baked home
 * `<head>` in dist/index.html, so it returned immediately and every route was
 * captured as a duplicate of the home page.
 *
 * Signals (all evaluated in the browser via page.waitForFunction):
 *   - For "/" (home): non-Vite <title>, a description meta, AND >=3 ld+json
 *     blocks (Organization + WebSite + WebApplication) — keeps the prior check.
 *   - For any other route: the canonical <link> href MUST contain the route's
 *     path segment (e.g. "bangalore", "blog/how-to-find-compatible-flatmates",
 *     "discover/123"), which proves Helmet flushed THIS route's head; AND the
 *     <title> must differ from the home title; AND a <main>/h1 must be
 *     non-empty (React mounted real content, not the home hero). The canonical
 *     check is the strongest single signal — every public route sets
 *     canonicalUrl to SITE_URL + its own path.
 *
 * Returns "ready" once the predicate passes, "stale" if the predicate never
 * passed within timeoutMs (caller still captures best-effort HTML and warns).
 */
async function waitForHelmetFlush(
  page: Page,
  route: string,
  timeoutMs: number
): Promise<WaitResult> {
  const isHome = route === "/";
  // Route path segment to look for in the canonical href (without leading/trailing slashes).
  const routeSegment = route.replace(/^\/+/, "").replace(/\/+$/, "");

  const passed = await page
    .waitForFunction(
      (args: { home: boolean; segment: string; homeTitle: string }) => {
        const title = document.title ?? "";
        const ld = document.querySelectorAll('script[type="application/ld+json"]').length;
        const hasMeta = !!document.querySelector('meta[name="description"]');
        const hasTitle = !!title && !title.startsWith("Vite");

        if (args.home) {
          return hasTitle && hasMeta && ld >= 3;
        }

        // Non-home route: require evidence THIS route rendered.
        // 1) SOME canonical href must reference this route's path. The shell
        //    bakes a static home canonical; Helmet appends the route canonical.
        //    querySelector returns only the FIRST (home) one, so we must scan
        //    ALL of them — otherwise this check always fails on sub-routes.
        const canonEls = Array.from(
          document.querySelectorAll('link[rel="canonical"]') as NodeListOf<HTMLLinkElement>
        );
        const canonMatches =
          args.segment.length > 0 &&
          canonEls.some((el) => (el.href ?? "").includes(args.segment));
        // 2) Title must have changed from the home fallback. Exact equality
        //    (not includes) because every page appends "| 360 Flatmates".
        const titleIsRouteSpecific = title !== args.homeTitle;
        // 3) React mounted real content (main or h1 present & non-empty).
        const main = document.querySelector("main");
        const h1 = document.querySelector("h1");
        const hasContent = !!((main && (main.textContent ?? "").trim().length > 0) ||
                              (h1 && (h1.textContent ?? "").trim().length > 0));

        return hasMeta && canonMatches && titleIsRouteSpecific && hasContent;
      },
      { home: isHome, segment: routeSegment, homeTitle: HOME_FALLBACK_TITLE },
      { timeout: timeoutMs }
    )
    .then(() => true)
    .catch(() => false);

  return passed ? "ready" : "stale";
}

/**
 * Capture a single route's fully-rendered HTML INTO MEMORY.
 *
 * CRITICAL: this must NOT write to dist/ yet. Writing dist/index.html for the
 * home route on iteration 0 would poison the SPA fallback served by
 * `vite preview`, so every subsequent page.goto(BASE_URL + route) would load
 * the home-rendered shell instead of the clean <div id="root"></div> shell.
 * The original bug (every route rendered as a duplicate of the home page) was
 * exactly this. All captured HTML is flushed to disk at once AFTER the capture
 * loop, by writeCapturedRoutes().
 */
async function prerenderRoute(
  browser: Browser,
  route: string,
): Promise<RouteResult> {
  const page = await browser.newPage({
    userAgent:
      "360FlatmatesPrerender/1.0 (+https://360ghar.com) HeadlessChromium (prerendering for SEO/GEO)",
    javaScriptEnabled: true,
    bypassCSP: true,
  });

  // Suppress noisy console / page errors so a flaky runtime warning does not
  // look like a real failure.
  page.on("console", () => {});
  page.on("pageerror", () => {});

  try {
    const resp = await page.goto(`${BASE_URL}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });

    if (!resp || !resp.ok()) {
      return { route, ok: false, bytes: 0, error: `HTTP ${resp?.status() ?? "no response"}` };
    }

    // Let the network settle so lazy-loaded route chunks finish loading.
    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

    const status = await waitForHelmetFlush(page, route, 20_000);
    // Extra settle so react-helmet-async's effect-flushed DOM mutations land
    // before we snapshot. networkidle alone is not enough for slow routes.
    await page.waitForTimeout(500).catch(() => {});

    const html = await page.content();

    return {
      route,
      ok: true,
      bytes: Buffer.byteLength(html, "utf-8"),
      stale: status === "stale",
      html,
    };
  } catch (err) {
    return {
      route,
      ok: false,
      bytes: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Run async work over items with a bounded concurrency, preserving order in the
 * output. Used so hundreds of listing pages don't render strictly serially.
 */
async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) break;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Flush all captured route HTML to disk. Called only AFTER the capture loop
 * completes, so the clean Vite-built shell stays in dist/index.html throughout
 * capture (vite preview always serves a pristine SPA fallback → React Router
 * mounts the correct route on every page.goto). The home route ("/") is written
 * LAST so it correctly overwrites dist/index.html as the final step.
 */
function writeCapturedRoutes(results: RouteResult[]): void {
  const ordered = [...results].sort((a, b) => {
    // Non-home first, home last. (a.route === "/") pushes "/" to the end.
    if (a.route === "/" && b.route !== "/") return 1;
    if (b.route === "/" && a.route !== "/") return -1;
    return 0;
  });
  for (const r of ordered) {
    if (!r.ok || !r.html) continue;
    const outPath = htmlPathForRoute(r.route);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, r.html, "utf-8");
  }
}

async function main(): Promise<void> {
  if (!existsSync(DIST_DIR)) {
    throw new Error(`dist/ not found at ${DIST_DIR}. Run "vite build" before prerendering.`);
  }

  const cityRoutes = buildCityRoutes();
  const neighborhoodRoutes = buildNeighborhoodRoutes();
  const listingRoutes = await buildListingRoutes();
  const routes: readonly string[] = [
    ...STATIC_ROUTES,
    ...cityRoutes,
    ...neighborhoodRoutes,
    ...listingRoutes,
  ];

  console.log(
    `[prerender] ${routes.length} routes ` +
      `(static ${STATIC_ROUTES.length}, cities ${cityRoutes.length}, ` +
      `neighborhoods ${neighborhoodRoutes.length}, listings ${listingRoutes.length}` +
      `${PRERENDER_LISTINGS ? "" : " [disabled via PRERENDER_LISTINGS=0]"}), ` +
      `concurrency ${CONCURRENCY}`,
  );

  console.log(`[prerender] starting preview server at ${BASE_URL} ...`);
  const preview = startPreview();
  await preview.promise;
  console.log("[prerender] preview server up. Launching Chromium ...");

  // A launch failure means the step cannot run at all — fail loudly so a
  // misconfigured CI (no browser binary) is not masked as "0 routes rendered".
  const browser = await chromium.launch({ headless: true });

  let results: RouteResult[];
  try {
    // Live progress: print each route's outcome as it resolves.
    let done = 0;
    results = await mapWithConcurrency(routes, CONCURRENCY, async (route) => {
      const result = await prerenderRoute(browser, route);
      done++;
      const progress = `[${String(done).padStart(String(routes.length).length)}/${routes.length}]`;
      if (result.ok) {
        const kb = (result.bytes / 1024).toFixed(1);
        const tag = result.stale ? " (STALE — may still be home content)" : "";
        console.log(`[prerender]   ${progress} ${route.padEnd(46)} ok (${kb} KB)${tag}`);
      } else {
        console.log(`[prerender]   ${progress} ${route.padEnd(46)} FAIL - ${result.error}`);
      }
      return result;
    });
  } finally {
    // Browser + preview stop AFTER capture; disk writes happen next so the
    // pristine shell is served for the entire capture phase.
    await browser.close().catch(() => {});
    await preview.stop();
  }

  // Flush all captured HTML to disk now that capture is complete. Home is
  // written last, so dist/index.html is only overwritten as the final step.
  writeCapturedRoutes(results);

  const ok = results.filter((r) => r.ok).length;
  const failed = results.length - ok;
  const stale = results.filter((r) => r.ok && r.stale).length;
  console.log(`[prerender] done: ${ok}/${results.length} succeeded, ${failed} failed, ${stale} stale.`);

  if (failed > 0) {
    console.log("[prerender] failed routes:");
    for (const r of results.filter((r) => !r.ok)) {
      console.log(`  - ${r.route}: ${r.error}`);
    }
  }
  if (stale > 0) {
    console.log("[prerender] WARNING — stale routes (did not prove route-specific render in time):");
    for (const r of results.filter((r) => r.ok && r.stale)) {
      console.log(`  - ${r.route} (best-effort HTML still written)`);
    }
    console.log("[prerender] These routes may contain home/placeholder content. Investigate the page component or raise the timeout.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    // Infrastructure failure (no dist/, preview server, or Chromium launch) —
    // the step cannot run. Fail the build rather than silently ship an
    // un-prerendered SPA. Per-route failures never reach here (caught above).
    console.error("[prerender] fatal:", err);
    process.exit(1);
  });
