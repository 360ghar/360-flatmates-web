import {
  type InfiniteData,
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  BlogCategory,
  BlogPost,
  BlogPostFilters,
  BlogPostList,
  BlogPostPreviewResponse,
  BlogPostPreviewTokenCreate,
  BlogPostPreviewTokenResponse,
  BlogTag
} from "@/lib/api/types";
import type { QueryValue } from "@/lib/api/client";

const BLOG_PAGE_SIZE = 12;

/**
 * Adapter from the on-the-wire `BlogPost` to a UI-friendly shape. Centralised
 * here so list and detail queries agree on field names (the backend may add
 * more in the future without touching the components).
 */
export interface BlogPostDetail extends BlogPost {
  /** Final rendered body (markdown / html). */
  renderedBody: string;
}

function asDetail(post: BlogPost): BlogPostDetail {
  return { ...post, renderedBody: post.body };
}

export function blogPostsOptions(filters?: BlogPostFilters) {
  return queryOptions({
    queryKey: ["blog", "posts", filters],
    queryFn: async () => {
      const response = await apiClient.request<BlogPostList>({
        method: "GET",
        path: "/blog/posts",
        query: (filters ?? {}) as Record<string, QueryValue>
      });
      return response.items;
    },
    staleTime: 60_000
  });
}

export function useBlogPosts(filters?: BlogPostFilters) {
  return useQuery(blogPostsOptions(filters));
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
        query: {
          ...(filters ?? {}),
          cursor: pageParam,
          limit: BLOG_PAGE_SIZE
        } as Record<string, QueryValue>,
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
    queryFn: () =>
      apiClient.request<BlogCategory[]>({
        method: "GET",
        path: "/blog/categories"
      }),
    staleTime: 5 * 60_000
  });
}

export function useBlogTags() {
  return useQuery({
    queryKey: ["blog", "tags"],
    queryFn: () =>
      apiClient.request<BlogTag[]>({
        method: "GET",
        path: "/blog/tags"
      }),
    staleTime: 5 * 60_000
  });
}

/**
 * Admin-only: mint a preview token for a draft or scheduled post. The post
 * id is supplied per-call so a single hook instance can mint tokens for any
 * post in the list.
 */
export function useCreateBlogPreviewToken() {
  return useMutation<BlogPostPreviewTokenResponse, Error, { id: number; payload?: BlogPostPreviewTokenCreate }>({
    mutationFn: ({ id, payload = {} }) =>
      apiClient.request<BlogPostPreviewTokenResponse>({
        method: "POST",
        path: `/blog/posts/${id}/preview-token`,
        body: payload
      })
  });
}

// Avoid "unused import" linting noise on InfiniteData when consumers do not
// import it directly.
export type { InfiniteData };
