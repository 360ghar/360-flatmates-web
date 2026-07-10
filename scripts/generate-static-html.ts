/**
 * Build-time static HTML generator for the 360 Flatmates SPA.
 *
 * Replaces the Playwright-based prerender.ts. Runs AFTER `vite build`.
 * Reads the built dist/index.html as a shell template, injects per-route
 * meta tags, JSON-LD, and semantic body HTML, then writes dist/<route>/index.html.
 *
 * Listing pages (/discover/:id) are generated from API data fetched at build
 * time via the shared scripts/lib/listings.ts helper.
 *
 * No browser, no Chromium, no preview server — pure string manipulation.
 *
 * CONTRACT:
 *  - Requires `dist/index.html` to exist (run `vite build` first).
 *  - Listing fetch failures are non-fatal (logged, build continues).
 *  - Infrastructure failures (no dist/) are fatal.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildStaticRoutes, type RouteContent } from "./lib/route-content";
import { fetchDiscoverableListings, shouldFetchListingData } from "./lib/listings";
import { SITE_URL, SITE_NAME } from "../src/lib/seo/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(__dirname, "..", "dist");

/** Set GENERATE_LISTINGS=0 to skip per-listing pages (fast smoke build). */
const GENERATE_LISTINGS = process.env.PRERENDER_LISTINGS !== "0";

// ── Helpers ──────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function jsonLdBlock(schema: object): string {
  return `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c").replace(/>/g, "\\u003e")}</script>`;
}

/** Convert a route path into its destination HTML file inside dist/. */
function htmlPathForRoute(route: string): string {
  if (route === "/") return resolve(DIST_DIR, "index.html");
  const clean = route.replace(/^\/+/, "").replace(/\/+$/, "");
  return resolve(DIST_DIR, clean, "index.html");
}

// ── Shell template processing ────────────────────────────────────────────

/**
 * Read the Vite-built dist/index.html and extract the parts we need as a
 * template. Split at two points:
 *  1. `</head>` — inject per-route meta tags before it
 *  2. The matching `</div>` for `<div id="root">` — replace body content
 */
interface ShellTemplate {
  /** <!DOCTYPE html> through end of shared <head> (before </head>) */
  headPreMeta: string;
  /** </head><body>...skip link...<div id="root"> */
  bodyOpen: string;
  /** Closing </div> for #root through </html> */
  tail: string;
}

function readShellTemplate(): ShellTemplate {
  const indexPath = resolve(DIST_DIR, "index.html");
  if (!existsSync(indexPath)) {
    throw new Error(`dist/index.html not found at ${indexPath}. Run "vite build" first.`);
  }

  const html = readFileSync(indexPath, "utf-8");

  // 1) Split at </head>
  const headClose = html.indexOf("</head>");
  if (headClose === -1) throw new Error("Could not find </head> in dist/index.html");

  // 2) Find <div id="root">
  const rootOpenMatch = html.match(/<div id="root">/);
  if (!rootOpenMatch?.index) {
    throw new Error("Could not find <div id=\"root\"> in dist/index.html");
  }
  const rootOpenEnd = rootOpenMatch.index + rootOpenMatch[0].length;

  // 3) Find the matching closing </div> for #root
  let depth = 1;
  let pos = rootOpenEnd;
  while (depth > 0 && pos < html.length) {
    const nextOpen = html.indexOf("<div", pos);
    const nextClose = html.indexOf("</div>", pos);

    if (nextClose === -1) break;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      const tagEnd = html.indexOf(">", nextOpen);
      if (tagEnd !== -1 && html[tagEnd - 1] === "/") {
        pos = tagEnd + 1;
        continue;
      }
      depth++;
      pos = nextOpen + 4;
    } else {
      depth--;
      if (depth === 0) {
        const tailStart = nextClose + 6; // "</div>".length
  // Strip generic SEO meta tags from the shell's <head> — the generator
  // injects route-specific versions. Without this, every page would have
  // both the generic shell tags AND the route-specific ones.
  let headPreMeta = html.slice(0, headClose);
  headPreMeta = headPreMeta
    .replace(/<title>[^<]*<\/title>\s*/g, "")
    .replace(/<meta name="description"[^>]*>\s*/g, "")
    .replace(/<meta property="og:[^"]*"[^>]*>\s*/g, "")
    .replace(/<meta name="twitter:[^"]*"[^>]*>\s*/g, "");

  return {
    headPreMeta,
    bodyOpen: html.slice(headClose, rootOpenEnd),
    tail: html.slice(tailStart),
  };
      }
      pos = nextClose + 6;
    }
  }

  throw new Error("Could not find matching </div> for <div id=\"root\">");
}

