import { cn } from "@/components/ui/component-utils";
import { SkeletonRoot, shimmer } from "@/components/ui/Skeleton";

/** Loading stand-in shaped like the real page. */
export function MapExploreSkeleton({ className }: { className?: string }) {
  return (
    <SkeletonRoot className={cn("h-full w-full", className)}>
      <MapExploreBones />
    </SkeletonRoot>
  );
}

/** Full-bleed map placeholder with FABs */
function MapExploreBones() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-surface-soft">
      <div className="map-grid-bg absolute inset-0 opacity-60" />
      <div className={cn("absolute inset-0 opacity-40", shimmer)} />
      {/* Soft pin dots */}
      <div className="absolute left-[28%] top-[38%] h-3 w-3 rounded-full bg-accent/30" />
      <div className="absolute left-[55%] top-[48%] h-3 w-3 rounded-full bg-accent/25" />
      <div className="absolute left-[42%] top-[62%] h-3 w-3 rounded-full bg-accent/20" />
      <div className="absolute bottom-6 right-6 flex flex-col gap-3">
        <div className={cn("h-12 w-12 rounded-full border border-line bg-surface shadow-sm", shimmer)} />
        <div className={cn("h-12 w-12 rounded-full border border-line bg-surface shadow-sm", shimmer)} />
      </div>
    </div>
  );
}

/** Chat detail: header + messages + composer */
