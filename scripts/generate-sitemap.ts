/**
 * Generates `public/sitemap.xml` for https://360ghar.com.
 *
 * Run standalone:  `npx tsx scripts/generate-sitemap.ts`
 * Also invoked by: `npm run build` (see package.json `build` script).
 *
 * ──────────────────────────────────────────────────────────────────────────
 * What is included
 * ──────────────────────────────────────────────────────────────────────────
 *  - Static PUBLIC routes only (verified against `src/App.tsx`'s PublicLayout).
 *  - One URL per supported city (`/cities/:slug`).
 *  - Neighborhood URLs (`/cities/:slug/:neighborhood`) — the route exists in
 *    App.tsx and the data lives in `src/lib/seo/neighborhoods.ts`.
 *  - Blog posts and comparison pages (static slugs maintained here).
 *  - Dynamic listing pages (`/discover/:id`) — IDs + images
 *    fetched at build time from the public `/properties` API (shared with
 *    prerender via `scripts/lib/listings.ts`, so the two never drift).
 *  - Image-sitemap entries (`<image:image>`) for pages with a stable
 *    representative image (homepage OG image, reused for city pages until
 *    dedicated hero assets exist, plus listing photos).
 *
 * ──────────────────────────────────────────────────────────────────────────
 * What is deliberately NOT included
 * ──────────────────────────────────────────────────────────────────────────
 *  - `/search/semantic` — public but intentionally marked noindex in the
 *    route metadata, so it is allowed in robots but not advertised here.
 *  - Protected app routes under `<AuthGuard>` in App.tsx.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * Design notes
 * ──────────────────────────────────────────────────────────────────────────
 *  - `changefreq` / `priority`: Google ignores both, but other crawlers and
 *    some tooling still read them, so they are retained as light hints.
 *  - `lastmod`: uses the build timestamp (`new Date().toISOString()`). If
 *    per-route lastmod matters later, derive it from git/file mtimes here.
 *  - Strict mode: set `SITEMAP_STRICT=1` to make a failed listing fetch
 *    (network/HTTP/parse) exit non-zero — use on deploy builds so an API
 *    outage is surfaced instead of shipping a listings-less sitemap. Local
 *    builds stay resilient and fall back to static URLs only.
 */

import { writeFileSync } from "fs";
import { resolve } from "path";
import { SITE_URL, SUPPORTED_CITIES } from "../src/lib/seo/config";
import { CITY_NEIGHBORHOODS } from "../src/lib/seo/neighborhoods";
import { fetchDiscoverableListings, shouldFetchListingData } from "./lib/listings";

// ──────────────────────────────────────────────────────────────────────────
// Static PUBLIC routes (verified against src/App.tsx → PublicLayout).
// Kept free of authenticated routes and noindex public routes.
// ──────────────────────────────────────────────────────────────────────────
interface StaticRoute {
  path: string;
  changefreq: string;
  priority: string;
  /** Stable representative image URL (absolute), if any, for image sitemap. */
  image?: string;
  /** Caption/alt hint for the image entry (optional, image-sitemap <image:title>). */
  imageTitle?: string;
}

// Stable OG image used as the representative image. config.ts names this file;
// keep the value in sync with DEFAULT_OG_IMAGE.
const OG_IMAGE = `${SITE_URL}/og-image.webp`;

const STATIC_ROUTES: StaticRoute[] = [
  { path: "/", changefreq: "daily", priority: "1.0", image: OG_IMAGE, imageTitle: "360 Flatmates" },
  { path: "/discover", changefreq: "hourly", priority: "0.9" },
  { path: "/search", changefreq: "hourly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/terms", changefreq: "monthly", priority: "0.3" },
  { path: "/privacy", changefreq: "monthly", priority: "0.3" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
];

const BLOG_POSTS = [
  { slug: "how-to-find-compatible-flatmates" },
  { slug: "flatmate-agreement-essentials" },
  { slug: "bangalore-rental-market-guide" },
  { slug: "moving-in-with-strangers" },
  { slug: "room-inspection-checklist" },
  { slug: "flatmate-conflict-resolution" },
];

const COMPARISON_PAGES = [
  { slug: "360-flatmates-vs-nobroker" },
  { slug: "360-flatmates-vs-facebook-groups" },
  { slug: "360-flatmates-vs-housing" },
  { slug: "360-flatmates-vs-magicbricks" },
  { slug: "360-flatmates-vs-flatmate-india" },
];

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

/** Minimal XML text escaping (loc/title/attribute values). */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface UrlEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
  image?: { loc: string; title?: string };
  /** Additional image entries for image sitemap (listings may have multiple). */
  images?: { loc: string; title?: string }[];
}

function renderUrl(entry: UrlEntry): string {
  const allImages = [
    ...(entry.image ? [entry.image] : []),
    ...(entry.images ?? []),
  ];

  const imageBlock = allImages.length
    ? allImages
        .map(
          (img) => `
    <image:image>
      <image:loc>${escapeXml(img.loc)}</image:loc>${
        img.title
          ? `
      <image:title>${escapeXml(img.title)}</image:title>`
          : ""
      }
    </image:image>`,
        )
        .join("")
    : "";

  return `
  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>${imageBlock}
  </url>`;
}

