/**
 * Static HTML content for each public route, used by the build-time static
 * HTML generator to produce crawler-friendly pages without a browser.
 *
 * Each route gets:
 *  - title / description for <title> and <meta name="description">
 *  - h1 for the page heading
 *  - bodyHtml: semantic HTML (headings, paragraphs, lists, links)
 *  - jsonLd: structured data schemas
 *  - ogImage: optional OG image URL
 *
 * The content here mirrors the React components' output but as plain HTML —
 * no React, no Tailwind, no JS. This is what crawlers and no-JS users see.
 */

import { SITE_URL, SITE_NAME, SITE_TAGLINE, DEFAULT_DESCRIPTION, SUPPORTED_CITIES } from "../../src/lib/seo/config";
import { CITY_NEIGHBORHOODS } from "../../src/lib/seo/neighborhoods";
import { BLOG_POSTS, BLOG_POST_SLUGS } from "./blog-content";
import type { BlogPost } from "./blog-content";

// ── Helpers ──────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function jsonLdBlock(schema: object): string {
  return `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c").replace(/>/g, "\\u003e")}</script>`;
}

function orgSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: DEFAULT_DESCRIPTION,
  };
}

function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

function webAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  };
}

function breadcrumbSchema(items: { name: string; item?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.item ? { item: item.item } : {}),
    })),
  };
}

function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

function collectionPageSchema(params: { name: string; description: string; url: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: params.name,
    description: params.description,
    url: params.url,
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
}

function articleSchema(post: BlogPost, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    datePublished: post.publishDate,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png`, width: 512, height: 512 },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

function serviceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${SITE_NAME} Flatmate Matching`,
    serviceType: "Flatmate matching and verified rental listings",
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: { "@type": "Country", name: "India" },
    url: SITE_URL,
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  };
}

// ── Route Content ────────────────────────────────────────────────────────

export interface RouteContent {
  path: string;
  title: string;
  description: string;
  h1: string;
  bodyHtml: string;
  jsonLd: object[];
  ogImage?: string;
}

// ── Blog post content to HTML ────────────────────────────────────────────

function blogPostToHtml(post: BlogPost): string {
  const lines = post.content.split("\n").filter(Boolean);
  let html = "";
  for (const line of lines) {
    if (line.startsWith("## ")) {
      html += `<h2>${esc(line.replace("## ", ""))}</h2>\n`;
    } else if (line.startsWith("### ")) {
      html += `<h3>${esc(line.replace("### ", ""))}</h3>\n`;
    } else if (line.startsWith("- **")) {
      const m = line.match(/- \*\*(.+?)\*\*:?\s+(.+)/);
      if (m) {
        html += `<li><strong>${esc(m[1])}</strong>: ${esc(m[2])}</li>\n`;
      }
    } else if (line.startsWith("- ")) {
      html += `<li>${esc(line.replace("- ", ""))}</li>\n`;
    } else if (line.match(/^\d+\.\s\*\*/)) {
      const m = line.match(/\d+\.\s\*\*(.+?)\*\*:?\s+(.+)/);
      if (m) {
        html += `<li><strong>${esc(m[1])}</strong>: ${esc(m[2])}</li>\n`;
      }
    } else {
      html += `<p>${esc(line)}</p>\n`;
    }
  }
  return html;
}

// ── Comparison data ──────────────────────────────────────────────────────

interface ComparisonDef {
  slug: string;
  title: string;
  description: string;
  theirName: string;
  features: { name: string; us: boolean; them: boolean; note?: string }[];
  faqs: { question: string; answer: string }[];
}