// ── Page generation ──────────────────────────────────────────────────────

function generatePage(shell: ShellTemplate, route: RouteContent): string {
  const fullTitle = `${route.title} | ${SITE_NAME}`;
  const canonical = route.canonicalUrl ?? (route.path === "/" ? SITE_URL : `${SITE_URL}${route.path}`);
  const ogImage = route.ogImage ?? `${SITE_URL}/og-image.webp`;

  const metaTags = [
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${esc(route.description)}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:title" content="${esc(fullTitle)}" />`,
    `<meta property="og:description" content="${esc(route.description)}" />`,
    `<meta property="og:image" content="${esc(ogImage)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:site" content="@360ghar" />`,
    `<meta name="twitter:title" content="${esc(fullTitle)}" />`,
    `<meta name="twitter:description" content="${esc(route.description)}" />`,
    `<meta name="twitter:image" content="${esc(ogImage)}" />`,
  ].join("\n  ");

  const jsonLdHtml = route.jsonLd.map(jsonLdBlock).join("\n  ");

  const bodyContent = `
    <noscript>
      <div class="noscript-fallback" role="main">
        <h1>${esc(route.h1)}</h1>
        ${route.bodyHtml}
        <p style="margin-top:24px"><a class="cta" href="/discover">Browse Verified Rooms</a></p>
        <p style="margin-top:16px;font-size:12px;color:#6a6a6a">Enable JavaScript for the full interactive experience.</p>
      </div>
    </noscript>
    <main id="main">
      <h1>${esc(route.h1)}</h1>
      ${route.bodyHtml}
    </main>
  </div>
  `;

  // headPreMeta ends before </head>. shell.bodyOpen starts with </head><body>...
  // Inject meta + jsonLd between them.
  return [
    shell.headPreMeta,
    metaTags,
    jsonLdHtml,
    route.headExtra ?? "",
    shell.bodyOpen,
    bodyContent,
    shell.tail,
  ].join("\n");
}

// ── Listing page generation ──────────────────────────────────────────────

interface ListingData {
  id: string;
  title?: string;
  description?: string;
  monthly_rent?: number;
  city?: string;
  locality?: string;
  bedrooms?: number;
  area_sqft?: number;
  main_image_url?: string;
  features?: string[];
}

