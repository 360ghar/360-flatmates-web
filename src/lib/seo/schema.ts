import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION, SUPPORT_EMAIL, SUPPORTED_CITIES } from "./config";

/**
 * Absolute URL to the organization logo. Schema.org requires a PNG/JPG (not SVG),
 * so we reference the square brand logo at /logo.png (512×512).
 * The social preview card (/og-image.png, 1200×630) is used for og:image, not logo.
 */
export const LOGO_URL = `${SITE_URL}/logo.png`;

/** Stable @id values so other graphs can reference these nodes by reference. */
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Shared ImageObject used for Organization.logo and Article publisher logos. */
export function buildLogoImageObject(url: string = LOGO_URL) {
  return {
    "@type": "ImageObject" as const,
    url,
    width: 512,
    height: 512,
  };
}

/**
 * Organization — the company behind 360 Flatmates.
 * Logo is an absolute PNG URL (schema.org requirement); @id enables graph linking.
 * `knowsAbout` surfaces service keywords for entity understanding (GEO/LLM).
 */
export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
    image: LOGO_URL,
    description: DEFAULT_DESCRIPTION,
    email: SUPPORT_EMAIL,
    contactPoint: {
      "@type": "ContactPoint",
      email: SUPPORT_EMAIL,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
    sameAs: [
      "https://www.instagram.com/360ghar",
      "https://www.linkedin.com/company/360ghar",
      "https://twitter.com/360ghar",
    ],
    knowsAbout: [
      "Flatmate matching",
      "Roommate compatibility",
      "Verified rental listings",
      "Rental visit scheduling",
      "Flatmate compatibility scoring",
      "Rental listings in India",
      "Shared accommodation",
      "Co-living",
    ],
  };
}

/**
 * WebSite — the site itself, with a SearchAction potentialAction.
 * The target URL points at the app's real search route.
 */
export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * WebApplication — describes the product honestly (a free web app).
 * NOTE: No fabricated aggregateRating. We only emit ratings/reviews when backed
 * by a real, crawlable review system — which we do not have today.
 */
export function buildWebApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
  };
}

/**
 * Service — the matching/rental-search service offering. Optional companion to
 * Organization that makes the service offering explicit to crawlers/LLMs.
 */
export function buildServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${SITE_NAME} Flatmate Matching`,
    serviceType: "Flatmate matching and verified rental listings",
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "Country", name: "India" },
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      description: "Searching, matching, and visit scheduling are free.",
    },
  };
}

/** BreadcrumbList from a list of {name, item?}. The last crumb omits `item`. */
export function buildBreadcrumbJsonLd(items: { name: string; item?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.item ? { item: item.item } : {}),
    })),
  };
}

export function homeBreadcrumb() {
  return { name: "Home", item: SITE_URL };
}

/** Speakable — marks CSS selectors for the most important speakable content. */
export function buildSpeakableSchema(cssSelectors: string[], url: string = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": url,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: cssSelectors,
    },
    url,
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** FAQPage rich-result schema from genuine Q&A pairs. */
export function buildFaqPageSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export interface HowToStep {
  name: string;
  text: string;
}

/** HowTo schema for instructional content (e.g. "how to find flatmates"). */
export function buildHowToSchema(params: {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string;
  supply?: string[];
  tool?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: params.name,
    description: params.description,
    ...(params.totalTime ? { totalTime: params.totalTime } : {}),
    ...(params.supply?.length ? { supply: params.supply } : {}),
    ...(params.tool?.length ? { tool: params.tool } : {}),
    step: params.steps.map((step) => ({
      "@type": "HowToStep",
      name: step.name,
      text: step.text,
    })),
  };
}

export interface ArticleSchemaInput {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  url: string;
  authorName?: string;
}

/** Article (also valid as BlogPosting) with publisher referencing the Organization. */
export function buildArticleSchema(input: ArticleSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.headline,
    description: input.description,
    image: input.image,
    datePublished: input.datePublished,
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    author: {
      "@type": "Organization",
      name: input.authorName ?? SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      "@id": ORG_ID,
      name: SITE_NAME,
      logo: buildLogoImageObject(),
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.url,
    },
  };
}

/** WebPage / CollectionPage wrapper for listing hubs (City, Blog index, Discover). */
export function buildCollectionPageSchema(params: {
  name: string;
  description: string;
  url: string;
  breadcrumb?: { name: string; item?: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: params.name,
    description: params.description,
    url: params.url,
    isPartOf: { "@id": WEBSITE_ID },
    ...(params.breadcrumb?.length
      ? {
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: params.breadcrumb.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.name,
              ...(item.item ? { item: item.item } : {}),
            })),
          },
        }
      : {}),
  };
}

/**
 * Residence schema for a rental room/listing. Uses Residence (not Product) vocab
 * with an Offer carrying the rent. No aggregateRating unless backed by real reviews.
 *
 * `city` is only emitted as `addressRegion` when it matches one of
 * `SUPPORTED_CITIES` — an unrecognised city would emit an invalid region and
 * fail Google's Rich Results Test, so the address block is dropped entirely
 * when we cannot confirm the city.
 *
 * Rent is wrapped in a `UnitPriceSpecification` (per-month) so search engines
 * know the billing cadence; a bare `Offer.price` is treated as a one-time cost.
 */
export function buildResidenceSchema(params: {
  name: string;
  description: string;
  url: string;
  image?: string;
  monthlyRent: number | string;
  locality?: string;
  city?: string;
  bedrooms?: number;
  areaSqft?: number;
}) {
  const cityRecognized = params.city
    ? SUPPORTED_CITIES.some((c) => c.name === params.city)
    : false;

  const residence: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: params.name,
    description: params.description,
    url: params.url,
    offers: {
      "@type": "Offer",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: params.monthlyRent,
        priceCurrency: "INR",
        unitText: "month",
      },
      availability: "https://schema.org/InStock",
    },
  };

  if (params.image) residence.image = params.image;

  if (cityRecognized && params.city) {
    residence.address = {
      "@type": "PostalAddress",
      ...(params.locality ? { addressLocality: params.locality } : {}),
      addressRegion: params.city,
      addressCountry: "IN",
    };
  } else if (params.locality) {
    // City was not in SUPPORTED_CITIES — emit the locality only so we still
    // surface a location signal without publishing an unverified region.
    residence.address = {
      "@type": "PostalAddress",
      addressLocality: params.locality,
      addressCountry: "IN",
    };
  }

  if (params.bedrooms) residence.numberOfRooms = params.bedrooms;
  if (params.areaSqft) residence.floorSize = { "@type": "QuantitativeValue", value: params.areaSqft, unitText: "sq ft" };

  return residence;
}