// ──────────────────────────────────────────────────────────────────────────
// Generator
// ──────────────────────────────────────────────────────────────────────────

async function generateSitemap(): Promise<void> {
  const lastmod = new Date().toISOString();

  const entries: UrlEntry[] = [];

  // 1) Static public routes.
  for (const route of STATIC_ROUTES) {
    entries.push({
      loc: `${SITE_URL}${route.path}`,
      lastmod,
      changefreq: route.changefreq,
      priority: route.priority,
      image: route.image ? { loc: route.image, title: route.imageTitle } : undefined,
    });
  }

  // 2) City pages. The OG image is reused as a representative image until each
  //    city has a dedicated stable hero asset. (City hero images are currently
  //    remote Unsplash IDs, which are not stable sitemap assets.)
  for (const city of SUPPORTED_CITIES) {
    entries.push({
      loc: `${SITE_URL}/cities/${city.slug}`,
      lastmod,
      changefreq: "daily",
      priority: "0.85",
      image: { loc: OG_IMAGE, title: `Flatmates & rooms in ${city.name}` },
    });
  }

  // 3) Blog posts.
  for (const post of BLOG_POSTS) {
    entries.push({
      loc: `${SITE_URL}/blog/${post.slug}`,
      lastmod,
      changefreq: "monthly",
      priority: "0.6",
    });
  }

  // 4) Comparison pages.
  for (const comp of COMPARISON_PAGES) {
    entries.push({
      loc: `${SITE_URL}/compare/${comp.slug}`,
      lastmod,
      changefreq: "monthly",
      priority: "0.5",
    });
  }

  // 5) Neighborhood pages (`/cities/:slug/:neighborhood`). The route exists in
  //    src/App.tsx and the data is maintained in src/lib/seo/neighborhoods.ts.
  for (const city of CITY_NEIGHBORHOODS) {
    for (const n of city.neighborhoods) {
      entries.push({
        loc: `${SITE_URL}/cities/${city.citySlug}/${n.slug}`,
        lastmod,
        changefreq: "weekly",
        priority: "0.55",
      });
    }
  }

  // 6) Dynamic listing URLs (`/discover/:id`). IDs + images come
  //    from the shared build-time fetch (scripts/lib/listings.ts) so prerender
  //    renders exactly the set the sitemap advertises.
  const { listings: dynamicListings, ok: listingsOk } = await fetchDiscoverableListings();

  if (!listingsOk && process.env.SITEMAP_STRICT === "1") {
    // A failed fetch in a deploy build must not silently ship a sitemap that
    // drops every listing URL — surface it loudly instead.
    throw new Error(
      "Listing fetch failed and SITEMAP_STRICT=1 — refusing to emit a listings-less sitemap.",
    );
  }

  for (const listing of dynamicListings) {
    const listingImages = listing.images?.map((url) => ({
      loc: url,
      title: listing.title,
    }));

    // `listing.lastmod` comes from `created_at` on the public /properties
    // payload (see scripts/lib/listings.ts). If the API ever stops sending
    // created_at, we fall back to the build timestamp so the XML stays valid;
    // TODO: if/when the backend returns a dedicated `updated_at` on the
    // listing payload, plumb it through scripts/lib/listings.ts and drop the
    // fallback here.
    entries.push({
      loc: `${SITE_URL}/discover/${listing.id}`,
      lastmod: listing.lastmod ?? lastmod,
      changefreq: "daily",
      priority: "0.7",
      images: listingImages,
    });

    // TODO: blocked on ADR-001 A-9. The /share/:id route does not exist in
    // src/App.tsx yet, so emitting it in the sitemap would 404 every click.
    // Once the ShareListingPage route lands, re-enable the entry below and
    // add the same route to scripts/prerender.ts so prerender and sitemap
    // stay in sync.
    //
    // entries.push({
    //   loc: `${SITE_URL}/share/${listing.id}`,
    //   lastmod: listing.lastmod ?? lastmod,
    //   changefreq: "daily",
    //   priority: "0.6",
    //   image: listingImages?.[0] ? { loc: listingImages[0].loc, title: listing.title } : undefined,
    // });
  }

  const hasImages = entries.some(
    (e) => e.image !== undefined || (e.images && e.images.length > 0),
  );
  const imageNamespace = hasImages
    ? `\n         xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`
    : "";

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${imageNamespace}>
${entries.map(renderUrl).join("")}
</urlset>
`;

  const outputPath = resolve(process.cwd(), "public", "sitemap.xml");
  writeFileSync(outputPath, sitemap, "utf-8");
  const listingsSkipped = dynamicListings.length === 0 && !shouldFetchListingData();
  console.log(
    `Sitemap generated at ${outputPath} with ${entries.length} URLs` +
      (hasImages ? ` (image sitemap: enabled)` : "") +
      (!listingsOk
        ? ` (WARNING: listing fetch failed — listing URLs omitted)`
        : listingsSkipped
          ? ` (listing URLs omitted — CONTEXT is not "production")`
          : ""),
  );
}

generateSitemap().catch((err) => {
  console.error("Sitemap generation failed:", err);
  process.exit(1);
});
