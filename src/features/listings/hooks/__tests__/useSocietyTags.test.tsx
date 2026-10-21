import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockRequest = vi.fn();
vi.mock("@/lib/api", () => ({
  apiClient: { request: (...args: unknown[]) => mockRequest(...args) }
}));

import { useVoteSocietyTag } from "@/features/listings/hooks/useSocietyTags";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("useSocietyTags hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useVoteSocietyTag", () => {
    it("sends POST /flatmates/listings/{listingId}/society-tags/votes with payload", async () => {
      mockRequest.mockResolvedValue({ message: "Vote recorded" });

      const { result } = renderHook(() => useVoteSocietyTag(), {
        wrapper: createWrapper()
      });

      const payload = { tag: "quiet", vote: "up" as const };
      result.current.mutate({ listingId: 42, payload });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("POST");
      expect(call.path).toBe("/flatmates/listings/42/society-tags/votes");
      expect(call.body).toEqual(payload);
    });
  });
});
