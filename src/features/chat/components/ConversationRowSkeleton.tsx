import { cn } from "@/components/ui/component-utils";
import { SkeletonRoot, shimmer } from "@/components/ui/Skeleton";

/** Loading stand-in for the real layout; `count` repeats it, `className` lays the copies out. */
export function ConversationRowSkeleton({ count = 1, className }: { count?: number; className?: string }) {
  return (
    <SkeletonRoot className={count > 1 && !className ? "flex flex-col gap-3" : className}>
      {Array.from({ length: count }, (_, i) => (
        <ConversationRowBones key={i} />
      ))}
    </SkeletonRoot>
  );
}

/** Matches ConversationRow */
function ConversationRowBones() {
  return (
    <div className="flex min-h-[72px] items-center gap-3 rounded-cut-md px-3 py-2">
      <div className={cn("h-[52px] w-[52px] shrink-0 rounded-cut-md", shimmer)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className={cn("h-4 w-24 rounded-sm", shimmer)} />
          <div className={cn("h-4 w-10 rounded-full", shimmer)} />
        </div>
        <div className={cn("h-3 w-3/4 rounded-sm", shimmer)} />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className={cn("h-3 w-10 rounded-sm", shimmer)} />
      </div>
    </div>
  );
}

/** Matches VisitCard */
