import { cn } from "@/components/ui/component-utils";
import { SkeletonRoot, shimmer } from "@/components/ui/Skeleton";

/** Loading stand-in for the real layout; `count` repeats it, `className` lays the copies out. */
export function SwipeCardSkeleton({ count = 1, className }: { count?: number; className?: string }) {
  return (
    <SkeletonRoot className={count > 1 && !className ? "flex flex-col gap-3" : className}>
      {Array.from({ length: count }, (_, i) => (
        <SwipeCardBones key={i} />
      ))}
    </SkeletonRoot>
  );
}

/**
 * Matches SwipeDeck card — mobile portrait stack, md+ side-by-side, + action bar
 */
function SwipeCardBones() {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 md:max-w-3xl lg:max-w-4xl">
      <div className="relative h-[calc(100dvh-328px)] md:h-[calc(100dvh-268px)]">
        <div className="md:hidden">
          <div className="absolute inset-x-4 top-4 h-full translate-y-3 scale-90 rounded-hand bg-surface opacity-30 shadow-sm" />
          <div className="absolute inset-x-2 top-2 h-full translate-y-[6px] scale-[0.95] rounded-hand bg-surface opacity-50 shadow-sm" />
          <div className="absolute inset-0 overflow-hidden rounded-hand bg-surface shadow-sm">
            <div className={cn("absolute inset-0", shimmer)} />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-scrim/80 to-transparent p-5 pt-20">
              <div className={cn("h-8 w-3/5 rounded-cut-sm", shimmer)} />
              <div className="mt-1 flex items-center gap-1.5">
                <div className="h-4 w-4 rounded-sm bg-white/20" />
                <div className={cn("h-4 w-1/3 rounded-sm", shimmer)} />
              </div>
              <div className="flex gap-2 pt-2">
                <div className={cn("h-6 w-16 rounded-full bg-white/20", shimmer)} />
                <div className={cn("h-6 w-14 rounded-full bg-white/20", shimmer)} />
                <div className={cn("h-6 w-20 rounded-full bg-white/20", shimmer)} />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 hidden overflow-hidden rounded-hand bg-surface shadow-sm md:flex">
          <div className={cn("relative h-full w-[40%] shrink-0 lg:w-[45%]", shimmer)}>
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-scrim/80 to-transparent p-4 pt-20">
              <div className={cn("h-7 w-3/5 rounded-cut-sm", shimmer)} />
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded-sm bg-white/20" />
                <div className={cn("h-4 w-1/2 rounded-sm", shimmer)} />
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col space-y-6 px-5 py-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 border-b border-line/45 pb-5">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className={cn("h-3 w-1/2 rounded-sm", shimmer)} />
                  <div className={cn("h-4 w-3/4 rounded-sm", shimmer)} />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className={cn("h-5 w-24 rounded-cut-sm", shimmer)} />
              <div className={cn("h-4 w-full rounded-sm", shimmer)} />
              <div className={cn("h-4 w-11/12 rounded-sm", shimmer)} />
              <div className={cn("h-4 w-4/5 rounded-sm", shimmer)} />
            </div>
            <div className="space-y-2">
              <div className={cn("h-5 w-20 rounded-cut-sm", shimmer)} />
              <div className="flex flex-wrap gap-2">
                <div className={cn("h-7 w-24 rounded-full", shimmer)} />
                <div className={cn("h-7 w-20 rounded-full", shimmer)} />
                <div className={cn("h-7 w-28 rounded-full", shimmer)} />
                <div className={cn("h-7 w-16 rounded-full", shimmer)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-5">
        <div className={cn("h-[60px] w-[60px] rounded-full border-2 border-error/20 bg-error/10", shimmer)} />
        <div className={cn("h-[50px] w-[50px] rounded-full border-2 border-warning/20 bg-warning/10", shimmer)} />
        <div className={cn("h-[60px] w-[60px] rounded-full border-2 border-success/20 bg-success/10", shimmer)} />
      </div>
    </div>
  );
}