const COMPARISONS: ComparisonDef[] = [
  {
    slug: "360-flatmates-vs-nobroker",
    title: "360 Flatmates vs NoBroker: Which is Better for Finding Flatmates?",
    description: "Compare 360 Flatmates and NoBroker for flatmate matching, listing quality, and safety features.",
    theirName: "NoBroker",
    features: [
      { name: "Compatibility-based matching", us: true, them: false },
      { name: "Phone-verified users", us: true, them: true },
      { name: "Listing verification", us: true, them: true },
      { name: "Society vibe tags", us: true, them: false },
      { name: "In-app chat with context", us: true, them: false },
      { name: "Visit scheduling", us: true, them: true },
      { name: "Free to use", us: true, them: false, note: "NoBroker charges brokerage" },
      { name: "Flatmate-focused platform", us: true, them: false },
    ],
    faqs: [
      { question: "Is 360 Flatmates better than NoBroker for finding flatmates?", answer: "360 Flatmates is built specifically for flatmate matching with 6-dimension compatibility scoring, verified listings, and in-app chat. NoBroker is more general-purpose." },
      { question: "Is 360 Flatmates free compared to NoBroker?", answer: "Searching, matching, and visit scheduling on 360 Flatmates are completely free. NoBroker charges brokerage fees." },
    ],
  },
  {
    slug: "360-flatmates-vs-facebook-groups",
    title: "360 Flatmates vs Facebook Groups: Safer Flatmate Matching",
    description: "See why 360 Flatmates is safer and more effective than Facebook groups for finding flatmates.",
    theirName: "Facebook Groups",
    features: [
      { name: "Verified listings", us: true, them: false },
      { name: "Phone verification", us: true, them: false },
      { name: "Compatibility scoring", us: true, them: false },
      { name: "Structured profiles", us: true, them: false },
      { name: "In-app messaging", us: true, them: true },
      { name: "Report & moderation", us: true, them: false },
      { name: "Search filters", us: true, them: false },
      { name: "Visit scheduling", us: true, them: false },
    ],
    faqs: [
      { question: "Is 360 Flatmates better than Facebook Groups for finding flatmates?", answer: "360 Flatmates offers verified listings, phone verification, compatibility scoring, and structured profiles — none of which Facebook Groups provide." },
      { question: "Is 360 Flatmates safer than Facebook Groups?", answer: "Yes. 360 Flatmates phone-verifies every user and reviews listings before they go live, reducing scams and fake profiles." },
    ],
  },
  {
    slug: "360-flatmates-vs-housing",
    title: "360 Flatmates vs Housing.com: Which is Better for Finding Flatmates?",
    description: "Compare 360 Flatmates and Housing.com for flatmate matching, compatibility scoring, and listing quality.",
    theirName: "Housing.com",
    features: [
      { name: "Compatibility-based matching", us: true, them: false },
      { name: "Phone-verified users", us: true, them: true },
      { name: "Listing verification", us: true, them: true },
      { name: "Society vibe tags", us: true, them: false },
      { name: "In-app chat with context", us: true, them: true },
      { name: "Visit scheduling", us: true, them: true },
      { name: "Free to use", us: true, them: false, note: "Housing.com charges for premium" },
      { name: "Flatmate-focused platform", us: true, them: false },
    ],
    faqs: [
      { question: "Is 360 Flatmates better than Housing.com for finding flatmates?", answer: "360 Flatmates is purpose-built for flatmate matching with 6-dimension compatibility scoring. Housing.com is property-focused." },
      { question: "How does pricing compare?", answer: "360 Flatmates is completely free. Housing.com charges for premium features." },
    ],
  },
  {
    slug: "360-flatmates-vs-magicbricks",
    title: "360 Flatmates vs MagicBricks: Which is Better for Finding Flatmates?",
    description: "Compare 360 Flatmates and MagicBricks for flatmate matching, listing quality, and user experience.",
    theirName: "MagicBricks",
    features: [
      { name: "Compatibility-based matching", us: true, them: false },
      { name: "Phone-verified users", us: true, them: true },
      { name: "Listing verification", us: true, them: true },
      { name: "Society vibe tags", us: true, them: false },
      { name: "In-app chat with context", us: true, them: false },
      { name: "Visit scheduling", us: true, them: false },
      { name: "Free to use", us: true, them: false, note: "MagicBricks charges for owner plans" },
      { name: "Flatmate-focused platform", us: true, them: false },
    ],
    faqs: [
      { question: "Is 360 Flatmates better than MagicBricks for finding flatmates?", answer: "360 Flatmates is designed specifically for flatmate matching. MagicBricks is a general property portal." },
      { question: "How does pricing compare?", answer: "360 Flatmates is free for all core features. MagicBricks operates a freemium model." },
    ],
  },
  {
    slug: "360-flatmates-vs-flatmate-india",
    title: "360 Flatmates vs FlatMate India: Which is Better for Finding Flatmates?",
    description: "Compare 360 Flatmates and FlatMate India for flatmate matching, safety features, and overall experience.",
    theirName: "FlatMate India",
    features: [
      { name: "Compatibility-based matching", us: true, them: false },
      { name: "Phone-verified users", us: true, them: true },
      { name: "Listing verification", us: true, them: false },
      { name: "Society vibe tags", us: true, them: false },
      { name: "In-app chat with context", us: true, them: false },
      { name: "Visit scheduling", us: true, them: false },
      { name: "Free to use", us: true, them: true },
      { name: "Flatmate-focused platform", us: true, them: true },
    ],
    faqs: [
      { question: "Is 360 Flatmates better than FlatMate India?", answer: "Both focus on flatmate matching, but 360 Flatmates offers 6-dimension compatibility scoring, society vibe tags, and verified listings." },
      { question: "How does pricing compare?", answer: "Both platforms are free for core features. 360 Flatmates keeps all matching, scheduling, and chat free." },
    ],
  },
];

