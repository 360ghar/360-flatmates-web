import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockRequest = vi.fn();
vi.mock("@/lib/api", () => ({
  apiClient: { request: (...args: unknown[]) => mockRequest(...args) }
}));

import { useRecordProfileView } from "@/features/profile/hooks/useProfileViews";

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

describe("useProfileViews hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useRecordProfileView", () => {
    it("sends POST /flatmates/profile-views with payload", async () => {
      mockRequest.mockResolvedValue({
        id: 1,
        viewer_user_id: 10,
        viewed_user_id: 20,
        source: "swipe_deck",
        duration_seconds: 30
      });

      const payload = {
        target_user_id: 20,
        duration_seconds: 30,
        context_property_id: 5,
        scroll_depth_percent: 75,
        source: "swipe_deck"
      };
      const { result } = renderHook(() => useRecordProfileView(), {
        wrapper: createWrapper()
      });

      result.current.mutate(payload);

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("POST");
      expect(call.path).toBe("/flatmates/profile-views");
      expect(call.body).toEqual(payload);
    });
  });
});
