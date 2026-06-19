/**
 * Shared build-time listing discovery for generate-sitemap.ts and prerender.ts.
 *
 * Both scripts need the SAME set of discoverable listing IDs — the sitemap
 * emits `/discover/:id` URLs, and prerender renders those exact
 * pages — so the fetch lives here once and the two consumers cannot drift out
 * of sync (which previously left sitemap URLs unrendered for JS-less crawlers).
 *
 * Resilience: any network / parse / timeout failure resolves to an empty list
 * and logs a warning, so a local or offline build never hard-fails here.
 * `generate-sitemap.ts` honors `SITEMAP_STRICT=1` to make an empty result
 * fatal, so production deploys surface an API outage instead of shipping a
 * listings-less sitemap.
 */
export interface DiscoverableListing {
  id: string;
  /** ISO 8601 last-modified timestamp (best available: created_at). */
  lastmod?: string;
  /** Listing image URLs for image-sitemap entries (main + additional). */
  images?: string[];
  /** Listing title used as image:title in the image sitemap. */
  title?: string;
}

export interface FetchListingsResult {
  listings: DiscoverableListing[];
  /**
   * `false` if the fetch failed (network error, non-2xx, parse error, timeout).
   * `true` if the API responded OK — including an empty result (genuinely zero
   * listings). Lets `generate-sitemap.ts` strict mode distinguish a real outage
   * from an legitimately empty catalog.
   */
  ok: boolean;
}

/**
 * API base URL for fetching listings at build time.
 * Override via SITEMAP_API_BASE_URL (the name is shared with the sitemap for
 * backward compatibility) if the endpoint changes (staging vs production).
 *
 * If /properties ever requires auth, set SITEMAP_API_TOKEN and it will be sent
 * as a Bearer header automatically.
 */
const API_BASE =
  process.env.SITEMAP_API_BASE_URL ?? "https://api.360ghar.com/api/v1";
const REQUEST_TIMEOUT_MS = 10_000;
const LISTING_PAGE_SIZE = 100;

/**
 * Decide whether the build is allowed to call the listing API at all.
 *
 * Returns true ONLY when Netlify reports `CONTEXT=production` (i.e. a push to
 * the production branch). Every other context — local builds (CONTEXT unset),
 * Netlify deploy previews (`deploy-preview`), and Netlify branch deploys
 * (`branch-deploy`) — skips the fetch so a single contributor running
 * `npm run build` repeatedly, or every PR opening a preview, does not hammer
 * the FastAPI backend / Supabase.
 *
 * No manual override env var by design: the auto-detection matches the only
 * context that needs listing data, and skipping everywhere else is the
 * default. Consumers (sitemap, static HTML) tolerate the empty result; the
 * SPA fallback handles deep listing links client-side at runtime.
 */
export function shouldFetchListingData(): boolean {
  return process.env.CONTEXT === "production";
}

/**
 * Fetch every discoverable listing from the public `/properties` endpoint.
 *
 * The endpoint is unauthenticated (`security: []` in the OpenAPI spec) and
 * returns only active/approved listings. Pagination is page-based (max 100 per
 * page); this function iterates all pages.
 *
 * On any failure the result is `{ listings: [], ok: false }` so the build never
 * hard-fails because of a listing fetch — callers decide whether a failed fetch
 * is fatal (sitemap strict mode).
 */
export async function fetchDiscoverableListings(): Promise<FetchListingsResult> {
  if (!shouldFetchListingData()) {
    console.log(
      `[listings] Skipped — CONTEXT is "${process.env.CONTEXT ?? "<unset>"}" ` +
        "(not \"production\"). Returning an empty listing set for this build.",
    );
    return { listings: [], ok: true };
  }

  const apiToken = process.env.SITEMAP_API_TOKEN;

  const listings: DiscoverableListing[] = [];
  let page = 1;
  let totalPages = 1;

  try {
    while (page <= totalPages) {
      const url = new URL(`${API_BASE}/properties`);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(LISTING_PAGE_SIZE));
      // sort_by=newest gives most-recently-created first — useful order for a
      // sitemap and avoids any geo-bias from the default relevance sort.
      url.searchParams.set("sort_by", "newest");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const headers: HeadersInit = { Accept: "application/json" };
      if (apiToken) {
        headers["Authorization"] = `Bearer ${apiToken}`;
      }

      const res = await fetch(url.toString(), {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(
          `[listings] API returned HTTP ${res.status} on page ${page}. ` +
            "Returning an empty listing set for this build.",
        );
        return { listings: [], ok: false };
      }

      const data = (await res.json()) as {
        properties: Array<{
          id: number;
          created_at?: string;
          main_image_url?: string;
          image_urls?: string[];
          title?: string;
        }>;
        total_pages: number;
      };

      totalPages = data.total_pages ?? 1;

      for (const prop of data.properties) {
        const allImages = [prop.main_image_url, ...(prop.image_urls ?? [])].filter(
          (u): u is string => Boolean(u),
        );
        const uniqueImages = [...new Set(allImages)];

        listings.push({
          id: String(prop.id),
          lastmod: prop.created_at,
          images: uniqueImages.length > 0 ? uniqueImages : undefined,
          title: prop.title,
        });
      }

      page++;

      // Brief delay between paginated requests to respect rate limits.
      if (page <= totalPages) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    console.log(`[listings] Fetched ${listings.length} discoverable listing(s).`);
    return { listings, ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      `[listings] Could not fetch listings (${msg}). ` +
        "Returning an empty listing set for this build.",
    );
    return { listings: [], ok: false };
  }
}

