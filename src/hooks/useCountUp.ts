import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/useInView";

export function useCountUp(
  target: number,
  { duration = 1500, enabled = true }: { duration?: number; enabled?: boolean } = {}
): { ref: React.RefObject<HTMLElement | null>; value: number } {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.3 });
  const [value, setValue] = useState(target);
  const hasAnimated = useRef(false);
  const lastValue = useRef(target);

  useEffect(() => {
    if (!enabled || hasAnimated.current || !inView) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    hasAnimated.current = true;

    // Snap to the final value with no animation when the user has
    // expressed a preference for reduced motion.
    if (prefersReduced) {
      lastValue.current = target;
      setValue(target);
      return;
    }

    setValue(0);
    lastValue.current = 0;

    const start = performance.now();
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const nextValue = Math.round(easedProgress * target);
      if (nextValue !== lastValue.current) {
        lastValue.current = nextValue;
        setValue(nextValue);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration, enabled, inView]);

  return { ref, value };
}
