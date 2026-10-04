import { cn } from "@/components/ui/component-utils";
import { SkeletonRoot, shimmer } from "@/components/ui/Skeleton";

/** Loading stand-in for the real layout; `count` repeats it, `className` lays the copies out. */
export function AlertCardSkeleton({ count = 1, className }: { count?: number; className?: string }) {
  return (
    <SkeletonRoot className={count > 1 && !className ? "flex flex-col gap-3" : className}>
      {Array.from({ length: count }, (_, i) => (
        <AlertCardBones key={i} />
      ))}
    </SkeletonRoot>
  );
}

/** Alert list card (name, meta lines, actions — no filter chips) */
function AlertCardBones() {
  return (
    <div className="rounded-hand bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className={cn("h-4 w-28 rounded-sm", shimmer)} />
            <div className={cn("h-5 w-14 rounded-full", shimmer)} />
          </div>
          <div className={cn("h-3 w-24 rounded-sm", shimmer)} />
          <div className={cn("h-3 w-20 rounded-sm", shimmer)} />
        </div>
        <div className="flex shrink-0 gap-2">
          <div className={cn("h-9 w-9 rounded-cut-md", shimmer)} />
          <div className={cn("h-9 w-9 rounded-cut-md", shimmer)} />
        </div>
      </div>
    </div>
  );
}

/** Payment method / blocked user list row */
