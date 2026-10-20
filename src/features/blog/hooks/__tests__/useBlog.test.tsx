import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockRequest = vi.fn();
vi.mock("@/lib/api", () => ({
  apiClient: { request: (...args: unknown[]) => mockRequest(...args) }
}));

import { useInfiniteBlogPosts, useBlogPost, useBlogPreview, useBlogCategories, useBlogTags, useCreateBlogPreviewToken } from "@/features/blog/hooks/useBlog";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("Blog hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useInfiniteBlogPosts(filters)", () => {
    it("requests one page of GET /blog/posts with the filters", async () => {
      mockRequest.mockResolvedValue({ items: [{ id: 1 }], next_cursor: null, has_more: false, limit: 12 });

      const { result } = renderHook(() => useInfiniteBlogPosts({ status: "published" }), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockRequest).toHaveBeenCalledTimes(1);
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("GET");
      expect(call.path).toBe("/blog/posts");
      expect(call.query).toMatchObject({ status: "published", limit: 12 });
      expect(result.current.hasNextPage).toBe(false);
    });

    it("reads the next page only when asked", async () => {
      mockRequest
        .mockResolvedValueOnce({ items: [{ id: 1 }], next_cursor: "c1", has_more: true, limit: 12, total: null })
        .mockResolvedValueOnce({ items: [{ id: 2 }], next_cursor: null, has_more: false, limit: 12, total: null });

      const { result } = renderHook(() => useInfiniteBlogPosts({ categories: ["guides"] }), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.hasNextPage).toBe(true));
      expect(mockRequest).toHaveBeenCalledTimes(1);
      await result.current.fetchNextPage();
      await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
      expect(mockRequest.mock.calls[1][0].query).toMatchObject({ cursor: "c1", categories: ["guides"] });
    });

    it("sends no status and no category_id for a public reader", async () => {
      mockRequest.mockResolvedValue({ items: [], next_cursor: null, has_more: false, limit: 12, total: null });

      renderHook(() => useInfiniteBlogPosts({ categories: ["guides"] }), { wrapper: createWrapper() });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const query = mockRequest.mock.calls[0][0].query;
      expect(query).not.toHaveProperty("category_id");
      expect(query.status).toBeUndefined();
    });
  });

  describe("useBlogPost(id)", () => {
    it("uses query key ['blog', 'post', id]", async () => {
      const mockPost = {
        id: 1,
        title: "How to find flatmates",
        slug: "how-to-find-flatmates",
        content: "Lorem ipsum",
        status: "published"
      };
      mockRequest.mockResolvedValue(mockPost);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      renderHook(() => useBlogPost(1), { wrapper });
      await waitFor(() => expect(mockRequest).toHaveBeenCalled());

      const cache = queryClient.getQueryData(["blog", "post", 1]);
      // The hook wraps the post in BlogPostDetail which adds `renderedBody`.
      expect(cache).toMatchObject({ id: 1, title: mockPost.title });
    });
  });

  describe("useBlogPreview(token)", () => {
    it("uses auth=false for public preview", async () => {
      const mockResponse = {
        id: 1,
        title: "Draft",
        slug: "draft",
        content: "draft body",
        status: "draft"
      };
      mockRequest.mockResolvedValue(mockResponse);

      renderHook(() => useBlogPreview("tok_abc"), {
        wrapper: createWrapper()
      });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("GET");
      expect(call.path).toBe("/blog/posts/preview/tok_abc");
      expect(call.auth).toBe(false);
    });
  });

  describe("useBlogCategories / useBlogTags", () => {
    it("returns category list", async () => {
      mockRequest.mockResolvedValue({
        items: [{ id: 1, name: "Guide", slug: "guide" }],
        next_cursor: null,
        has_more: false,
        limit: 100,
        total: null
      });
      const { result } = renderHook(() => useBlogCategories(), {
        wrapper: createWrapper()
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual([
        { id: 1, name: "Guide", slug: "guide" }
      ]);
      const call = mockRequest.mock.calls[0][0];
      expect(call.path).toBe("/blog/categories");
    });

    it("returns tag list", async () => {
      mockRequest.mockResolvedValue({
        items: [{ id: 1, name: "Mumbai", slug: "mumbai" }],
        next_cursor: null,
        has_more: false,
        limit: 100,
        total: null
      });
      const { result } = renderHook(() => useBlogTags(), {
        wrapper: createWrapper()
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual([
        { id: 1, name: "Mumbai", slug: "mumbai" }
      ]);
      const call = mockRequest.mock.calls[0][0];
      expect(call.path).toBe("/blog/tags");
    });
  });

  describe("useCreateBlogPreviewToken", () => {
    it("sends POST /blog/posts/{id}/preview-token", async () => {
      mockRequest.mockResolvedValue({
        preview_token: "tok_new",
        preview_url: "https://example.com/blog/preview/tok_new"
      });

      const { result } = renderHook(() => useCreateBlogPreviewToken(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ id: 5 });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("POST");
      expect(call.path).toBe("/blog/posts/5/preview-token");
      // The route takes no body.
      expect(call.body).toBeUndefined();
    });
  });
});
