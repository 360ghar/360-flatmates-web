import { cn } from "@/components/ui/component-utils";
import { SkeletonRoot, shimmer } from "@/components/ui/Skeleton";

/** Loading stand-in for the real layout; `count` repeats it, `className` lays the copies out. */
export function BlogCardSkeleton({ count = 1, className }: { count?: number; className?: string }) {
  return (
    <SkeletonRoot className={count > 1 && !className ? "flex flex-col gap-3" : className}>
      {Array.from({ length: count }, (_, i) => (
        <BlogCardBones key={i} />
      ))}
    </SkeletonRoot>
  );
}

/** Matches BlogPostCard */
function BlogCardBones() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-hand bg-surface paper-grain shadow-sm">
      <div className={cn("aspect-[16/9] w-full", shimmer)} />
      <div className="flex flex-1 flex-col p-6">
        <div className={cn("h-6 w-4/5 rounded-sm", shimmer)} />
        <div className={cn("mt-1 h-6 w-3/5 rounded-sm", shimmer)} />
        <div className="mt-3 flex flex-col gap-2">
          <div className={cn("h-4 w-full rounded-sm", shimmer)} />
          <div className={cn("h-4 w-11/12 rounded-sm", shimmer)} />
          <div className={cn("h-4 w-2/3 rounded-sm", shimmer)} />
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-line-low pt-4">
          <div className="flex gap-4">
            <div className={cn("h-3.5 w-20 rounded-sm", shimmer)} />
            <div className={cn("h-3.5 w-16 rounded-sm", shimmer)} />
          </div>
          <div className={cn("h-3.5 w-12 rounded-sm", shimmer)} />
        </div>
      </div>
    </div>
  );
}

/** Blog article loading layout */
