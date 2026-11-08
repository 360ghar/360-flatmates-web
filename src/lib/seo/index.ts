export {
  SITE_URL,
  HOME_URL,
  SITE_NAME,
  SITE_TAGLINE,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  TWITTER_HANDLE,
  SUPPORTED_CITIES,
} from "./config";
export { SeoHelmet } from "./SeoHelmet";
export {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildWebApplicationSchema,
  buildServiceSchema,
  buildBreadcrumbJsonLd,
  homeBreadcrumb,
  buildSpeakableSchema,
  buildFaqPageSchema,
  buildHowToSchema,
  buildArticleSchema,
  buildCollectionPageSchema,
  buildResidenceSchema,
  LOGO_URL,
} from "./schema";
export type { FaqItem, HowToStep, ArticleSchemaInput } from "./schema";
