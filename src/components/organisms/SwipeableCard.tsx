import { useCallback, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import {
  m,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo
} from "framer-motion";
import { Badge } from "../ui/Badge";
import { NetworkImage } from "../ui/NetworkImage";
import { ProgressRing } from "../ui/ProgressRing";
import { TrustBadge } from "../ui/TrustBadge";
import { cn } from "../ui/component-utils";
import { SwipeCardCollapsedView } from "./SwipeCardCollapsedView";
import { SwipeProfileExpandedBody } from "./SwipeProfileExpandedBody";
import type { SwipeDirection, SwipeProfile } from "./swipeDeck.types";
import {
  EXPANDED_SWIPE_THRESHOLD_X,
  EXPANDED_SWIPE_VELOCITY_X,
  MAX_ROTATION,
  ROTATION_RANGE,
  SWIPE_THRESHOLD_X,
  SWIPE_THRESHOLD_Y,
  SWIPE_VELOCITY_X,
  SWIPE_VELOCITY_Y,
  getExitAnimation,
  profilePhotos
} from "./swipeDeck.utils";

export function SwipeableCard({
  profile,
  isExpanded,
  disabled,
  multiSelect = false,
  isSelected = false,
  onTapSelect,
  onSwipePass,
  onSwipeLike,
  onSwipeSuperLike,
  onToggleExpand,
  exitDirection
}: {
  profile: SwipeProfile;
  isExpanded: boolean;
  disabled: boolean;
  multiSelect?: boolean;
  isSelected?: boolean;
  onTapSelect?: () => void;
  onSwipePass: () => void;
  onSwipeLike: () => void;
  onSwipeSuperLike: () => void;
  onToggleExpand: () => void;
  exitDirection: SwipeDirection;
}) {
  const prefersReducedMotion = useReducedMotion() === true;
  const scrollRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  /* ----- Derived motion values ----- */
  const rotate = useTransform(x, [-ROTATION_RANGE, ROTATION_RANGE], [-MAX_ROTATION, MAX_ROTATION]);
  const likeOpacity = useTransform(x, [0, 100, 200], [0, 0.5, 1]);
  const passOpacity = useTransform(x, [-200, -100, 0], [1, 0.5, 0]);
  const superLikeOpacity = useTransform(y, [-200, -80, 0], [1, 0.5, 0]);

  /* ----- Drag end handler ----- */
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offsetX = info.offset.x;
      const offsetY = info.offset.y;
      const velocityX = info.velocity.x;
      const velocityY = info.velocity.y;

      // Use higher thresholds when expanded
      const thresholdX = isExpanded ? EXPANDED_SWIPE_THRESHOLD_X : SWIPE_THRESHOLD_X;
      const velocityThresholdX = isExpanded ? EXPANDED_SWIPE_VELOCITY_X : SWIPE_VELOCITY_X;

      // Like: swipe right
      if (offsetX > thresholdX || velocityX > velocityThresholdX) {
        onSwipeLike();
        return;
      }

      // Pass: swipe left
      if (offsetX < -thresholdX || velocityX < -velocityThresholdX) {
        onSwipePass();
        return;
      }

      // Super Like: swipe up (only when collapsed, to avoid conflict with scroll)
      if (!isExpanded && offsetY < -SWIPE_THRESHOLD_Y && velocityY < -SWIPE_VELOCITY_Y) {
        onSwipeSuperLike();
        return;
      }
    },
    [onSwipeLike, onSwipePass, onSwipeSuperLike, isExpanded]
  );

  /* ----- Check if profile has any expanded content ----- */
  const hasListing =
    Boolean(profile.propertyTitle) ||
    profile.monthlyRent != null ||
    (profile.imageUrls && profile.imageUrls.length > 0) ||
    Boolean(profile.roomType) ||
    Boolean(profile.flatConfig);
  const hasExpandedContent = !!(
    profile.bio ||
    profile.profession ||
    profile.budgetMin !== undefined ||
    profile.budgetMax !== undefined ||
    profile.moveInTimeline ||
    profile.sleepSchedule ||
    profile.cleanliness ||
    profile.foodHabits ||
    profile.smokingDrinking ||
    profile.guestsPolicy ||
    profile.workStyle ||
    profile.partyHabit ||
    profile.genderPreference ||
    (profile.nonNegotiables && profile.nonNegotiables.length > 0) ||
    profile.hasPets !== undefined ||
    (profile.compatibilityDimensions && profile.compatibilityDimensions.length > 0) ||
    hasListing
  );

  return (
    <m.div
      className="absolute inset-0 z-10"
      style={{ x, y, rotate }}
      drag={disabled ? false : "x"}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={isExpanded ? 0.4 : 0.7}
      onDragEnd={handleDragEnd}
      whileHover={
        prefersReducedMotion
          ? undefined
          : { y: -2, boxShadow: "var(--shadow-hover)" }
      }
      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
      initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }}
      animate={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }}
      exit={getExitAnimation(exitDirection)}
      transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
    >
      <div
        className={cn(
          "h-full w-full overflow-hidden rounded-2xl bg-surface text-left shadow-lg relative",
          "transition-shadow duration-150 ease-out",
          "hover:shadow-hover",
          isSelected && "ring-4 ring-accent"
        )}
      >
        {multiSelect && onTapSelect ? (
          <button
            type="button"
            onClick={onTapSelect}
            aria-pressed={isSelected}
            aria-label={
              isSelected
                ? `Deselect ${profile.name}`
                : `Select ${profile.name}`
            }
            className="absolute inset-0 z-20 flex items-start justify-end p-3"
            data-testid={`select-card-${profile.id}`}
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
                isSelected
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-surface/80 text-ink-2"
              )}
            >
              {isSelected ? (
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    d="M2 7L5.5 10.5L12 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </span>
          </button>
        ) : null}
        {isExpanded ? (
          /* ---- EXPANDED VIEW: Side-by-side on desktop/tablet, full-scroll on mobile ---- */
          <div className="flex h-full flex-col md:flex-row overflow-y-auto md:overflow-hidden" aria-expanded="true">
            {/* Left/Top: Photo */}
            <div className="relative h-[220px] shrink-0 md:h-full md:w-[40%] lg:w-[45%]">
              <ProfilePhotoCarousel profile={profile} />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink/60 md:bg-gradient-to-t" />
              <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
                {profile.mode ? <Badge mode={profile.mode} variant="mode" /> : null}
              </div>
              <div className="pointer-events-none absolute right-4 top-4 flex flex-col items-end gap-2">
                <div className="rounded-full bg-surface/90 backdrop-blur-xs p-1 shadow-xs">
                  <ProgressRing size="lg" value={profile.matchScore} label="Compatibility score" />
                </div>
                {profile.verified ? <TrustBadge /> : null}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <h2 className="text-h2 font-normal leading-tight">
                  {profile.name}
                  {profile.age ? `, ${profile.age}` : ""}
                </h2>
                {profile.location ? (
                  <p className="mt-0.5 flex items-center gap-1.5 text-body-md text-white/90">
                    <MapPin aria-hidden="true" className="h-4 w-4" />
                    {profile.location}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Right/Bottom: Details */}
            <div className="flex flex-1 flex-col overflow-y-auto md:h-full min-w-0">
              {/* Collapse handle / bar */}
              <button
                type="button"
                onClick={onToggleExpand}
                aria-label="Collapse profile details"
                className={cn(
                  "flex shrink-0 items-center justify-center py-2.5 md:py-3 border-b border-line/40 bg-surface z-10 sticky top-0",
                  "text-ink-3 hover:text-ink-2 transition-colors duration-150"
                )}
              >
                <div className="h-1.5 w-10 rounded-full bg-ink-4/80" />
              </button>

              {/* Scrollable details body */}
              <div
                ref={scrollRef}
                role="region"
                aria-label="Profile details"
                className="swipe-card-scroll flex-1 px-5 py-4 space-y-6 md:pb-6 scrollbar-thin"
              >
                <SwipeProfileExpandedBody profile={profile} />
                <div className="h-4" />
              </div>
            </div>
          </div>
        ) : (
          /* ---- COLLAPSED VIEW: Full-bleed photo with overlay ---- */
          <SwipeCardCollapsedView
            profile={profile}
            onToggleExpand={onToggleExpand}
            hasExpandedContent={hasExpandedContent}
            likeOpacity={likeOpacity}
            passOpacity={passOpacity}
            superLikeOpacity={superLikeOpacity}
          />
        )}
      </div>
    </m.div>
  );
}

