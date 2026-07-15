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
        return createElement(prop, { ...domProps, ref, style }, children);
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

export {
  motion,
  m,
  LazyMotion,
  domAnimation,
  domMax,
  AnimatePresence,
  useMotionValue,
  useReducedMotion,
  useTransform,
};
