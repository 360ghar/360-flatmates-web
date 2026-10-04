import { cn } from "@/components/ui/component-utils";
import { ProfileGridCardBones } from "@/features/matches/components/ProfileGridCardSkeleton";
import { ListingCardSkeleton, SkeletonRoot, shimmer } from "@/components/ui/Skeleton";

/** Loading stand-in shaped like the real page. */
export function HomeFeedSkeleton({ className }: { className?: string }) {
  return (
    <SkeletonRoot className={cn(className)}>
      <HomeFeedBones />
    </SkeletonRoot>
  );
}

/**
 * Home feed sections only (hero + real SearchBar/chips stay outside).
 * Fixed-width carousel cards match loaded Home sections.
 */
function HomeFeedBones() {
  return (
    <div className="flex flex-col gap-6">
      {HOME_FEED_SKELETON_SECTIONS.map((section) => (
        <section key={section.key} className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className={cn("h-4 w-32 rounded-full", shimmer)} />
            <div className={cn("h-3 w-14 rounded-full", shimmer)} />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="w-[180px] shrink-0 sm:w-[200px] md:w-[220px] lg:w-auto"
              >
                {section.card === "listing" ? <ListingCardSkeleton /> : <ProfileGridCardBones />}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Full-bleed map placeholder with FABs */

const HOME_FEED_SKELETON_SECTIONS: Array<{ key: string; card: "profile" | "listing" }> = [
  { key: "recommended", card: "profile" },
  { key: "listings", card: "listing" },
  { key: "nearby", card: "profile" },
];

/**
 * Home feed sections only (hero + real SearchBar/chips stay outside).
 * Fixed-width carousel cards match loaded Home sections.
 */
