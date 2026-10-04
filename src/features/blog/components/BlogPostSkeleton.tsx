import { cn } from "@/components/ui/component-utils";
import { SkeletonRoot, shimmer } from "@/components/ui/Skeleton";

/** Loading stand-in shaped like the real page. */
export function BlogPostSkeleton({ className }: { className?: string }) {
  return (
    <SkeletonRoot className={cn(className)}>
      <BlogPostBones />
    </SkeletonRoot>
  );
}

/** Blog article loading layout */
function BlogPostBones() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className={cn("h-8 w-24 rounded-cut-md", shimmer)} />
      <div className={cn("h-10 w-3/4 rounded-sm", shimmer)} />
      <div className={cn("h-5 w-1/2 rounded-sm", shimmer)} />
      <div className={cn("mt-2 aspect-[16/9] w-full rounded-cut-lg", shimmer)} />
      <div className="mt-2 flex flex-col gap-3">
        <div className={cn("h-4 w-full rounded-sm", shimmer)} />
        <div className={cn("h-4 w-full rounded-sm", shimmer)} />
        <div className={cn("h-4 w-5/6 rounded-sm", shimmer)} />
        <div className={cn("h-4 w-2/3 rounded-sm", shimmer)} />
        <div className={cn("mt-2 h-4 w-full rounded-sm", shimmer)} />
        <div className={cn("h-4 w-4/5 rounded-sm", shimmer)} />
      </div>
    </div>
  );
}
