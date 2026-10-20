import { afterEach, describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import { render } from "@testing-library/react";
import { useBannerHeightVar } from "../useBannerHeightVar";

const VAR = "--test-banner-h";
let resizeCallback: () => void = () => undefined;
let disconnect = vi.fn();

class FakeResizeObserver {
  constructor(cb: () => void) {
    resizeCallback = cb;
  }
  observe() {}
  disconnect = (...args: []) => disconnect(...args);
}

function Banner({ active = true, height = 40 }: { active?: boolean; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useBannerHeightVar(ref, VAR, active);
  return (
    <div
      ref={(el) => {
        ref.current = el;
        if (el) Object.defineProperty(el, "offsetHeight", { configurable: true, value: height });
      }}
      style={{ marginTop: "4px", marginBottom: "6px" }}
    />
  );
}

const read = () => document.documentElement.style.getPropertyValue(VAR);

describe("useBannerHeightVar", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.style.removeProperty(VAR);
  });

  it("sets the var to height plus vertical margins, re-measures on resize, and removes it on unmount", () => {
    disconnect = vi.fn();
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    const { unmount } = render(<Banner height={40} />);
    expect(read()).toBe("50px");

    const el = document.body.querySelector("div div") ?? document.body.firstElementChild!.firstElementChild!;
    Object.defineProperty(el, "offsetHeight", { configurable: true, value: 60 });
    resizeCallback();
    expect(read()).toBe("70px");

    unmount();
    expect(disconnect).toHaveBeenCalled();
    expect(read()).toBe("");
  });

  it("does nothing while inactive", () => {
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    render(<Banner active={false} />);
    expect(read()).toBe("");
  });
});
