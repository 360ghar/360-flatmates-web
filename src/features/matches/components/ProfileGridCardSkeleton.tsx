import { cn } from "@/components/ui/component-utils";
import { SkeletonRoot, shimmer } from "@/components/ui/Skeleton";

/** Loading stand-in for the real layout; `count` repeats it, `className` lays the copies out. */
export function ProfileGridCardSkeleton({ count = 1, className }: { count?: number; className?: string }) {
  return (
    <SkeletonRoot className={count > 1 && !className ? "flex flex-col gap-3" : className}>
      {Array.from({ length: count }, (_, i) => (
        <ProfileGridCardBones key={i} />
      ))}
    </SkeletonRoot>
  );
}

/** Matches ProfileGridCard compact default — 3:4 photo + match ring + CTA */
export function ProfileGridCardBones() {
  return (
    <div className="overflow-hidden rounded-hand bg-surface shadow-sm">
      <div className="relative">
        <div className={cn("aspect-[3/4] w-full", shimmer)} />
        <div className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface/95 p-0.5 shadow-xs" />
      </div>
      <div className="bg-surface p-2.5">
        <div className={cn("h-[15px] w-3/5 rounded-sm", shimmer)} />
        <div className={cn("mt-0.5 h-3 w-2/5 rounded-sm", shimmer)} />
        <div className={cn("mt-0.5 h-3 w-1/3 rounded-sm", shimmer)} />
        <div className={cn("mt-2 h-9 w-full rounded-full", shimmer)} />
      </div>
    </div>
  );
}

/** Matches MenuItemRow — icon container + label + chevron */
