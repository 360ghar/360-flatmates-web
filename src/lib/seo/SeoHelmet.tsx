import { Helmet } from "react-helmet-async";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  TWITTER_HANDLE,
} from "./config";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildWebApplicationSchema,
  buildBreadcrumbJsonLd,
  homeBreadcrumb,
} from "./schema";

interface SeoHelmetProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  /**
   * Declarative JSON-LD: pass one schema object or an array. Rendered as
   * `<script type="application/ld+json">` blocks. Prefer this over `children`
   * for structured data. Objects are passed through verbatim.
   */
  jsonLd?: object | object[];
  /**
   * Optional breadcrumb trail. When provided, a BreadcrumbList is auto-built
   * and emitted (the Home crumb is prepended automatically if not present).
   */
  breadcrumb?: { name: string; item?: string }[];
  /** Escape hatch for arbitrary Helmet children (backward compatibility). */
  children?: React.ReactNode;
}

/**
 * Serialize a JSON-LD object for safe embedding inside a <script> tag.
 *
 * `JSON.stringify` alone is NOT safe here: a string value containing the
 * literal `</script>` would terminate the script element early and the rest
 * would be parsed as live HTML — a stored-XSS vector when the schema carries
 * user-generated content (e.g. listing title/description in the Residence
 * schema on listing detail pages). It also leaves U+2028/U+2029 (valid JSON,
 * invalid in JS string literals) unescaped. Replace `<`, `>`, and the two line
 * separators so the payload survives both HTML and JS parsing.
 */
function safeJsonLd(schema: object): string {
  return JSON.stringify(schema)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function renderJsonLd(schemas: object[]) {
  return schemas.map((schema, i) => (
    <script
      key={`jsonld-${i}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  ));
}

export function SeoHelmet({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = "website",
  noindex = false,
  jsonLd,
  breadcrumb,
  children,
}: SeoHelmetProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME}: ${SITE_TAGLINE}`;
  const metaDescription = description ?? DEFAULT_DESCRIPTION;
  const canonical = canonicalUrl ?? SITE_URL;
  const image = ogImage ?? DEFAULT_OG_IMAGE;
  const ogImageAlt = ogImage
    ? `Preview image for ${title ?? SITE_NAME}`
    : `${SITE_NAME} | ${SITE_TAGLINE}`;

  const organizationSchema = buildOrganizationSchema();
  const webSiteSchema = buildWebSiteSchema();
  const softwareSchema = buildWebApplicationSchema();
  const isHomepage = canonical === SITE_URL || canonical === `${SITE_URL}/`;

  // Assemble JSON-LD: breadcrumb (if any) + declarative jsonLd.
  const declarativeSchemas: object[] = [];
  if (breadcrumb?.length) {
    // Prepend Home crumb unless the first crumb is already Home.
    const crumbs =
      breadcrumb[0]?.name === "Home" ? breadcrumb : [homeBreadcrumb(), ...breadcrumb];
    declarativeSchemas.push(buildBreadcrumbJsonLd(crumbs));
  }
  if (jsonLd) {
    declarativeSchemas.push(...(Array.isArray(jsonLd) ? jsonLd : [jsonLd]));
  }

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <link rel="canonical" href={canonical} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={image} />

      {isHomepage && renderJsonLd([organizationSchema, webSiteSchema, softwareSchema])}

      {declarativeSchemas.length > 0 && renderJsonLd(declarativeSchemas)}

      {children}
    </Helmet>
  );
}
