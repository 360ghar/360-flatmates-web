import { forwardRef, createElement } from "react";

const FRAMER_PROPS = [
  "initial",
  "animate",
  "exit",
  "transition",
  "variants",
  "whileHover",
  "whileTap",
  "drag",
  "dragConstraints",
  "dragElastic",
  "onDragEnd",
  "custom",
  "layout",
  "layoutId",
  "mode",
] as const;

const motion = new Proxy(
  {},
  {
    get(_target, prop: string) {
      if (typeof prop === "symbol") return () => null;
      return forwardRef(function MotionMock(
        props: Record<string, unknown>,
        ref: React.Ref<HTMLElement>,
      ) {
        const { children, style, ...rest } = props;
        const domProps = Object.fromEntries(
          Object.entries(rest).filter(([k]) => !FRAMER_PROPS.includes(k as typeof FRAMER_PROPS[number]))
        );
        // Motion values in `style` resolve to their current value.
        const resolvedStyle =
          style && typeof style === "object"
            ? Object.fromEntries(
                Object.entries(style as Record<string, unknown>).map(([k, v]) => [
                  k,
                  v && typeof v === "object" && "get" in v ? (v as { get: () => unknown }).get() : v
                ])
              )
            : style;
        return createElement(prop, { ...domProps, ref, style: resolvedStyle }, children);
      });
    },
  },
);

const m = motion;

function LazyMotion({ children }: { children: React.ReactNode }) {
  return children;
}

const domAnimation = {};
const domMax = {};

function AnimatePresence({ children }: { children: React.ReactNode }) {
  return children;
}

function useMotionValue(initial: number) {
  return { get: () => initial, set: () => {} };
}

function useReducedMotion() {
  return false;
}

function useTransform(
  _value: unknown,
  _range: unknown,
  _output: unknown,
) {
  return { get: () => 0 };
}

function useScroll() {
  return { scrollY: { get: () => 0 }, scrollYProgress: { get: () => 0 } };
}

function MotionConfig({ children }: { children: React.ReactNode }) {
  return children;
}

export {
  motion,
  useScroll,
  MotionConfig,
  m,
  LazyMotion,
  domAnimation,
  domMax,
  AnimatePresence,
  useMotionValue,
  useReducedMotion,
  useTransform,
};
