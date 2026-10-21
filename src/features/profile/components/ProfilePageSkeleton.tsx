import { cn } from "@/components/ui/component-utils";
import { SkeletonRoot, shimmer } from "@/components/ui/Skeleton";

/** Loading stand-in shaped like the real page. */
export function ProfilePageSkeleton({ className }: { className?: string }) {
  return (
    <SkeletonRoot className={cn(className)}>
      <ProfilePageBones />
    </SkeletonRoot>
  );
}

/** Profile settings page */
function ProfilePageBones() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 rounded-hand bg-surface p-6 text-center shadow-sm">
        <div className={cn("h-[120px] w-[120px] rounded-cut-md", shimmer)} />
        <div className={cn("h-7 w-24 rounded-sm", shimmer)} />
        <div className={cn("h-4 w-32 rounded-sm", shimmer)} />
        <div className="flex gap-2">
          <div className={cn("h-5 w-16 rounded-full", shimmer)} />
          <div className={cn("h-5 w-16 rounded-full", shimmer)} />
        </div>
      </div>
      <div className="overflow-hidden rounded-hand bg-surface shadow-sm">
        <MenuItemRowBones />
      </div>
      <div className={cn("h-3 w-14 rounded-sm", shimmer)} />
      <div className="overflow-hidden rounded-hand bg-surface shadow-sm">
        <MenuItemRowBones />
        <MenuItemRowBones />
      </div>
      <div className={cn("h-3 w-20 rounded-sm", shimmer)} />
      <div className="overflow-hidden rounded-hand bg-surface shadow-sm">
        <MenuItemRowBones />
      </div>
      <div className="flex items-center justify-between rounded-hand bg-surface p-4 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <div className={cn("h-5 w-16 rounded-sm", shimmer)} />
          <div className={cn("h-3 w-32 rounded-sm", shimmer)} />
        </div>
        <div className={cn("h-8 w-14 rounded-full", shimmer)} />
      </div>
      <div className={cn("h-3 w-24 rounded-sm", shimmer)} />
      <div className="overflow-hidden rounded-hand bg-surface shadow-sm">
        <MenuItemRowBones />
        <MenuItemRowBones />
      </div>
      <div className={cn("h-3 w-16 rounded-sm", shimmer)} />
      <div className="overflow-hidden rounded-hand bg-surface shadow-sm">
        <MenuItemRowBones />
        <MenuItemRowBones />
      </div>
    </div>
  );
}

/** Generic form page: optional header bones + field rows + CTAs */

/** Matches MenuItemRow — icon container + label + chevron */
function MenuItemRowBones() {
  return (
    <div className="flex h-14 items-center gap-3 border-b border-line px-2 py-2 last:border-b-0">
      <div className={cn("h-10 w-10 shrink-0 rounded-cut-md", shimmer)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className={cn("h-[15px] w-2/5 rounded-sm", shimmer)} />
      </div>
      <div className={cn("h-5 w-5 shrink-0 rounded-sm", shimmer)} />
    </div>
  );
}

/** Matches NotificationCard */