function comparisonToHtml(comp: ComparisonDef): string {
  let html = `<p>${esc(comp.description)}</p>\n`;
  html += `<table>\n<thead><tr><th>Feature</th><th>360 Flatmates</th><th>${esc(comp.theirName)}</th></tr></thead>\n<tbody>\n`;
  for (const f of comp.features) {
    html += `<tr><td>${esc(f.name)}${f.note ? ` <small>(${esc(f.note)})</small>` : ""}</td>`;
    html += `<td>${f.us ? "Yes" : "No"}</td><td>${f.them ? "Yes" : "No"}</td></tr>\n`;
  }
  html += `</tbody>\n</table>\n`;
  return html;
}

// ── Build all routes ─────────────────────────────────────────────────────

export function buildStaticRoutes(): RouteContent[] {
  const routes: RouteContent[] = [];

  // ── Home ───────────────────────────────────────────────────────────────
  routes.push({
    path: "/",
    title: "Find Compatible Flatmates & Verified Rooms Across India",
    description: "Find compatible flatmates and verified rental listings across India. 6-dimension compatibility matching, society vibe tags, visit scheduling, and in-app chat for better living.",
    h1: "Find Compatible Flatmates & Verified Rooms Across India",
    bodyHtml: `
      <p>360 Flatmates is an India-first flatmate and room-rental platform that matches people on a 6-dimension compatibility score, society vibe tags, budget, and lifestyle — then handles visit scheduling, in-app chat, and verified listings.</p>
      <h2>How It Works</h2>
      <ol>
        <li><strong>Tell us your vibe</strong> — budget, location, and the stuff that actually matters, like whether you're a night owl or a 6 AM gym person.</li>
        <li><strong>Get matched</strong> — our engine finds flatmates and rooms that fit how you actually live. Not just where. How.</li>
        <li><strong>Move in</strong> — book a visit, chat with context, sign up. Welcome home.</li>
      </ol>
      <h2>Why 360 Flatmates?</h2>
      <ul>
        <li><strong>6-dimension compatibility scoring</strong> — sleep, cleanliness, food, guests, work, and lifestyle</li>
        <li><strong>Verified listings</strong> — every room is reviewed before it goes live. Real photos, real rent, real availability.</li>
        <li><strong>Book visits in 2 taps</strong> — no WhatsApp ping-pong. Pick a slot, show up, done.</li>
        <li><strong>Chat that starts with context</strong> — every chat already carries the listing, the match score, and visit details.</li>
        <li><strong>Safety built in</strong> — phone OTP, profile checks, and in-app reporting.</li>
      </ul>
      <h2>Find Your Room or Flatmate</h2>
      <ul>
        <li><a href="/discover">Browse all verified listings</a></li>
        <li><a href="/cities/bangalore">Flats &amp; flatmates in Bangalore</a></li>
        <li><a href="/cities/gurugram">Flats &amp; flatmates in Gurugram</a></li>
      </ul>
      <h2>Guides &amp; Resources</h2>
      <ul>
        <li><a href="/blog/how-to-find-compatible-flatmates">How to Find Compatible Flatmates</a></li>
        <li><a href="/blog/flatmate-agreement-essentials">The Essential Flatmate Agreement Checklist</a></li>
        <li><a href="/blog/bangalore-rental-market-guide">Bangalore Rental Market Guide 2025</a></li>
        <li><a href="/blog">All guides</a></li>
      </ul>
      <h2>Frequently Asked Questions</h2>
      <details><summary>How do you actually match people?</summary><p>We compare 6 lifestyle dimensions (sleep schedule, cleanliness, food habits, guests policy, work style, and general vibe) alongside budget and location.</p></details>
      <details><summary>Are the listings legit?</summary><p>Every listing gets reviewed before it goes live. Real photos, real rent, real availability.</p></details>
      <details><summary>Is it free?</summary><p>Searching and matching is 100% free. Optional paid plans exist for priority listings.</p></details>
      <details><summary>Which cities are you in?</summary><p>We're live in Gurugram and Bangalore right now, with more cities dropping every month.</p></details>
    `,
    jsonLd: [
      orgSchema(),
      webSiteSchema(),
      webAppSchema(),
      serviceSchema(),
      faqSchema([
        { question: "How do you actually match people?", answer: "We compare 6 lifestyle dimensions alongside budget and location." },
        { question: "Are the listings legit?", answer: "Every listing gets reviewed before it goes live. Real photos, real rent, real availability." },
        { question: "Is it free?", answer: "Searching and matching is 100% free." },
        { question: "Which cities are you in?", answer: "We're live in Gurugram and Bangalore right now." },
      ]),
    ],
    ogImage: `${SITE_URL}/og-image.png`,
  });

  // ── Discover ───────────────────────────────────────────────────────────
  routes.push({
    path: "/discover",
    title: "Discover Verified Rooms & Flatmates",
    description: "Browse verified room and flatmate listings across Indian cities with compatibility scores, society vibe tags, and visit scheduling.",
    h1: "Discover Verified Rooms & Flatmates",
    bodyHtml: `
      <p>Browse verified room and flatmate listings across Indian cities. Every listing is reviewed before going live — real photos, real rent, real availability.</p>
      <h2>Browse by City</h2>
      <ul>
        <li><a href="/cities/bangalore">Bangalore — 1,200+ listings</a></li>
        <li><a href="/cities/gurugram">Gurugram — 860+ listings</a></li>
      </ul>
      <p><a href="/discover">Browse all listings →</a></p>
    `,
    jsonLd: [
      collectionPageSchema({
        name: "Discover Verified Rooms & Flatmates",
        description: "Browse verified room and flatmate listings across Indian cities.",
        url: `${SITE_URL}/discover`,
      }),
      breadcrumbSchema([{ name: "Home", item: SITE_URL }, { name: "Discover" }]),
    ],
  });

  // ── About ──────────────────────────────────────────────────────────────
  routes.push({
    path: "/about",
    title: "About 360 Flatmates",
    description: "360 Flatmates is an India-first platform for finding compatible flatmates and verified rental rooms. Learn about our mission and values.",
    h1: "About 360 Flatmates",
    bodyHtml: `
      <p>360 Flatmates is an India-first platform that matches flatmates on lifestyle compatibility, not just budget and location. We believe a compatible flatmate can make your living experience enjoyable, while an incompatible one can turn your home into a source of daily stress.</p>
      <h2>Our Values</h2>
      <ul>
        <li><strong>Compatibility over convenience</strong> — a cheap room with the wrong flatmate costs more than rent.</li>
        <li><strong>Verified, always</strong> — every listing is reviewed, every user is phone-verified.</li>
        <li><strong>Safety as default</strong> — in-app chat, scheduled visits, and reporting tools. Your phone number stays private.</li>
        <li><strong>Context-rich decisions</strong> — compatibility scores, society vibe tags, and visit scheduling built into the flow.</li>
      </ul>
      <h2>The Team</h2>
      <p>We're a small team based in India, building the platform we wish existed when we were looking for flatmates.</p>
      <p><a href="/discover">Browse verified listings</a> · <a href="/blog">Read our guides</a></p>
    `,
    jsonLd: [
      orgSchema(),
      breadcrumbSchema([{ name: "Home", item: SITE_URL }, { name: "About" }]),
    ],
  });

  // ── Stats ──────────────────────────────────────────────────────────────
  routes.push({
    path: "/stats",
    title: "360 Flatmates — Platform Stats",
    description: "Real numbers from the 360 Flatmates platform: matches made, verified rooms, average match scores, and cities served.",
    h1: "Platform Stats",
    bodyHtml: `
      <p>Real numbers from the 360 Flatmates platform.</p>
      <ul>
        <li><strong>8,600+</strong> matches made</li>
        <li><strong>1,800+</strong> verified rooms</li>
        <li><strong>86%</strong> average match score</li>
        <li><strong>2</strong> cities live (Bangalore &amp; Gurugram)</li>
      </ul>
      <p><a href="/discover">Browse verified listings</a></p>
    `,
    jsonLd: [breadcrumbSchema([{ name: "Home", item: SITE_URL }, { name: "Stats" }])],
  });

  // ── Terms ──────────────────────────────────────────────────────────────
  routes.push({
    path: "/terms",
    title: "Terms of Service",
    description: "360 Flatmates terms of service. Read our terms governing use of the platform.",
    h1: "Terms of Service",
    bodyHtml: `<p>Please read these terms carefully before using the 360 Flatmates platform. By accessing or using our service, you agree to be bound by these terms.</p><p>For the full terms of service, please visit <a href="/terms">360ghar.com/terms</a> with JavaScript enabled.</p>`,
    jsonLd: [breadcrumbSchema([{ name: "Home", item: SITE_URL }, { name: "Terms" }])],
  });

  // ── Privacy ────────────────────────────────────────────────────────────
  routes.push({
    path: "/privacy",
    title: "Privacy Policy",
    description: "360 Flatmates privacy policy. Learn how we collect, use, and protect your personal information.",
    h1: "Privacy Policy",
    bodyHtml: `<p>Your privacy is important to us. This policy describes how 360 Flatmates collects, uses, and protects your personal information.</p><p>For the full privacy policy, please visit <a href="/privacy">360ghar.com/privacy</a> with JavaScript enabled.</p>`,
    jsonLd: [breadcrumbSchema([{ name: "Home", item: SITE_URL }, { name: "Privacy" }])],
  });

  // ── Blog index ─────────────────────────────────────────────────────────
  const blogListHtml = BLOG_POST_SLUGS.map((slug) => {
    const post = BLOG_POSTS[slug];
    return `<li><a href="/blog/${esc(slug)}">${esc(post.title)}</a> — ${esc(post.excerpt)} <small>(${esc(post.readTime)})</small></li>`;
  }).join("\n");

  routes.push({
    path: "/blog",
    title: "Blog — Guides for Better Flatmate Living",
    description: "Guides, tips, and market insights for finding and living with flatmates. From compatibility scoring to rental market guides.",
    h1: "Blog — Guides for Better Flatmate Living",
    bodyHtml: `<p>Guides, tips, and market insights for finding and living with flatmates.</p><ul>${blogListHtml}</ul>`,
    jsonLd: [
      collectionPageSchema({
        name: "360 Flatmates Blog",
        description: "Guides, tips, and market insights for flatmate living.",
        url: `${SITE_URL}/blog`,
      }),
    ],
  });

  // ── Blog posts ─────────────────────────────────────────────────────────
  for (const slug of BLOG_POST_SLUGS) {
    const post = BLOG_POSTS[slug];
    const url = `${SITE_URL}/blog/${slug}`;
    routes.push({
      path: `/blog/${slug}`,
      title: post.title,
      description: post.excerpt,
      h1: post.title,
      bodyHtml: blogPostToHtml(post),
      jsonLd: [
        articleSchema(post, url),
        breadcrumbSchema([{ name: "Home", item: SITE_URL }, { name: "Blog", item: `${SITE_URL}/blog` }, { name: post.title }]),
      ],
      ogImage: post.image,
    });
  }

  // ── Comparison pages ───────────────────────────────────────────────────
  for (const comp of COMPARISONS) {
    const url = `${SITE_URL}/compare/${comp.slug}`;
    routes.push({
      path: `/compare/${comp.slug}`,
      title: comp.title,
      description: comp.description,
      h1: comp.title,
      bodyHtml: comparisonToHtml(comp),
      jsonLd: [
        faqSchema(comp.faqs),
        breadcrumbSchema([{ name: "Home", item: SITE_URL }, { name: "Compare", item: `${SITE_URL}/compare` }, { name: `360 Flatmates vs ${comp.theirName}` }]),
      ],
    });
  }

  // ── City pages ─────────────────────────────────────────────────────────
  for (const city of SUPPORTED_CITIES) {
    const cityUrl = `${SITE_URL}/cities/${city.slug}`;
    const neighborhoods = CITY_NEIGHBORHOODS.find((c) => c.citySlug === city.slug)?.neighborhoods ?? [];
    const hoodListHtml = neighborhoods.map((n) => `<li><a href="/cities/${city.slug}/${n.slug}">${esc(n.name)}</a> — ${esc(n.blurb)}</li>`).join("\n");

    routes.push({
      path: `/cities/${city.slug}`,
      title: `Flats & Flatmates in ${city.name}`,
      description: `Find verified rooms and compatible flatmates in ${city.name}. Browse listings with compatibility scores, society vibe tags, and visit scheduling.`,
      h1: `Flats & Flatmates in ${city.name}`,
      bodyHtml: `
        <p>Find verified rooms and compatible flatmates in ${esc(city.name)}, ${esc(city.state)}. Browse listings with compatibility scores, society vibe tags, and visit scheduling.</p>
        <h2>Popular Neighborhoods</h2>
        <ul>${hoodListHtml}</ul>
        <p><a href="/discover">Browse all ${esc(city.name)} listings →</a></p>
      `,
      jsonLd: [
        collectionPageSchema({
          name: `Flats & Flatmates in ${city.name}`,
          description: `Verified rooms and compatible flatmates in ${city.name}.`,
          url: cityUrl,
        }),
        breadcrumbSchema([{ name: "Home", item: SITE_URL }, { name: city.name }]),
      ],
    });

    // ── Neighborhood pages ───────────────────────────────────────────────
    for (const hood of neighborhoods) {
      const hoodUrl = `${SITE_URL}/cities/${city.slug}/${hood.slug}`;
      routes.push({
        path: `/cities/${city.slug}/${hood.slug}`,
        title: `Flats & Flatmates in ${hood.name}, ${city.name}`,
        description: `Find verified rooms and compatible flatmates in ${hood.name}, ${city.name}. ${hood.blurb}`,
        h1: `Flats & Flatmates in ${hood.name}`,
        bodyHtml: `
          <p>${esc(hood.blurb)}</p>
          <p>Find verified rooms and compatible flatmates in ${esc(hood.name)}, ${esc(city.name)}. Browse listings with compatibility scores and visit scheduling.</p>
          <p><a href="/cities/${city.slug}">← Back to ${esc(city.name)}</a> · <a href="/discover">Browse all listings</a></p>
        `,
        jsonLd: [
          collectionPageSchema({
            name: `Flats & Flatmates in ${hood.name}, ${city.name}`,
            description: hood.blurb,
            url: hoodUrl,
          }),
          breadcrumbSchema([
            { name: "Home", item: SITE_URL },
            { name: city.name, item: cityUrl },
            { name: hood.name },
          ]),
        ],
      });
    }
  }

  return routes;
}
