import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockRequest = vi.fn();
vi.mock("@/lib/api", () => ({
  apiClient: { request: (...args: unknown[]) => mockRequest(...args) }
}));

import {
  useBlogPosts,
  useBlogPost,
  useBlogPreview,
  useBlogCategories,
  useBlogTags,
  useCreateBlogPreviewToken
} from "@/hooks/queries";

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

  describe("useBlogPosts(filters)", () => {
    it("uses query key ['blog', 'posts', filters] and unwraps items", async () => {
      const mockPosts = [
        {
          id: 1,
          title: "How to find flatmates",
          slug: "how-to-find-flatmates",
          body: "Lorem ipsum",
          status: "published"
        }
      ];
      mockRequest.mockResolvedValue({
        items: mockPosts,
        next_cursor: null,
        has_more: false,
        limit: 12
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      renderHook(() => useBlogPosts({ status: "published" }), { wrapper });
      await waitFor(() => expect(mockRequest).toHaveBeenCalled());

      const cache = queryClient.getQueryData(["blog", "posts", {
        status: "published"
      }]);
      expect(cache).toEqual(mockPosts);
    });

    it("requests GET /blog/posts", async () => {
      mockRequest.mockResolvedValue({
        items: [],
        next_cursor: null,
        has_more: false,
        limit: 12
      });

      renderHook(() => useBlogPosts(), { wrapper: createWrapper() });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("GET");
      expect(call.path).toBe("/blog/posts");
    });
  });

  describe("useBlogPost(id)", () => {
    it("uses query key ['blog', 'post', id]", async () => {
      const mockPost = {
        id: 1,
        title: "How to find flatmates",
        slug: "how-to-find-flatmates",
        body: "Lorem ipsum",
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
        post: {
          id: 1,
          title: "Draft",
          slug: "draft",
          body: "draft body",
          status: "draft"
        },
        token_valid: true,
        expires_at: "2026-12-31T00:00:00Z"
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
      mockRequest.mockResolvedValue([
        { id: 1, name: "Guide", slug: "guide" }
      ]);
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
      mockRequest.mockResolvedValue([
        { id: 1, name: "Mumbai", slug: "mumbai" }
      ]);
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
        token: "tok_new",
        url: "https://example.com/blog/preview/tok_new",
        expires_at: "2026-12-31T00:00:00Z"
      });

      const { result } = renderHook(() => useCreateBlogPreviewToken(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ id: 5, payload: { ttl_hours: 24 } });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("POST");
      expect(call.path).toBe("/blog/posts/5/preview-token");
      expect(call.body).toEqual({ ttl_hours: 24 });
    });
  });
});
