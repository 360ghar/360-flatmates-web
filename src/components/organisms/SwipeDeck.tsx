import {
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import {
  Briefcase,
  ChevronDown,
  Clock,
  MapPin,
  Moon,
  PawPrint,
  ShieldAlert,
  Sparkles,
  Utensils,
  UserCircle,
  Wind,
  Users,
  Home,
  PartyPopper
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo
} from "framer-motion";
import { Badge, type UserMode } from "../ui/Badge";
import { EmptyState } from "../ui/StateViews";
import { NetworkImage } from "../ui/NetworkImage";
import { ProgressRing } from "../ui/ProgressRing";
import { TrustBadge } from "../ui/TrustBadge";
import { Chip } from "../ui/Chip";
import { SwipeActionBar } from "../molecules/SwipeActionBar";
import { cn, focusRing } from "../ui/component-utils";
import {
  formatBudgetRange,
  formatLifestyleLabel,
  formatMoveInTimeline
} from "@/lib/utils/format";
import { NON_NEGOTIABLE_OPTIONS } from "@/lib/data";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface SwipeProfile {
  id: string;
  name: string;
  age?: number;
  photoUrl?: string | null;
  mode?: UserMode;
  verified?: boolean;
  location?: string;
  matchScore: number;
  topMatches?: string[];
  moveInLabel?: string;
  /* Rich profile fields for expanded view */
  bio?: string;
  profession?: string;
  budgetMin?: number;
  budgetMax?: number;
  moveInTimeline?: string;
  sleepSchedule?: string;
  cleanliness?: string;
  foodHabits?: string;
  smokingDrinking?: string;
  guestsPolicy?: string;
  workStyle?: string;
  gender?: string;
  genderPreference?: string;
  nonNegotiables?: string[];
  hasPets?: boolean;
  partyHabit?: string;
  details?: ReactNode;
}

export interface SwipeDeckProps extends HTMLAttributes<HTMLDivElement> {
  profiles: SwipeProfile[];
  currentIndex?: number;
  onPass?: (profileId: string) => void;
  onLike?: (profileId: string) => void;
  onSuperLike?: (profileId: string) => void;
  onExpand?: (profileId: string) => void;
  onEmptyAction?: () => void;
  /** Callback when the deck is running low on cards (within 3 of the end) */
  onNearEnd?: () => void;
  /** Controlled by SwipePage to disable gestures during API mutation */
  isAnimating?: boolean;
  /** Called when the active card index changes (for keyboard swipe integration) */
  onIndexChange?: (index: number) => void;
}

type SwipeDirection = "left" | "right" | "up" | null;

/* -------------------------------------------------------------------------- */
/*  Swipe thresholds                                                          */
/* -------------------------------------------------------------------------- */

const SWIPE_THRESHOLD_X = 120;
const SWIPE_VELOCITY_X = 500;
const SWIPE_THRESHOLD_Y = 80;
const SWIPE_VELOCITY_Y = 400;
const MAX_ROTATION = 15;
const ROTATION_RANGE = 200;

// Slightly higher thresholds when expanded to avoid accidental swipes while scrolling
const EXPANDED_SWIPE_THRESHOLD_X = 160;
const EXPANDED_SWIPE_VELOCITY_X = 600;

/* -------------------------------------------------------------------------- */
/*  Lifestyle icon/label config                                               */
/* -------------------------------------------------------------------------- */

const LIFESTYLE_ITEMS = [
  { key: "sleepSchedule" as const, icon: Moon, label: "Sleep Schedule" },
  { key: "cleanliness" as const, icon: Sparkles, label: "Cleanliness" },
  { key: "foodHabits" as const, icon: Utensils, label: "Food Habits" },
  { key: "smokingDrinking" as const, icon: Wind, label: "Smoking / Drinking" },
  { key: "guestsPolicy" as const, icon: Users, label: "Guests Policy" },
  { key: "workStyle" as const, icon: Home, label: "Work Style" },
  { key: "partyHabit" as const, icon: PartyPopper, label: "Party Habit" }
] as const;

/* -------------------------------------------------------------------------- */
/*  Animation variants                                                        */
/* -------------------------------------------------------------------------- */

function getExitAnimation(direction: SwipeDirection) {
  const xTarget = direction === "right" ? 500 : direction === "left" ? -500 : 0;
  const yTarget = direction === "up" ? -500 : 0;
  const rotateTarget =
    direction === "right" ? MAX_ROTATION : direction === "left" ? -MAX_ROTATION : 0;

  return {
    x: xTarget,
    y: yTarget,
    rotate: rotateTarget,
    opacity: 0,
    transition: { duration: 0.3, ease: "easeOut" as const }
  };
}

/* -------------------------------------------------------------------------- */
/*  SwipeDeck                                                                  */
/* -------------------------------------------------------------------------- */

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
  className,
  ...props
}: SwipeDeckProps) {
  const prefersReducedMotion = useReducedMotion() === true;
  const [internalIndex, setInternalIndex] = useState(0);
  const currentIndex = controlledIndex ?? internalIndex;
  const [animating, setAnimating] = useState(false);
  const [exitDirection, setExitDirection] = useState<SwipeDirection>(null);
  const [isExpanded, setIsExpanded] = useState(() => window.innerWidth >= 768);
  const hasSwipedRef = useRef(false);

  /* ----- Notify parent of index changes ----- */
  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

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
  const prevProfileCount = useRef(profiles.length);

  useEffect(() => {
    if (profiles.length > prevProfileCount.current) {
      nearEndNotified.current = false;
    }
    prevProfileCount.current = profiles.length;
  }, [profiles.length]);

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

  /* ----- Swipe action handler ----- */
  const performSwipe = useCallback(
    (action: "pass" | "like" | "super_like", profileId: string) => {
      if (animating || externalAnimating) return;

      const direction: SwipeDirection =
        action === "pass" ? "left" : action === "like" ? "right" : "up";
      setExitDirection(direction);
      setAnimating(true);
      hasSwipedRef.current = true;

      if (action === "pass") onPass?.(profileId);
      else if (action === "like") onLike?.(profileId);
      else onSuperLike?.(profileId);

      setTimeout(() => {
        if (controlledIndex === undefined) {
          setInternalIndex((i) => i + 1);
        }
        setAnimating(false);
        setExitDirection(null);
        hasSwipedRef.current = false;
      }, 320);
    },
    [animating, externalAnimating, controlledIndex, onPass, onLike, onSuperLike]
  );

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
    <section
      role="region"
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
        if (animating || externalAnimating) return;
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
      <div className="text-center text-caption text-ink-3">
        {profiles.length - currentIndex} of {profiles.length} remaining
      </div>
      {/* Card container fills available viewport: 100dvh minus header(64) + main-pad(48) + page-pad(32/48) + counter(~28) + gaps(40) + action-bar(~60) + bottom-nav(76 mobile) */}
      <div className="relative h-[calc(100dvh-328px)] md:h-[calc(100dvh-268px)]">
        {/* Background card 2 (furthest back) */}
        <AnimatePresence>
          {behind2 && !isExpanded ? (
            <motion.div
              key={`behind2-${behind2.id}`}
              className="absolute inset-x-4 top-4"
              initial={{ scale: 0.85, opacity: 0.3, y: 16 }}
              animate={{ scale: 0.9, opacity: 0.4, y: 12 }}
              exit={{ scale: 0.95, opacity: 0.7, y: 6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <SwipeCard profile={behind2} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Background card 1 (middle) */}
        <AnimatePresence>
          {behind1 && !isExpanded ? (
            <motion.div
              key={`behind1-${behind1.id}`}
              className="absolute inset-x-2 top-2"
              initial={{ scale: 0.9, opacity: 0.4, y: 12 }}
              animate={{ scale: 0.95, opacity: 0.7, y: 6 }}
              exit={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <SwipeCard profile={behind1} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Current (top) card with drag gestures */}
        <AnimatePresence custom={exitDirection} mode="popLayout">
          {current ? (
            <SwipeableCard
              key={current.id}
              profile={current}
              isExpanded={isExpanded}
              disabled={animating || externalAnimating || prefersReducedMotion}
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
      <SwipeActionBar
        onLike={() => performSwipe("like", current.id)}
        onPass={() => performSwipe("pass", current.id)}
        onSuperLike={() => performSwipe("super_like", current.id)}
        disabled={animating || externalAnimating}
      />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SwipeableCard — top card with drag / gesture support                      */
/* -------------------------------------------------------------------------- */

function SwipeableCard({
  profile,
  isExpanded,
  disabled,
  onSwipePass,
  onSwipeLike,
  onSwipeSuperLike,
  onToggleExpand,
  exitDirection
}: {
  profile: SwipeProfile;
  isExpanded: boolean;
  disabled: boolean;
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
    profile.genderPreference ||
    (profile.nonNegotiables && profile.nonNegotiables.length > 0) ||
    profile.hasPets !== undefined
  );

  return (
    <motion.div
      className="absolute inset-0 z-10"
      style={{ x, y, rotate }}
      drag={disabled ? false : "x"}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={isExpanded ? 0.4 : 0.7}
      onDragEnd={handleDragEnd}
      whileHover={
        prefersReducedMotion
          ? undefined
          : { y: -2, boxShadow: "0 4px 16px rgba(201,100,66,0.08)" }
      }
      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
      initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }}
      animate={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }}
      exit={getExitAnimation(exitDirection)}
      transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
    >
      <div
        className={cn(
          "h-full w-full overflow-hidden rounded-2xl bg-surface text-left shadow-lg",
          "transition-shadow duration-150 ease-out",
          "hover:shadow-[0_4px_16px_rgba(201,100,66,0.08)]"
        )}
      >
        {isExpanded ? (
          /* ---- EXPANDED VIEW: Side-by-side on desktop/tablet, full-scroll on mobile ---- */
          <div className="flex h-full flex-col md:flex-row overflow-y-auto md:overflow-hidden" aria-expanded="true">
            {/* Left/Top: Photo */}
            <div className="relative h-[220px] shrink-0 md:h-full md:w-[40%] lg:w-[45%]">
              <NetworkImage
                alt={profile.name}
                src={profile.photoUrl}
                width={800}
                wrapperClassName="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink/60 md:bg-gradient-to-t" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                {profile.mode ? <Badge mode={profile.mode} variant="mode" /> : null}
              </div>
              <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
                <div className="rounded-full bg-surface/90 backdrop-blur-xs p-1 shadow-xs">
                  <ProgressRing size="lg" value={profile.matchScore} />
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
                {/* Basic Specifications Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 border-b border-line/45 pb-5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-caption text-ink-3">Gender</span>
                    <span className="text-body-md font-semibold text-ink">
                      {profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : "Not specified"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-caption text-ink-3">Profession</span>
                    <span className="text-body-md font-semibold text-ink line-clamp-1">
                      {profile.profession || "Not specified"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-caption text-ink-3">Budget</span>
                    <span className="text-body-md font-semibold text-ink">
                      {profile.budgetMin !== undefined || profile.budgetMax !== undefined
                        ? formatBudgetRange(profile.budgetMin, profile.budgetMax)
                        : "Any budget"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-caption text-ink-3">Move-In Timeline</span>
                    <span className="text-body-md font-semibold text-ink">
                      {profile.moveInTimeline ? formatMoveInTimeline(profile.moveInTimeline) : "Flexible"}
                    </span>
                  </div>
                </div>

                {/* About section */}
                {profile.bio || profile.profession ? (
                  <section>
                    <h3 className="text-h4 text-ink mb-2">About</h3>
                    {profile.profession ? (
                      <p className="flex items-center gap-2 text-body-md text-ink-2 mb-2">
                        <Briefcase aria-hidden="true" className="h-4 w-4 text-ink-3" />
                        {profile.profession}
                      </p>
                    ) : null}
                    {profile.bio ? (
                      <p className="text-body-md text-ink-2 leading-relaxed max-w-[65ch]">
                        {profile.bio}
                      </p>
                    ) : null}
                  </section>
                ) : null}

                {/* Budget & Move-in section */}
                {profile.budgetMin !== undefined ||
                profile.budgetMax !== undefined ||
                profile.moveInTimeline ? (
                  <section>
                    <h3 className="text-h4 text-ink mb-2">Budget & Move-in</h3>
                    <div className="flex flex-wrap gap-3">
                      {profile.budgetMin !== undefined || profile.budgetMax !== undefined ? (
                        <div className="flex items-center gap-2 rounded-xl bg-accent-soft px-3 py-2">
                          <span className="text-label-md text-accent font-semibold">
                            {formatBudgetRange(profile.budgetMin, profile.budgetMax)}
                          </span>
                        </div>
                      ) : null}
                      {profile.moveInTimeline ? (
                        <div className="flex items-center gap-2 rounded-xl bg-teal-soft px-3 py-2">
                          <Clock aria-hidden="true" className="h-4 w-4 text-teal-mid" />
                          <span className="text-label-md text-teal-mid font-semibold">
                            {formatMoveInTimeline(profile.moveInTimeline)}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </section>
                ) : null}

                {/* Lifestyle section */}
                {LIFESTYLE_ITEMS.some((item) => profile[item.key]) ? (
                  <section>
                    <h3 className="text-h4 text-ink mb-2">Lifestyle</h3>
                    <div className="flex flex-wrap gap-2">
                      {LIFESTYLE_ITEMS.map((item) => {
                        const value = profile[item.key];
                        if (!value) return null;
                        const Icon = item.icon;
                        const rawLabel = formatLifestyleLabel(item.key, value);
                        const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
                        return (
                          <Chip key={item.key} variant="info" className="bg-paper-2">
                            <Icon
                              aria-hidden="true"
                              className="h-3.5 w-3.5 text-ink-3"
                            />
                            {label}
                          </Chip>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                {/* Preferences section */}
                {profile.genderPreference ||
                (profile.nonNegotiables && profile.nonNegotiables.length > 0) ||
                profile.hasPets !== undefined ? (
                  <section>
                    <h3 className="text-h4 text-ink mb-2">Preferences</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.genderPreference ? (
                        <Chip variant="info" className="bg-paper-2">
                          <UserCircle
                            aria-hidden="true"
                            className="h-3.5 w-3.5 text-ink-3"
                          />
                          {profile.genderPreference === "any"
                            ? "Any gender"
                            : profile.genderPreference === "male"
                              ? "Male only"
                              : "Female only"}
                        </Chip>
                      ) : null}
                      {profile.hasPets !== undefined ? (
                        <Chip variant="info" className="bg-paper-2">
                          <PawPrint
                            aria-hidden="true"
                            className="h-3.5 w-3.5 text-ink-3"
                          />
                          {profile.hasPets ? "Has pets" : "No pets"}
                        </Chip>
                      ) : null}
                      {profile.nonNegotiables?.map((nn) => {
                        const label =
                          NON_NEGOTIABLE_OPTIONS.find((o) => o.value === nn)?.label ?? nn;
                        return (
                          <Chip key={nn} variant="info" className="bg-warning-soft text-warning">
                            <ShieldAlert
                              aria-hidden="true"
                              className="h-3.5 w-3.5 text-warning"
                            />
                            {label}
                          </Chip>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                {/* Move-in label */}
                {profile.moveInLabel && !profile.moveInTimeline ? (
                  <p className="text-body-md text-ink-3">
                    {profile.moveInLabel}
                  </p>
                ) : null}

                {/* Spacer */}
                <div className="h-4" />
              </div>
            </div>
          </div>
        ) : (
          /* ---- COLLAPSED VIEW: Full-bleed photo with overlay ---- */
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
                src={profile.photoUrl}
                width={800}
                wrapperClassName="h-full w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-accent/40" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                {profile.mode ? <Badge mode={profile.mode} variant="mode" /> : null}
              </div>
              <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
                <div className="rounded-full bg-surface p-1 shadow-xs">
                  <ProgressRing size="lg" value={profile.matchScore} />
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
                
                {/* Key metadata badges for rich quick view */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {profile.gender ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-black/45 backdrop-blur-xs px-2 py-0.5 text-caption font-semibold text-white">
                      {profile.gender === "male" ? "♂️ Male" : profile.gender === "female" ? "♀️ Female" : `👤 ${profile.gender}`}
                    </span>
                  ) : null}
                  {profile.profession ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-black/45 backdrop-blur-xs px-2 py-0.5 text-caption font-semibold text-white line-clamp-1 max-w-[150px]">
                      💼 {profile.profession}
                    </span>
                  ) : null}
                  {profile.budgetMin !== undefined || profile.budgetMax !== undefined ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-accent/70 backdrop-blur-xs px-2 py-0.5 text-caption font-semibold text-white">
                      💰 {formatBudgetRange(profile.budgetMin, profile.budgetMax).replace("Any budget", "Flex")}
                    </span>
                  ) : null}
                </div>
                {profile.topMatches && profile.topMatches.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.topMatches.slice(0, 3).map((match) => (
                      <Chip className="bg-paper/80" key={match} variant="info">
                        {match}
                      </Chip>
                    ))}
                  </div>
                ) : null}
                {profile.moveInLabel ? (
                  <p className="mt-3 text-caption text-white/80">{profile.moveInLabel}</p>
                ) : null}
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
              <motion.div
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                style={{ opacity: likeOpacity }}
              >
                <span
                  className="border-[3px] border-success text-success select-none rounded-sm px-6 py-2 text-3xl font-bold tracking-widest -rotate-15"
                  aria-hidden="true"
                >
                  LIKE
                </span>
              </motion.div>

              {/* PASS overlay */}
              <motion.div
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                style={{ opacity: passOpacity }}
              >
                <span
                  className="border-[3px] border-error text-error select-none rounded-sm px-6 py-2 text-3xl font-bold tracking-widest rotate-15"
                  aria-hidden="true"
                >
                  PASS
                </span>
              </motion.div>

              {/* SUPER LIKE overlay */}
              <motion.div
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                style={{ opacity: superLikeOpacity }}
              >
                <span
                  className="border-[3px] border-warning text-warning select-none rounded-sm px-4 py-2 text-2xl font-bold tracking-widest"
                  aria-hidden="true"
                >
                  SUPER LIKE
                </span>
              </motion.div>
            </div>
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  SwipeCard — static card renderer (background cards)                       */
/* -------------------------------------------------------------------------- */

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
          src={profile.photoUrl}
          width={800}
          wrapperClassName="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-accent/40" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {profile.mode ? <Badge mode={profile.mode} variant="mode" /> : null}
        </div>
        <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
          <div className="rounded-full bg-surface p-1 shadow-xs">
            <ProgressRing size="lg" value={profile.matchScore} />
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
          
          {/* Key metadata badges for rich quick view */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {profile.gender ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-black/45 backdrop-blur-xs px-2 py-0.5 text-caption font-semibold text-white">
                {profile.gender === "male" ? "♂️ Male" : profile.gender === "female" ? "♀️ Female" : `👤 ${profile.gender}`}
              </span>
            ) : null}
            {profile.profession ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-black/45 backdrop-blur-xs px-2 py-0.5 text-caption font-semibold text-white line-clamp-1 max-w-[150px]">
                💼 {profile.profession}
              </span>
            ) : null}
            {profile.budgetMin !== undefined || profile.budgetMax !== undefined ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-accent/70 backdrop-blur-xs px-2 py-0.5 text-caption font-semibold text-white">
                💰 {formatBudgetRange(profile.budgetMin, profile.budgetMax).replace("Any budget", "Flex")}
              </span>
            ) : null}
          </div>
          {profile.topMatches && profile.topMatches.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.topMatches.slice(0, 3).map((match) => (
                <Chip className="bg-paper/80" key={match} variant="info">
                  {match}
                </Chip>
              ))}
            </div>
          ) : null}
          {profile.moveInLabel ? (
            <p className="mt-3 text-caption text-white/80">{profile.moveInLabel}</p>
          ) : null}
        </div>
      </div>
    </button>
  );
}
