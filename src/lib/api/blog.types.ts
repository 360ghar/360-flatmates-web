import type { CursorPage, JsonObject } from "./common.types";

/** Lifecycle status for a BlogPost. Matches the backend `BlogPostStatus` enum. */
export type BlogPostStatus = "draft" | "published" | "archived" | "scheduled";

/** Authoring / taxonomy metadata attached to a blog post. */
export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
}

/** Canonical BlogPost payload returned by `/blog/posts` endpoints. */
export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  status: BlogPostStatus;
  /** ISO-8601 publish timestamp; absent while in draft. */
  published_at?: string | null;
  scheduled_for?: string | null;
  /** SEO metadata attached at creation time. */
  meta_title?: string;
  meta_description?: string;
  focus_keyword?: string;
  canonical_url?: string;
  og_image_url?: string;
  /** Calculated read time / word count from the backend. */
  reading_time_minutes?: number;
  word_count?: number;
  /** Cover image (separate from the SEO og_image). */
  cover_image_url?: string;
  author_id?: number;
  author_name?: string;
  author_avatar_url?: string;
  categories?: BlogCategory[];
  tags?: BlogTag[];
  /** Citations / external sources referenced in the article body. */
  sources?: Array<{ label: string; url: string }>;
  seo_metadata?: JsonObject;
  created_at?: string;
  updated_at?: string;
}

/** Cursor-paginated blog post list. */
export type BlogPostList = CursorPage<BlogPost>;

/** Filters supported by `GET /blog/posts`. */
export interface BlogPostFilters {
  status?: BlogPostStatus;
  category_id?: number;
  tag_id?: number;
  q?: string;
  cursor?: string;
  limit?: number;
}

/** Response returned by `GET /blog/posts/preview/{token}` (public preview link). */
export interface BlogPostPreviewResponse {
  post: BlogPost;
  /** True when the preview token is still valid. */
  token_valid: boolean;
  /** ISO-8601 expiry of the preview token. */
  expires_at?: string;
}

/** Payload for `POST /blog/posts/{post_id}/preview-token`. */
export interface BlogPreviewTokenCreate {
  /** Validity window in hours. Defaults to 72h when omitted. */
  ttl_hours?: number;
}

/** Response returned by `POST /blog/posts/{post_id}/preview-token`. */
export interface BlogPreviewTokenResponse {
  token: string;
  /** Public URL that can be shared. */
  url: string;
  expires_at: string;
}
