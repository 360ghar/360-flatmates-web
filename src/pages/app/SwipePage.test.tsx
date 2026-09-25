import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SwipePage } from "./SwipePage";
import { swipeStore } from "@/lib/stores/swipe-store";

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
vi.mock("@/hooks/queries", () => ({
  useSwipeDeck: () => ({ data: [{ id: 1, full_name: "First Match" }, { id: 2, full_name: "Second Match" }], refetch: vi.fn() }),
  useBootstrap: () => ({ data: null }),
  useSwipeAction: () => ({ mutateAsync })
}));
vi.mock("@/components/organisms/SwipeDeck", () => ({
  SwipeDeck: ({ onLike }: { onLike: (id: string) => void }) => (
    <><button onClick={() => onLike("1")}>Swipe first</button><button onClick={() => onLike("2")}>Swipe second</button></>
  )
}));

type MatchResult = { did_match: boolean; conversation_id: number };
function deferred() {
  let resolve!: (value: MatchResult) => void;
  const promise = new Promise<MatchResult>((done) => { resolve = done; });
  return { promise, resolve };
}
function setup() {
  const first = deferred();
  const second = deferred();
  mutateAsync.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const view = render(<MemoryRouter initialEntries={["/swipe"]}><Routes>
    <Route path="/swipe" element={<SwipePage />} />
    <Route path="/chats/101" element={<div>Chat destination</div>} />
    <Route path="/chats/202" element={<div>Wrong conversation</div>} />
  </Routes></MemoryRouter>);
  return { first, second, ...view };
}
async function swipeBoth() {
  fireEvent.click(screen.getByText("Swipe first"));
  await act(() => vi.advanceTimersByTimeAsync(321));
  fireEvent.click(screen.getByText("Swipe second"));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  localStorage.setItem("360-flatmates-swipe-hint-dismissed", "1");
  swipeStore.getState().setAnimating(false);
});
afterEach(() => { vi.useRealTimers(); });

describe("match queue", () => {
  it.each([false, true])("shows every match in response order (reversed: %s)", async (reversed) => {
    const { first, second } = setup();
    await swipeBoth();
    const results = reversed ? [second, first] : [first, second];
    const names = reversed ? ["Second Match", "First Match"] : ["First Match", "Second Match"];
    await act(async () => { results[0].resolve({ did_match: true, conversation_id: 101 }); });
    await act(async () => { results[1].resolve({ did_match: true, conversation_id: 202 }); });
    expect(within(screen.getByRole("dialog")).getByText(names[0])).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Keep Swiping" }));
    expect(within(screen.getByRole("dialog")).getByText(names[1])).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Keep Swiping" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("removes one match per native cancel and gives the next match its own timeout", async () => {
    const { first, second } = setup();
    await swipeBoth();
    await act(async () => {
      first.resolve({ did_match: true, conversation_id: 101 });
      second.resolve({ did_match: true, conversation_id: 202 });
    });
    await act(() => vi.advanceTimersByTimeAsync(3000));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    await act(() => vi.advanceTimersByTimeAsync(1500));
    expect(within(screen.getByRole("dialog")).getByText("Second Match")).toBeInTheDocument();
  });

  it("opens the displayed match's conversation", async () => {
    const { first, second } = setup();
    await swipeBoth();
    await act(async () => {
      first.resolve({ did_match: true, conversation_id: 101 });
      second.resolve({ did_match: true, conversation_id: 202 });
    });
    fireEvent.click(screen.getByRole("button", { name: "Say Hello" }));
    expect(screen.getByText("Chat destination")).toBeInTheDocument();
    // Route-specific rendering guards against navigating to the queued match.
  });

  it("does not display a late match after leaving and returning", async () => {
    const { first, unmount } = setup();
    fireEvent.click(screen.getByText("Swipe first"));
    unmount();
    await act(async () => { first.resolve({ did_match: true, conversation_id: 101 }); });
    setup();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
