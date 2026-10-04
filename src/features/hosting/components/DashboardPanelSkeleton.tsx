import { cn } from "@/components/ui/component-utils";
import { SkeletonRoot, shimmer } from "@/components/ui/Skeleton";

/** Loading stand-in shaped like the real page. */
export function DashboardPanelSkeleton({ className }: { className?: string }) {
  return (
    <SkeletonRoot className={cn(className)}>
      <DashboardPanelBones />
    </SkeletonRoot>
  );
}

/** Dashboard / analytics: stats + table */
function DashboardPanelBones() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatCardBones key={i} />
        ))}
      </div>
      <div className="rounded-hand bg-surface p-4 shadow-sm">
        <div className={cn("mb-4 h-5 w-32 rounded-sm", shimmer)} />
        <div className="mb-3 flex gap-4 border-b border-line pb-2">
          <div className={cn("h-3 w-20 rounded-sm", shimmer)} />
          <div className={cn("h-3 w-10 rounded-sm", shimmer)} />
          <div className={cn("h-3 w-10 rounded-sm", shimmer)} />
          <div className={cn("h-3 w-10 rounded-sm", shimmer)} />
        </div>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line py-3 last:border-b-0">
            <div className={cn("h-4 w-24 rounded-sm", shimmer)} />
            <div className={cn("ml-auto h-4 w-8 rounded-sm", shimmer)} />
            <div className={cn("h-4 w-8 rounded-sm", shimmer)} />
            <div className={cn("h-4 w-12 rounded-sm", shimmer)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Admin moderation list row */

/** Matches StatCard */
function StatCardBones() {
  return (
    <div className="rounded-hand bg-surface p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className={cn("h-12 w-12 shrink-0 rounded-cut-md", shimmer)} />
        <div className="flex min-w-0 flex-col gap-2">
          <div className={cn("h-3 w-16 rounded-sm", shimmer)} />
          <div className={cn("h-8 w-20 rounded-cut-sm", shimmer)} />
          <div className={cn("h-3 w-24 rounded-sm", shimmer)} />
        </div>
      </div>
    </div>
  );
}

/** Matches ChatMessageBubble — left or right */
