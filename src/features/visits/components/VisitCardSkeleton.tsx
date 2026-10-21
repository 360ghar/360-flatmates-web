import { cn } from "@/components/ui/component-utils";
import { SkeletonRoot, shimmer } from "@/components/ui/Skeleton";

/** Loading stand-in for the real layout; `count` repeats it, `className` lays the copies out. */
export function VisitCardSkeleton({ count = 1, className }: { count?: number; className?: string }) {
  return (
    <SkeletonRoot className={count > 1 && !className ? "flex flex-col gap-3" : className}>
      {Array.from({ length: count }, (_, i) => (
        <VisitCardBones key={i} />
      ))}
    </SkeletonRoot>
  );
}

/** Matches VisitCard */
function VisitCardBones() {
  return (
    <div className="rounded-hand bg-surface p-4 shadow-sm">
      <div className="flex gap-3">
        <div className={cn("h-14 w-14 shrink-0 rounded-cut-md", shimmer)} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className={cn("h-4 w-28 rounded-sm", shimmer)} />
            <div className={cn("h-5 w-16 rounded-full", shimmer)} />
          </div>
          <div className={cn("h-3 w-2/5 rounded-sm", shimmer)} />
          <div className="flex gap-2 pt-1">
            <div className={cn("h-6 w-14 rounded-full", shimmer)} />
            <div className={cn("h-6 w-16 rounded-full", shimmer)} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Matches StatCard */
