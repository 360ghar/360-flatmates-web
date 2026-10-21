import type { Schemas } from "./schema";

export type BlogPostStatus = Schemas["BlogPostStatus"];

export type BlogCategory = Schemas["BlogCategory"];
export type BlogTag = Schemas["BlogTag"];
export type BlogCategoryCursorPage = Schemas["CursorPage_BlogCategory_"];
export type BlogTagCursorPage = Schemas["CursorPage_BlogTag_"];

/** Public post (list and detail). It carries no preview token. */
export type BlogPost = Schemas["BlogPost"];
export type BlogPostList = Schemas["CursorPage_BlogPost_"];

/** Admin view of a post: adds `author_id` and `preview_token`. */
export type BlogPostAdmin = Schemas["BlogPostAdmin"];

/** `GET /blog/posts/preview/{token}`. */
export type BlogPostPreviewResponse = Schemas["BlogPostPreviewResponse"];

/** `POST /blog/posts/{id}/preview-token` takes no body. */
export type BlogPreviewTokenResponse = Schemas["BlogPostPreviewToken"];

/**
 * Declared query keys of `GET /blog/posts`. `categories` and `tags` are slug
 * lists. `status` is for admins only: a public reader gets a 422 when it sends
 * it, so a public page never does.
 */
export interface BlogPostFilters {
  status?: BlogPostStatus;
  categories?: string[];
  tags?: string[];
  q?: string;
  cursor?: string;
  limit?: number;
}
