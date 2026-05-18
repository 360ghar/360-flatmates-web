import { writeFileSync } from "fs";
import { resolve } from "path";

const SITE_URL = "https://360ghar.com";

const STATIC_ROUTES = [
  { path: "/", changefreq: "daily", priority: 1.0 },
  { path: "/discover", changefreq: "hourly", priority: 0.9 },
  { path: "/search", changefreq: "daily", priority: 0.8 },
  { path: "/search/semantic", changefreq: "weekly", priority: 0.7 },
  { path: "/stats", changefreq: "weekly", priority: 0.6 },
  { path: "/about", changefreq: "monthly", priority: 0.5 },
  { path: "/terms", changefreq: "monthly", priority: 0.3 },
  { path: "/privacy", changefreq: "monthly", priority: 0.3 },
  { path: "/blog", changefreq: "weekly", priority: 0.7 },
];

const CITIES = [
  { slug: "bangalore", name: "Bangalore" },
  { slug: "gurugram", name: "Gurugram" },
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
];

function generateSitemap() {
  const now = new Date().toISOString();

  let urls = STATIC_ROUTES.map(
    (route) => `
  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  ).join("");

  for (const city of CITIES) {
    urls += `
  <url>
    <loc>${SITE_URL}/cities/${city.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>`;
  }

  for (const post of BLOG_POSTS) {
    urls += `
  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }

  for (const comp of COMPARISON_PAGES) {
    urls += `
  <url>
    <loc>${SITE_URL}/compare/${comp.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  const outputPath = resolve(process.cwd(), "public", "sitemap.xml");
  writeFileSync(outputPath, sitemap, "utf-8");
  console.log(`Sitemap generated at ${outputPath} with ${STATIC_ROUTES.length + CITIES.length + BLOG_POSTS.length + COMPARISON_PAGES.length} URLs`);
}

generateSitemap();
