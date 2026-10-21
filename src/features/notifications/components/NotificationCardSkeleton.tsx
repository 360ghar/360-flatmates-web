import { cn } from "@/components/ui/component-utils";
import { SkeletonRoot, shimmer } from "@/components/ui/Skeleton";

/** Loading stand-in for the real layout; `count` repeats it, `className` lays the copies out. */
export function NotificationCardSkeleton({ count = 1, className }: { count?: number; className?: string }) {
  return (
    <SkeletonRoot className={count > 1 && !className ? "flex flex-col gap-3" : className}>
      {Array.from({ length: count }, (_, i) => (
        <NotificationCardBones key={i} />
      ))}
    </SkeletonRoot>
  );
}

/** Matches NotificationCard */
function NotificationCardBones() {
  return (
    <div className="flex items-start gap-3 rounded-hand bg-surface p-4 shadow-sm">
      <div className={cn("h-12 w-12 shrink-0 rounded-full", shimmer)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className={cn("h-[15px] w-3/5 rounded-sm", shimmer)} />
        <div className={cn("h-3 w-full rounded-sm", shimmer)} />
        <div className={cn("h-3 w-4/5 rounded-sm", shimmer)} />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <div className={cn("h-3 w-10 rounded-sm", shimmer)} />
        <div className={cn("h-2.5 w-2.5 rounded-full", shimmer)} />
      </div>
    </div>
  );
}

/** Matches ConversationRow */
