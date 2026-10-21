import { cn } from "./component-utils";

/** Spacing, not rules, separates the two sign-in routes (DESIGN.md). */
export function OrDivider({ className }: { className?: string }) {
  return (
    <p className={cn("py-1 text-center text-caption text-ink-3", className)}>
      or
    </p>
  );
}
