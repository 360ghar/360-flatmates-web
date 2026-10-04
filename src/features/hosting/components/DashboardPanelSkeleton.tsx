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

/** Dashboard / analytics: stats + table (desktop) / cards (mobile) */
function DashboardPanelBones() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatCardBones key={i} />
        ))}
      </div>
      {/* Desktop table skeleton */}
      <div className="hidden rounded-hand bg-surface p-4 shadow-sm lg:block">
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
      {/* Mobile card-row skeleton (matches the lg:hidden card view) */}
      <div className="flex flex-col gap-3 lg:hidden">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-hand bg-surface p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className={cn("h-4 w-2/3 rounded-sm", shimmer)} />
              <div className={cn("h-5 w-14 rounded-full", shimmer)} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className={cn("h-9 rounded-cut-sm", shimmer)} />
              <div className={cn("h-9 rounded-cut-sm", shimmer)} />
              <div className={cn("h-9 rounded-cut-sm", shimmer)} />
            </div>
            <div className="mt-3 flex gap-2">
              <div className={cn("h-7 w-16 rounded-cut-sm", shimmer)} />
              <div className={cn("h-7 w-16 rounded-cut-sm", shimmer)} />
              <div className={cn("h-7 w-16 rounded-cut-sm", shimmer)} />
            </div>
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
