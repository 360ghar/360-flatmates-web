import { useEffect, useRef, useState } from "react";

export function useScrollProgress<T extends HTMLElement = HTMLElement>(
  options: { threshold?: number } = {},
): { ref: React.RefObject<T | null>; progress: number } {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);
  const rafId = useRef(0);
  const lastProgress = useRef(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const elementTop = rect.top;
        const elementHeight = rect.height;

        // Progress goes from 0 (element entering viewport) to 1 (element fully scrolled past)
        const rawProgress =
          (windowHeight - elementTop) / (windowHeight + elementHeight);
        const clamped = Math.min(1, Math.max(0, rawProgress));

        if (clamped !== lastProgress.current) {
          lastProgress.current = clamped;
          setProgress(clamped);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, [options.threshold]);

  return { ref: ref as React.RefObject<T | null>, progress };
}
