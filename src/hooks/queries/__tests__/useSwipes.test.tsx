import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useSwipeAction } from "../useSwipes";

const request = vi.fn();
vi.mock("@/lib/api", async (orig) => ({
  ...(await orig<typeof import("@/lib/api")>()),
  apiClient: { request: (...args: unknown[]) => request(...args) },
}));

// W24 regression: swipes overlap, so a failed swipe must put back only its own
// card, never a snapshot that resurrects cards swiped since.
describe("useSwipeAction rollback", () => {
  it("restores only the failed card when swipes overlap", async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const key = ["swipes", "deck", {}];
    client.setQueryData(key, [{ id: 1 }, { id: 2 }, { id: 3 }]);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useSwipeAction(), { wrapper });

    let failFirst!: (e: Error) => void;
    request
      .mockImplementationOnce(() => new Promise((_r, reject) => (failFirst = reject)))
      .mockResolvedValueOnce({ did_match: false });

    await act(async () => {
      const first = result.current
        .mutateAsync({ target_type: "user", action: "like", target_user_id: 1 })
        .catch(() => undefined);
      await result.current.mutateAsync({ target_type: "user", action: "pass", target_user_id: 2 });
      failFirst(new Error("network"));
      await first;
    });

    expect(client.getQueryData(key)).toEqual([{ id: 1 }, { id: 3 }]);
  });
});
