import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useResendTimer } from "@/hooks/useResendTimer";

describe("useResendTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts idle: remaining 0 and resend allowed", () => {
    const { result } = renderHook(() => useResendTimer(30));
    expect(result.current.remaining).toBe(0);
    expect(result.current.canResend).toBe(true);
  });

  it("defaults to a 30-second cooldown on start()", () => {
    const { result } = renderHook(() => useResendTimer());
    act(() => result.current.start());
    expect(result.current.remaining).toBe(30);
    expect(result.current.canResend).toBe(false);
  });

  it("counts down one second per tick and re-enables at 0", () => {
    const { result } = renderHook(() => useResendTimer(30));

    act(() => result.current.start());
    expect(result.current.remaining).toBe(30);

    act(() => vi.advanceTimersByTime(7000));
    expect(result.current.remaining).toBe(23); // "Resend in 23s"
    expect(result.current.canResend).toBe(false);

    act(() => vi.advanceTimersByTime(23000));
    expect(result.current.remaining).toBe(0);
    expect(result.current.canResend).toBe(true);

    // No negative drift after the cooldown elapses.
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.remaining).toBe(0);
  });

  it("restarts the full cooldown when start() is called again (resend)", () => {
    const { result } = renderHook(() => useResendTimer(30));

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(20000));
    expect(result.current.remaining).toBe(10);

    act(() => result.current.start());
    expect(result.current.remaining).toBe(30);
  });

  it("reset() cancels the countdown immediately", () => {
    const { result } = renderHook(() => useResendTimer(30));

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.remaining).toBe(25);

    act(() => result.current.reset());
    expect(result.current.remaining).toBe(0);
    expect(result.current.canResend).toBe(true);
  });

  it("clears its interval on unmount", () => {
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const { result, unmount } = renderHook(() => useResendTimer(30));
    act(() => result.current.start());
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});
