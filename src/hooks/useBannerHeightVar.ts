import { useLayoutEffect, type RefObject } from "react";

/**
 * Expose a rendered in-flow banner's full footprint (height + vertical
 * margins) as a root CSS variable, so viewport-sized views below it (chat
 * thread, map) can subtract it instead of sliding behind the tab bar.
 * The variable is removed when the banner unmounts or hides.
 */
export function useBannerHeightVar(
  ref: RefObject<HTMLElement | null>,
  varName: string,
  active = true
) {
  useLayoutEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el || typeof document === "undefined") return;
    const set = () => {
      const style = window.getComputedStyle(el);
      const total =
        el.offsetHeight +
        Number.parseFloat(style.marginTop || "0") +
        Number.parseFloat(style.marginBottom || "0");
      document.documentElement.style.setProperty(varName, `${total}px`);
    };
    set();
    const observer = new ResizeObserver(set);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty(varName);
    };
  }, [ref, varName, active]);
}
