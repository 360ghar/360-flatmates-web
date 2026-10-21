import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { fetchAllPages, MAX_PAGE_LIMIT } from "@/lib/api/pagination";
import type {
  BlogCategory,
  BlogCategoryCursorPage,
  BlogPost,
  BlogPostFilters,
  BlogPostList,
  BlogPostPreviewResponse,
  BlogPreviewTokenResponse,
  BlogTag,
  BlogTagCursorPage
} from "@/lib/api/types";
import type { QueryValue } from "@/lib/api/client";

const BLOG_PAGE_SIZE = 12;

/**
 * Adapter from the on-the-wire `BlogPost` to a UI-friendly shape. Centralised
 * here so list and detail queries agree on field names (the backend may add
 * more in the future without touching the components).
 */
export interface BlogPostDetail extends BlogPost {
  /** Final rendered body (markdown / html), sourced from `content`. */
  renderedBody: string;
}

function asDetail(post: BlogPost): BlogPostDetail {
  return { ...post, renderedBody: post.content };
}

/** Query keys of `GET /blog/posts` as the client sends them. */
function postQuery(filters?: Omit<BlogPostFilters, "cursor" | "limit">): Record<string, QueryValue> {
  return {
    q: filters?.q,
    categories: filters?.categories,
    tags: filters?.tags,
    status: filters?.status
  };
}

export function infiniteBlogPostsOptions(
  filters?: Omit<BlogPostFilters, "cursor" | "limit">
) {
  return infiniteQueryOptions({
    queryKey: ["blog", "posts", "infinite", filters],
    queryFn: async ({ pageParam, signal }) => {
      const response = await apiClient.request<BlogPostList>({
        method: "GET",
        path: "/blog/posts",
        query: { ...postQuery(filters), cursor: pageParam, limit: BLOG_PAGE_SIZE },
        signal
      });
      return response;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor ?? undefined : undefined,
    staleTime: 60_000
  });
}

export function useInfiniteBlogPosts(
  filters?: Omit<BlogPostFilters, "cursor" | "limit">
) {
  return useInfiniteQuery(infiniteBlogPostsOptions(filters));
}

export function useBlogPost(id: number | string) {
  return useQuery({
    queryKey: ["blog", "post", id],
    queryFn: async () => {
      const post = await apiClient.request<BlogPost>({
        method: "GET",
        path: `/blog/posts/${id}`
      });
      return asDetail(post);
    },
    enabled: !!id
  });
}

/**
 * Public preview of a blog post by opaque preview token. No auth required.
 */
export function useBlogPreview(token: string) {
  return useQuery({
    queryKey: ["blog", "preview", token],
    queryFn: () =>
      apiClient.request<BlogPostPreviewResponse>({
        method: "GET",
        path: `/blog/posts/preview/${token}`,
        auth: false
      }),
    enabled: !!token
  });
}

export function useBlogCategories() {
  return useQuery({
    queryKey: ["blog", "categories"],
    queryFn: ({ signal }) =>
      fetchAllPages<BlogCategory>((cursor) =>
        apiClient.request<BlogCategoryCursorPage>({
          method: "GET",
          path: "/blog/categories",
          query: { cursor, limit: MAX_PAGE_LIMIT },
          signal
        })
      ),
    staleTime: 5 * 60_000
  });
}

export function useBlogTags() {
  return useQuery({
    queryKey: ["blog", "tags"],
    queryFn: ({ signal }) =>
      fetchAllPages<BlogTag>((cursor) =>
        apiClient.request<BlogTagCursorPage>({
          method: "GET",
          path: "/blog/tags",
          query: { cursor, limit: MAX_PAGE_LIMIT },
          signal
        })
      ),
    staleTime: 5 * 60_000
  });
}

/**
 * Admin-only: mint a preview token for a draft or scheduled post. The route
 * takes no body and answers `{ preview_token, preview_url }`. The post id is
 * supplied per call so one hook instance can mint tokens for any post.
 */
export function useCreateBlogPreviewToken() {
  return useMutation<BlogPreviewTokenResponse, Error, { id: number }>({
    mutationFn: ({ id }) =>
      apiClient.request<BlogPreviewTokenResponse>({
        method: "POST",
        path: `/blog/posts/${id}/preview-token`
      })
  });
}