/** Simple photo carousel for swipe hero (non-interactive dots + tap zones). */
function ProfilePhotoCarousel({
  profile,
  className
}: {
  profile: SwipeProfile;
  className?: string;
}) {
  const photos = profilePhotos(profile);
  const [index, setIndex] = useState(0);
  const safeIndex = photos.length > 0 ? Math.min(index, photos.length - 1) : 0;
  const src = photos[safeIndex] ?? profile.photoUrl;

  return (
    <div className={cn("relative h-full w-full", className)}>
      <NetworkImage
        alt={profile.name}
        src={src}
        width={800}
        wrapperClassName="h-full w-full object-cover"
      />
      {photos.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            className="absolute inset-y-0 left-0 w-1/3 z-[1]"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i - 1 + photos.length) % photos.length);
            }}
          />
          <button
            type="button"
            aria-label="Next photo"
            className="absolute inset-y-0 right-0 w-1/3 z-[1]"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i + 1) % photos.length);
            }}
          />
          <div className="absolute bottom-20 left-0 right-0 z-[1] flex justify-center gap-1.5 pointer-events-none">
            {photos.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  i === safeIndex ? "bg-white" : "bg-white/40"
                )}
              />
            ))}
          </div>
          <span className="absolute top-3 left-1/2 -translate-x-1/2 z-[1] rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
            {safeIndex + 1}/{photos.length}
          </span>
        </>
      ) : null}
    </div>
  );
}
