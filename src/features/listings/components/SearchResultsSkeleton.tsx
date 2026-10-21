import { cn } from "@/components/ui/component-utils";
import { ListingCardSkeleton, SkeletonRoot, shimmer } from "@/components/ui/Skeleton";

/** Loading stand-in shaped like the real page. */
export function SearchResultsSkeleton({ className }: { className?: string }) {
  return (
    <SkeletonRoot className={cn(className)}>
      <SearchResultsBones />
    </SkeletonRoot>
  );
}

function SearchResultsBones() {
  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden flex-col gap-5 rounded-hand bg-surface p-4 lg:flex">
        {Array.from({ length: 3 }, (_, s) => (
          <div key={s} className="flex flex-col gap-2">
            <div className={cn("h-4 w-20 rounded-sm", shimmer)} />
            {Array.from({ length: 4 }, (_, c) => (
              <div key={c} className={cn("h-4 w-3/5 rounded-sm", shimmer)} />
            ))}
          </div>
        ))}
      </aside>
      <div className="flex flex-col gap-4">
        <div className={cn("h-3 w-24 rounded-sm", shimmer)} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