function generateListingPage(shell: ShellTemplate, listing: ListingData): { route: string; html: string } {
  const route = `/discover/${listing.id}`;
  const url = `${SITE_URL}${route}`;

  const title = listing.title ?? `Listing #${listing.id}`;
  const description = listing
    ? [
        title,
        listing.locality && listing.city ? `${listing.locality}, ${listing.city}` : listing.city,
        listing.monthly_rent ? `₹${listing.monthly_rent.toLocaleString("en-IN")}/mo` : undefined,
        listing.bedrooms ? `${listing.bedrooms} BHK` : undefined,
        listing.area_sqft ? `${listing.area_sqft} sq ft` : undefined,
      ]
        .filter(Boolean)
        .join(", ") + ". Verified listing on 360 Flatmates."
    : "View verified room and flatmate listings on 360 Flatmates.";

  let bodyHtml = `<p>${esc(description)}</p>\n`;
  if (listing.monthly_rent) {
    bodyHtml += `<p><strong>Rent:</strong> ₹${listing.monthly_rent.toLocaleString("en-IN")}/month</p>\n`;
  }
  if (listing.bedrooms) {
    bodyHtml += `<p><strong>Configuration:</strong> ${listing.bedrooms} BHK</p>\n`;
  }
  if (listing.area_sqft) {
    bodyHtml += `<p><strong>Area:</strong> ${listing.area_sqft} sq ft</p>\n`;
  }
  if (listing.locality || listing.city) {
    bodyHtml += `<p><strong>Location:</strong> ${[listing.locality, listing.city].filter(Boolean).join(", ")}</p>\n`;
  }
  if (listing.features?.length) {
    bodyHtml += `<h2>Features</h2>\n<ul>\n`;
    for (const f of listing.features) {
      bodyHtml += `  <li>${esc(f)}</li>\n`;
    }
    bodyHtml += `</ul>\n`;
  }
  bodyHtml += `<p><a href="/discover">← Back to all listings</a></p>\n`;

  // Residence JSON-LD
  const residenceSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: title,
    description,
    url,
    offers: {
      "@type": "Offer",
      priceSpecification: listing.monthly_rent
        ? { "@type": "UnitPriceSpecification", price: listing.monthly_rent, priceCurrency: "INR", unitText: "month" }
        : undefined,
      availability: "https://schema.org/InStock",
    },
  };
  if (listing.main_image_url) residenceSchema.image = listing.main_image_url;
  if (listing.locality || listing.city) {
    residenceSchema.address = {
      "@type": "PostalAddress",
      ...(listing.locality ? { addressLocality: listing.locality } : {}),
      ...(listing.city ? { addressRegion: listing.city } : {}),
      addressCountry: "IN",
    };
  }
  if (listing.bedrooms) residenceSchema.numberOfRooms = listing.bedrooms;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Discover", item: `${SITE_URL}/discover` },
      { "@type": "ListItem", position: 3, name: title },
    ],
  };

  const routeContent: RouteContent = {
    path: route,
    title,
    description,
    h1: title,
    bodyHtml,
    jsonLd: [residenceSchema, breadcrumbLd],
    ogImage: listing.main_image_url,
  };

  return { route, html: generatePage(shell, routeContent) };
}

// ── Share page generation ────────────────────────────────────────────────

