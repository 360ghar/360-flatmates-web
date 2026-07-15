import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { AnimatePresence, LazyMotion, domMax, m, useReducedMotion } from "framer-motion";
import { EmptyState } from "../ui/StateViews";
import { NetworkImage } from "../ui/NetworkImage";
import { ProgressRing } from "../ui/ProgressRing";
import { TrustBadge } from "../ui/TrustBadge";
import { Badge } from "../ui/Badge";
import { SwipeActionBar } from "../molecules/SwipeActionBar";
import { cn, focusRing } from "../ui/component-utils";
import { CollapsedProfileBadges } from "./CollapsedProfileBadges";
import { SwipeableCard } from "./SwipeableCard";
import { profilePhotos } from "./swipeDeck.utils";
import type { SwipeDeckProps, SwipeDirection, SwipeProfile } from "./swipeDeck.types";

export type { SwipeDeckProps, SwipeProfile } from "./swipeDeck.types";

export function SwipeDeck({
  profiles,
  currentIndex: controlledIndex,
  onPass,
  onLike,
  onSuperLike,
  onExpand,
  onEmptyAction,
  onNearEnd,
  isAnimating: externalAnimating = false,
  onIndexChange,
  multiSelect = false,
  selectedIds,
  onSelectToggle,
  onMultiSelectAction,
  multiSelectActionLabel = "Remove selected",
  className,
  ...props
}: SwipeDeckProps) {
  const prefersReducedMotion = useReducedMotion() === true;
  const [internalIndex, setInternalIndex] = useState(0);
  const currentIndex = controlledIndex ?? internalIndex;
  const [exitDirection, setExitDirection] = useState<SwipeDirection>(null);
  const [isExpanded, setIsExpanded] = useState(() => window.innerWidth >= 768);
  const hasSwipedRef = useRef(false);
  const swipedProfileIdRef = useRef<string | null>(null);

  /* ----- Re-expand card when index changes ----- */
  // Each new card should appear in expanded (scrollable) mode by default on desktop, collapsed on mobile.
  useEffect(() => {
    setIsExpanded(window.innerWidth >= 768); // eslint-disable-line react-hooks/set-state-in-effect
  }, [currentIndex]);

  const current = profiles[currentIndex];
  const behind1 = profiles[currentIndex + 1];
  const behind2 = profiles[currentIndex + 2];

  /* ----- Card replenishment: notify when within 3 of end ----- */
  const nearEndNotified = useRef(false);

  /* ----- Reset/preserve index across deck refetches -----
   * Previously this effect reset `internalIndex` to 0 whenever the deck's
   * profile ids changed (which fired after every swipe because `useSwipeAction`
   * invalidated the deck query). That caused the next card to be skipped and
   * made the deck feel jumpy. The new optimistic update flow keeps the cached
   * ids stable across swipes (the swiped id is removed in-place), so the only
   * time ids truly shift is when the backend returns a brand-new page - and
   * in that case we want the user to keep seeing the next card, not jump back
   * to the top. We therefore NO-OP when ids shift; the optimistic cache is
   * the source of truth, and `nearEndNotified` resets so the UI can re-fire
   * the refill callback when we run low. */
  const prevIdsRef = useRef<string[] | null>(null);
  if (prevIdsRef.current === null) {
    prevIdsRef.current = profiles.map((p) => p.id);
  }
  useEffect(() => {
    const ids = profiles.map((p) => p.id);
    const prev = prevIdsRef.current ?? [];
    const isAppend =
      ids.length >= prev.length &&
      prev.every((id, i) => id === ids[i]);

    if (isAppend) {
      if (ids.length > prev.length) {
        nearEndNotified.current = false;
      }
    } else {
      // Fresh or shifted deck (e.g. after a refill). Don't reset the user's
      // current position - just allow the near-end refill to fire again when
      // we approach the new tail.
      nearEndNotified.current = false;
    }
    prevIdsRef.current = ids;
  }, [profiles]);

  useEffect(() => {
    if (
      profiles.length > 0 &&
      currentIndex >= profiles.length - 3 &&
      !nearEndNotified.current
    ) {
      nearEndNotified.current = true;
      onNearEnd?.();
    }
  }, [currentIndex, profiles.length, onNearEnd]);

  /* ----- Toggle expand handler ----- */
  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  /* ----- Swipe action handler -----
   * The parent owns the `externalAnimating` flag (driven by the swipe
   * API mutation), so we use it as the single source of truth for
   * "is the deck currently animating / mutating". The exit animation
   * drives the index advance via AnimatePresence's `onExitComplete`
   * callback, so there's no 320ms setTimeout race. */
  const performSwipe = useCallback(
    (action: "pass" | "like" | "super_like", profileId: string) => {
      if (externalAnimating) return;

      const direction: SwipeDirection =
        action === "pass" ? "left" : action === "like" ? "right" : "up";
      setExitDirection(direction);
      hasSwipedRef.current = true;
      swipedProfileIdRef.current = profileId;

      if (action === "pass") onPass?.(profileId);
      else if (action === "like") onLike?.(profileId);
      else onSuperLike?.(profileId);
    },
    [externalAnimating, onPass, onLike, onSuperLike]
  );

  /* ----- Advance index when the exit animation finishes -----
   * Guard: the optimistic deck update (removing the swiped card from
   * the TanStack cache) can shrink `profiles` while the exit animation
   * is still in flight. When that happens, incrementing the index
   * would overshoot the shortened array and land on `undefined`,
   * prematurely showing the empty state. We clamp the new index to
   * `profiles.length - 1` and only clear `exitDirection` if we
   * actually advanced. */
  const handleExitComplete = useCallback(() => {
    if (controlledIndex === undefined) {
      const swipedProfileId = swipedProfileIdRef.current;
      // Functional update: reads the latest committed index instead of the
      // closure's `internalIndex`, so two exit-complete firings in the same
      // tick (e.g. a fast double-swipe) each advance from the other's result
      // instead of both computing the same stale `next`.
      setInternalIndex((i) => {
        const activeCardWasRemoved =
          swipedProfileId !== null && profiles[i]?.id !== swipedProfileId;
        const next = activeCardWasRemoved
          ? Math.min(i, Math.max(0, profiles.length - 1))
          : i + 1 < profiles.length
            ? i + 1
            : i;
        onIndexChange?.(next);
        return next;
      });
    } else {
      onIndexChange?.(controlledIndex);
    }
    setExitDirection(null);
    hasSwipedRef.current = false;
    swipedProfileIdRef.current = null;
  }, [controlledIndex, profiles, onIndexChange]);

  /* ----- Empty state ----- */
  if (!current) {
    return (
      <EmptyState
        actionLabel="Explore Listings"
        description="Check back later for new profiles."
        title="No profiles waiting"
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <LazyMotion features={domMax}>
    <section
      aria-label="Profile cards. Use ArrowLeft to pass, ArrowRight to like, ArrowUp to super-like. Press Space to expand profile. Escape to collapse."
      aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp Space Escape"
      tabIndex={0}
      className={cn(
        "mx-auto flex w-full flex-col gap-5 outline-none transition-all duration-300 ease-out",
        isExpanded ? "max-w-[480px] md:max-w-3xl lg:max-w-4xl" : "max-w-[480px]",
        focusRing,
        className
      )}
      onKeyDown={(event) => {
        if (externalAnimating) return;
        // When expanded, only allow horizontal swipe + escape
        if (isExpanded) {
          if (event.key === "Escape") {
            event.preventDefault();
            setIsExpanded(false);
            return;
          }
          if (event.key === "ArrowLeft") performSwipe("pass", current.id);
          if (event.key === "ArrowRight") performSwipe("like", current.id);
          // ArrowUp for super-like disabled when expanded (to avoid conflict with scrolling intent)
          if (event.key === " ") {
            event.preventDefault();
            setIsExpanded(false);
          }
          return;
        }
        if (event.key === "ArrowLeft") performSwipe("pass", current.id);
        if (event.key === "ArrowRight") performSwipe("like", current.id);
        if (event.key === "ArrowUp") performSwipe("super_like", current.id);
        if (event.key === " ") {
          event.preventDefault();
          toggleExpand();
          onExpand?.(current.id);
        }
      }}
      {...props}
    >

      {/* Card container fills available viewport: 100dvh minus header(64) + main-pad(48) + page-pad(32/48) + counter(~28) + gaps(40) + action-bar(~60) + bottom-nav(76 mobile) */}
      <div className="relative h-[calc(100dvh-328px)] md:h-[calc(100dvh-268px)]">
        {/* Background card 2 (furthest back) */}
        <AnimatePresence>
          {behind2 && !isExpanded ? (
            <m.div
              key={`behind2-${behind2.id}`}
              className="absolute inset-x-4 top-4"
              initial={{ scale: 0.85, opacity: 0.3, y: 16 }}
              animate={{ scale: 0.9, opacity: 0.4, y: 12 }}
              exit={{ scale: 0.95, opacity: 0.7, y: 6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <SwipeCard profile={behind2} />
            </m.div>
          ) : null}
        </AnimatePresence>

        {/* Background card 1 (middle) */}
        <AnimatePresence>
          {behind1 && !isExpanded ? (
            <m.div
              key={`behind1-${behind1.id}`}
              className="absolute inset-x-2 top-2"
              initial={{ scale: 0.9, opacity: 0.4, y: 12 }}
              animate={{ scale: 0.95, opacity: 0.7, y: 6 }}
              exit={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <SwipeCard profile={behind1} />
            </m.div>
          ) : null}
        </AnimatePresence>

        {/* Current (top) card with drag gestures */}
        <AnimatePresence custom={exitDirection} mode="popLayout" onExitComplete={handleExitComplete}>
          {current ? (
            <SwipeableCard
              key={current.id}
              profile={current}
              isExpanded={isExpanded}
              disabled={externalAnimating || prefersReducedMotion}
              multiSelect={multiSelect}
              isSelected={!!selectedIds?.includes(current.id)}
              onTapSelect={onSelectToggle ? () => onSelectToggle(current.id) : undefined}
              onSwipePass={() => performSwipe("pass", current.id)}
              onSwipeLike={() => performSwipe("like", current.id)}
              onSwipeSuperLike={() => performSwipe("super_like", current.id)}
              onToggleExpand={() => {
                toggleExpand();
                onExpand?.(current.id);
              }}
              exitDirection={exitDirection}
            />
          ) : null}
        </AnimatePresence>
      </div>
      {multiSelect ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3 shadow-sm"
          role="region"
          aria-label="Multi-select actions"
        >
          <span className="text-body-sm text-ink-2">
            {selectedIds && selectedIds.length > 0
              ? `${selectedIds.length} selected`
              : "Tap a card to select"}
          </span>
          <div className="flex items-center gap-2">
            {selectedIds && selectedIds.length > 0 ? (
              <button
                type="button"
                className="text-body-sm text-ink-3 hover:text-ink"
                onClick={() => selectedIds.forEach((id) => onSelectToggle?.(id))}
              >
                Clear
              </button>
            ) : null}
            <button
              type="button"
              disabled={!selectedIds || selectedIds.length === 0}
              onClick={() => {
                if (selectedIds && selectedIds.length > 0) {
                  onMultiSelectAction?.(selectedIds);
                }
              }}
              className="rounded-full bg-red-600 px-4 py-2 text-label-md font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {multiSelectActionLabel}
            </button>
          </div>
        </div>
      ) : (
        <SwipeActionBar
          onLike={() => performSwipe("like", current.id)}
          onPass={() => performSwipe("pass", current.id)}
          onSuperLike={() => performSwipe("super_like", current.id)}
          disabled={externalAnimating}
        />
      )}
    </section>
    </LazyMotion>
  );
}

function SwipeCard({
  profile,
  className,
  onClick
}: {
  profile: SwipeProfile;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "overflow-hidden rounded-2xl bg-surface text-left shadow-lg",
        className
      )}
      onClick={onClick}
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
      </div>
    </button>
  );
}
