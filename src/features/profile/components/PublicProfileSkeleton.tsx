import { cn } from "@/components/ui/component-utils";
import { SkeletonRoot, shimmer } from "@/components/ui/Skeleton";

/** Loading stand-in shaped like the real page. */
export function PublicProfileSkeleton({ className }: { className?: string }) {
  return (
    <SkeletonRoot className={cn(className)}>
      <PublicProfileBones />
    </SkeletonRoot>
  );
}

function PublicProfileBones() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-4 rounded-hand bg-surface p-6 text-center shadow-sm">
        <div className={cn("h-[120px] w-[120px] rounded-cut-md", shimmer)} />
        <div className={cn("h-7 w-24 rounded-sm", shimmer)} />
        <div className={cn("h-4 w-32 rounded-sm", shimmer)} />
        <div className="flex gap-2">
          <div className={cn("h-5 w-16 rounded-full", shimmer)} />
          <div className={cn("h-5 w-16 rounded-full", shimmer)} />
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-hand bg-surface p-5 shadow-sm">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className={cn("h-4 w-1/4 rounded-sm", shimmer)} />
            <div className={cn("h-4 w-1/5 rounded-sm", shimmer)} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-hand bg-surface p-5 shadow-sm">
        <div className={cn("h-5 w-40 rounded-sm", shimmer)} />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className={cn("h-4 w-1/3 rounded-sm", shimmer)} />
            <div className={cn("h-3 w-8 rounded-sm", shimmer)} />
          </div>
        ))}
      </div>
      <div className={cn("h-[52px] w-full rounded-cut-md", shimmer)} />
    </div>
  );
}

/* ─── New page-level variants ─── */

/** Matches BlogPostCard */
