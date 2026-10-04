import { cn } from "@/components/ui/component-utils";
import { SkeletonRoot, shimmer } from "@/components/ui/Skeleton";

/** Loading stand-in for the real layout; `count` repeats it, `className` lays the copies out. */
export function PaymentMethodRowSkeleton({ count = 1, className }: { count?: number; className?: string }) {
  return (
    <SkeletonRoot className={count > 1 && !className ? "flex flex-col gap-3" : className}>
      {Array.from({ length: count }, (_, i) => (
        <PaymentMethodRowBones key={i} />
      ))}
    </SkeletonRoot>
  );
}

/** Payment method / blocked user list row */
function PaymentMethodRowBones() {
  return (
    <div className="flex items-center gap-3 rounded-hand bg-surface p-4 shadow-sm">
      <div className={cn("h-9 w-9 shrink-0 rounded-full", shimmer)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className={cn("h-4 w-32 rounded-sm", shimmer)} />
        <div className={cn("h-3 w-20 rounded-sm", shimmer)} />
      </div>
      <div className={cn("h-8 w-20 shrink-0 rounded-full", shimmer)} />
    </div>
  );
}

/** Compatibility breakdown */
