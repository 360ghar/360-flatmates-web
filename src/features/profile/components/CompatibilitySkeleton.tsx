import { cn } from "@/components/ui/component-utils";
import { SkeletonRoot, shimmer } from "@/components/ui/Skeleton";

/** Loading stand-in shaped like the real page. */
export function CompatibilitySkeleton({ className }: { className?: string }) {
  return (
    <SkeletonRoot className={cn(className)}>
      <CompatibilityBones />
    </SkeletonRoot>
  );
}

/** Compatibility breakdown */
function CompatibilityBones() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-4 rounded-hand bg-surface p-6 text-center shadow-sm">
        <div className={cn("h-28 w-28 rounded-full", shimmer)} />
        <div className={cn("h-5 w-24 rounded-full", shimmer)} />
        <div className={cn("h-4 w-48 rounded-full", shimmer)} />
      </div>
      <div className="flex flex-col gap-4 rounded-hand bg-surface p-5 shadow-sm">
        <div className={cn("h-5 w-24 rounded-full", shimmer)} />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className={cn("h-4 w-32 rounded-full", shimmer)} />
            <div className={cn("h-2 w-full rounded-full", shimmer)} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-hand bg-surface p-5 shadow-sm">
        <div className={cn("h-5 w-20 rounded-full", shimmer)} />
        <div className={cn("h-4 w-full rounded-full", shimmer)} />
        <div className={cn("h-4 w-4/5 rounded-full", shimmer)} />
      </div>
    </div>
  );
}

/** Dashboard / analytics: stats + table */
