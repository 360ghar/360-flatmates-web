import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockRequest = vi.fn();
vi.mock("@/lib/api", () => ({
  apiClient: { request: (...args: unknown[]) => mockRequest(...args) }
}));

import {
  useReportUserMutation,
  useSubmitBugReportMutation
} from "@/hooks/queries/useReports";

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

describe("useReports hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useReportUserMutation", () => {
    it("sends POST /flatmates/reports with payload", async () => {
      mockRequest.mockResolvedValue({
        id: 1,
        reporter_user_id: 10,
        reported_user_id: 20,
        reason: "abuse",
        status: "open"
      });

      const payload = {
        reported_user_id: 20,
        reason: "abuse" as const,
        conversation_id: 5,
        notes: "Inappropriate behavior"
      };
      const { result } = renderHook(() => useReportUserMutation(), {
        wrapper: createWrapper()
      });

      result.current.mutate(payload);

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("POST");
      expect(call.path).toBe("/flatmates/reports");
      expect(call.body).toEqual(payload);
    });
  });

  describe("useSubmitBugReportMutation", () => {
    it("sends POST /bugs with payload", async () => {
      mockRequest.mockResolvedValue({
        id: 1,
        source: "web",
        bug_type: "ui_bug",
        severity: "medium",
        status: "open",
        title: "Layout issue",
        description: "Buttons overlap on mobile"
      });

      const payload = {
        source: "web" as const,
        bug_type: "ui_bug" as const,
        severity: "medium" as const,
        title: "Layout issue",
        description: "Buttons overlap on mobile",
        tags: ["report_problem"]
      };
      const { result } = renderHook(() => useSubmitBugReportMutation(), {
        wrapper: createWrapper()
      });

      result.current.mutate(payload);

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("POST");
      expect(call.path).toBe("/bugs");
      expect(call.body).toEqual(payload);
    });
  });
});
