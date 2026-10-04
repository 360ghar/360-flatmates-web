import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { useInfiniteConversations } from "@/features/chat/hooks/useConversations";
import { uiStore } from "@/lib/stores/ui-store";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/lib/api", () => ({ apiClient: { request } }));
afterEach(() => { vi.useRealTimers(); });

it("polls paginated chats while disconnected, stops on reconnect, and resumes after a loss", async () => {
  vi.useFakeTimers();
  uiStore.getState().setRealtimeState("disconnected");
  request.mockImplementation(async ({ query }: { query: { cursor?: string } }) => ({
    items: [{ id: query.cursor ? 2 : 1 }],
    has_more: !query.cursor,
    next_cursor: query.cursor ? null : "page-2"
  }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result, unmount } = renderHook(() => useInfiniteConversations(), { wrapper });
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(request).toHaveBeenCalledTimes(1);
  expect(result.current.data?.pages).toHaveLength(1);
  await act(async () => { await result.current.fetchNextPage(); });
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ query: { cursor: "page-2", limit: 30 } }));
  await act(() => vi.advanceTimersByTimeAsync(15_000));
  expect(request).toHaveBeenCalledTimes(4);
  expect(result.current.data?.pages).toHaveLength(2);
  act(() => uiStore.getState().setRealtimeState("connected"));
  await act(() => vi.advanceTimersByTimeAsync(30_000));
  expect(request).toHaveBeenCalledTimes(4);
  act(() => uiStore.getState().setRealtimeState("reconnecting"));
  await act(() => vi.advanceTimersByTimeAsync(15_000));
  expect(request).toHaveBeenCalledTimes(6);
  unmount();
  client.clear();
});
