import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockRequest = vi.fn();
vi.mock("@/lib/api", () => ({
  apiClient: { request: (...args: unknown[]) => mockRequest(...args) }
}));

import {
  useRegisterDeviceMutation,
  useUnregisterDeviceMutation
} from "@/hooks/queries/useDevices";

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

describe("useDevices hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useRegisterDeviceMutation", () => {
    it("sends POST /notifications/devices/register with payload", async () => {
      mockRequest.mockResolvedValue({ message: "Device registered" });

      const payload = {
        device_token: "abc123",
        platform: "ios" as const
      };
      const { result } = renderHook(() => useRegisterDeviceMutation(), {
        wrapper: createWrapper()
      });

      result.current.mutate(payload);

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("POST");
      expect(call.path).toBe("/notifications/devices/register");
      expect(call.body).toEqual({ token: "abc123", platform: "ios" });
    });
  });

  describe("useUnregisterDeviceMutation", () => {
    it("sends DELETE /notifications/devices/unregister with token as query param", async () => {
      mockRequest.mockResolvedValue({ message: "Device unregistered" });

      const payload = { device_token: "abc123" };
      const { result } = renderHook(() => useUnregisterDeviceMutation(), {
        wrapper: createWrapper()
      });

      result.current.mutate(payload);

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("DELETE");
      expect(call.path).toBe("/notifications/devices/unregister");
      expect(call.query).toEqual({ token: "abc123" });
    });
  });
});
