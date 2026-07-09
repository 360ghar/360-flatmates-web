import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const requestMock = vi.fn();

vi.mock("@/lib/api", () => ({
  get apiClient() {
    return { request: requestMock };
  }
}));

import { useUpdateVisit } from "../useVisits";

describe("BUG-04: useUpdateVisit routing", () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    requestMock.mockReset();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
      },
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("calls /flatmates/visits/{id} if visit_context is flatmate_meet", async () => {
    queryClient.setQueryData(["visits", 10], { visit_context: "flatmate_meet", status: "requested" });
    requestMock.mockResolvedValue({ status: "success" });

    const { result } = renderHook(() => useUpdateVisit(10), { wrapper });
    
    result.current.mutate({ status: "confirmed" } as any);
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "PUT",
        path: "/flatmates/visits/10"
      })
    );
  });

  it("calls /visits/{id} if visit_context is property_tour", async () => {
    queryClient.setQueryData(["visits", 20], { visit_context: "property_tour", status: "requested" });
    requestMock.mockResolvedValue({ status: "confirmed" });

    const { result } = renderHook(() => useUpdateVisit(20), { wrapper });
    
    result.current.mutate({ status: "confirmed" } as any);
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "PUT",
        path: "/visits/20"
      })
    );
  });
});
