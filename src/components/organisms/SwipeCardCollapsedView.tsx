import { ChevronDown, MapPin } from "lucide-react";
import { m, type MotionValue } from "framer-motion";
import { Badge } from "../ui/Badge";
import { NetworkImage } from "../ui/NetworkImage";
import { ProgressRing } from "../ui/ProgressRing";
import { TrustBadge } from "../ui/TrustBadge";
import { CollapsedProfileBadges } from "./CollapsedProfileBadges";
import type { SwipeProfile } from "./swipeDeck.types";
import { profilePhotos } from "./swipeDeck.utils";

export function SwipeCardCollapsedView({
  profile,
  onToggleExpand,
  hasExpandedContent,
  likeOpacity,
  passOpacity,
  superLikeOpacity
}: {
  profile: SwipeProfile;
  onToggleExpand: () => void;
  hasExpandedContent: boolean;
  likeOpacity: MotionValue<number>;
  passOpacity: MotionValue<number>;
  superLikeOpacity: MotionValue<number>;
}) {
  return (
    <button
      type="button"
      className="h-full w-full text-left"
      onClick={onToggleExpand}
      aria-label={`View ${profile.name}'s profile details`}
      aria-expanded="false"
    >
      <div className="relative h-full">
        <NetworkImage
          alt={profile.name}
          src={profilePhotos(profile)[0] ?? profile.photoUrl}
          width={800}
          wrapperClassName="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-accent/40" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {profile.mode ? <Badge mode={profile.mode} variant="mode" /> : null}
        </div>
        <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
          <div className="rounded-full bg-surface p-1 shadow-xs">
            <ProgressRing size="lg" value={profile.matchScore} label="Compatibility score" />
          </div>
          {profile.verified ? <TrustBadge /> : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <h2 className="text-h2 font-normal">
            {profile.name}
            {profile.age ? `, ${profile.age}` : ""}
          </h2>
          {profile.location ? (
            <p className="mt-1 flex items-center gap-1.5 text-body-md text-white/80">
              <MapPin aria-hidden="true" className="h-4 w-4" />
              {profile.location}
            </p>
          ) : null}

          <CollapsedProfileBadges profile={profile} />
        </div>

        {/* "See more" affordance */}
        {hasExpandedContent ? (
          <div className="absolute inset-x-0 bottom-0 flex justify-center pb-2 pt-8 bg-gradient-to-t from-ink/30 to-transparent">
            <ChevronDown
              aria-hidden="true"
              className="h-5 w-5 animate-bounce text-white/70"
            />
          </div>
        ) : null}

        {/* LIKE overlay */}
        <m.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ opacity: likeOpacity }}
        >
          <span
            className="border-[3px] border-success text-success select-none rounded-sm px-6 py-2 text-3xl font-bold tracking-widest -rotate-15"
            aria-hidden="true"
          >
            LIKE
          </span>
        </m.div>

        {/* PASS overlay */}
        <m.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ opacity: passOpacity }}
        >
          <span
            className="border-[3px] border-error text-error select-none rounded-sm px-6 py-2 text-3xl font-bold tracking-widest rotate-15"
            aria-hidden="true"
          >
            PASS
          </span>
        </m.div>

        {/* SUPER LIKE overlay */}
        <m.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ opacity: superLikeOpacity }}
        >
          <span
            className="border-[3px] border-warning text-warning select-none rounded-sm px-4 py-2 text-2xl font-bold tracking-widest"
            aria-hidden="true"
          >
            SUPER LIKE
          </span>
        </m.div>
      </div>
    </button>
  );
}