function generateSharePage(shell: ShellTemplate, listing: ListingData): { route: string; html: string } {
  const route = `/share/${listing.id}`;
  const discoverRoute = `/discover/${listing.id}`;
  const url = `${SITE_URL}${discoverRoute}`;

  const title = listing.title ?? `Listing #${listing.id}`;
  const description = listing
    ? [
        title,
        listing.locality && listing.city ? `${listing.locality}, ${listing.city}` : listing.city,
        listing.monthly_rent ? `₹${listing.monthly_rent.toLocaleString("en-IN")}/mo` : undefined,
        listing.bedrooms ? `${listing.bedrooms} BHK` : undefined,
        listing.area_sqft ? `${listing.area_sqft} sq ft` : undefined,
      ]
        .filter(Boolean)
        .join(", ") + ". Verified listing on 360 Flatmates."
    : "View verified room and flatmate listings on 360 Flatmates.";

  let bodyHtml = `<p>${esc(description)}</p>\n`;
  bodyHtml += `<p><a href="${discoverRoute}">View listing</a></p>\n`;

  const residenceSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: title,
    description,
    url,
    offers: {
      "@type": "Offer",
      priceSpecification: listing.monthly_rent
        ? { "@type": "UnitPriceSpecification", price: listing.monthly_rent, priceCurrency: "INR", unitText: "month" }
        : undefined,
      availability: "https://schema.org/InStock",
    },
  };
  if (listing.main_image_url) residenceSchema.image = listing.main_image_url;
  if (listing.locality || listing.city) {
    residenceSchema.address = {
      "@type": "PostalAddress",
      ...(listing.locality ? { addressLocality: listing.locality } : {}),
      ...(listing.city ? { addressRegion: listing.city } : {}),
      addressCountry: "IN",
    };
  }
  if (listing.bedrooms) residenceSchema.numberOfRooms = listing.bedrooms;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Discover", item: `${SITE_URL}/discover` },
      { "@type": "ListItem", position: 3, name: title, item: url },
    ],
  };

  const routeContent: RouteContent = {
    path: route,
    title,
    description,
    h1: title,
    bodyHtml,
    jsonLd: [residenceSchema, breadcrumbLd],
    ogImage: listing.main_image_url,
    canonicalUrl: url,
    headExtra: `<meta http-equiv="refresh" content="0; url=${discoverRoute}" />`,
  };

  return { route, html: generatePage(shell, routeContent) };
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!existsSync(DIST_DIR)) {
    throw new Error(`dist/ not found at ${DIST_DIR}. Run "vite build" before generating static HTML.`);
  }

  const shell = readShellTemplate();
  console.log("[static-html] Shell template parsed.");

  // 1) Static routes from route-content.ts
  const staticRoutes = buildStaticRoutes();
  console.log(`[static-html] ${staticRoutes.length} static routes defined.`);

  // 2) Listing routes from API. The shared helper already gates the fetch on
  //    CONTEXT=production (see scripts/lib/listings.ts), so non-production
  //    builds (local + Netlify deploy-preview / branch-deploy) skip every
  //    listing call entirely and the SPA fallback handles deep listing links
  //    client-side at runtime.
  const listingRoutes: { route: string; html: string }[] = [];
  const shareRoutes: { route: string; html: string }[] = [];
  if (!GENERATE_LISTINGS) {
    console.log("[static-html] Listing generation disabled via PRERENDER_LISTINGS=0.");
  } else if (!shouldFetchListingData()) {
    console.log(
      "[static-html] Per-listing pages skipped — CONTEXT is not \"production\".",
    );
  } else {
    const { listings, ok } = await fetchDiscoverableListings();
    if (!ok) {
      console.warn("[static-html] Listing fetch failed — skipping listing pages.");
    } else if (listings.length === 0) {
      console.log("[static-html] No listings found.");
    } else {
      // Fetch full listing data for each listing. We use the same API that
      // the frontend uses. For the static generator, we only need the basic
      // fields — the frontend fetches the rest client-side.
      const LISTING_API = process.env.SITEMAP_API_BASE_URL ?? "https://api.360ghar.com/api/v1";
      const apiToken = process.env.SITEMAP_API_TOKEN;

      let fetched = 0;
      let failed = 0;

      for (const l of listings) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8_000);

          const headers: HeadersInit = { Accept: "application/json" };
          if (apiToken) headers["Authorization"] = `Bearer ${apiToken}`;

          const res = await fetch(`${LISTING_API}/properties/${l.id}`, { headers, signal: controller.signal });
          clearTimeout(timeout);

          if (!res.ok) {
            failed++;
            continue;
          }

          const data = (await res.json()) as { property?: ListingData } & ListingData;
          const property = data.property ?? data;
          const listingData: ListingData = {
            id: l.id,
            title: property.title ?? l.title,
            description: property.description,
            monthly_rent: property.monthly_rent,
            city: property.city,
            locality: property.locality,
            bedrooms: property.bedrooms,
            area_sqft: property.area_sqft,
            main_image_url: property.main_image_url ?? l.images?.[0],
            features: property.features,
          };
          listingRoutes.push(generateListingPage(shell, listingData));
          shareRoutes.push(generateSharePage(shell, listingData));
          fetched++;
        } catch {
          failed++;
        }

        // Rate limit
        if (fetched % 20 === 0) {
          await new Promise((r) => setTimeout(r, 100));
        }
      }

      console.log(`[static-html] Listings: ${fetched} fetched, ${failed} failed.`);
    }
  }

  // 3) Generate and write all pages
  const allRoutes = [
    ...staticRoutes.map((r) => ({ route: r.path, html: generatePage(shell, r) })),
    ...listingRoutes,
    ...shareRoutes,
  ];

  // Write non-home routes first, home last (so dist/index.html is overwritten last)
  const ordered = [...allRoutes].sort((a, b) => {
    if (a.route === "/" && b.route !== "/") return 1;
    if (b.route === "/" && a.route !== "/") return -1;
    return 0;
  });

  let written = 0;
  for (const { route, html } of ordered) {
    const outPath = htmlPathForRoute(route);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html, "utf-8");
    written++;
  }

  console.log(`[static-html] Done: ${written} pages written to dist/.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[static-html] fatal:", err);
    process.exit(1);
  });
