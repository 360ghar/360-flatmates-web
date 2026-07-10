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
import { SwipeActionBar } from "../molecules/SwipeActionBar";
import { cn, focusRing } from "../ui/component-utils";
import {
  formatBudgetRange,
  formatLifestyleLabel,
  formatMoveInTimeline,
  humanizeSnakeCase
} from "@/lib/utils/format";
import { NON_NEGOTIABLE_OPTIONS } from "@/lib/data";
import type { CompatibilityDimensionResult } from "@/lib/compatibility/types";

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
  /** Full 6-dimension breakdown (client-computed or from API). */
  compatibilityDimensions?: CompatibilityDimensionResult[];
  /* Listing context when the peer has an active flatmate/PG listing */
  propertyTitle?: string;
  imageUrls?: string[];
  monthlyRent?: number | null;
  securityDeposit?: number | null;
  maintenance?: number | null;
  roomType?: string | null;
  flatConfig?: string | null;
  floor?: string | null;
  societyName?: string | null;
  flatAmenities?: string[];
  societyAmenities?: string[];
  amenities?: string[];
  features?: string[];
  furnishing?: string[];
  availableFrom?: string | null;
  areaSqft?: number | null;
  bedrooms?: number | null;
  totalFloors?: number | null;
  videoTourUrl?: string | null;
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
  /** When true, taps on cards toggle their selection in a multi-select set. */
  multiSelect?: boolean;
  /** The currently-selected set of profile ids (controlled). */
  selectedIds?: string[];
  /** Fires when the user toggles a card in multi-select mode. */
  onSelectToggle?: (profileId: string) => void;
  /** Fires when the user confirms a multi-select action (e.g. "Remove selected"). */
  onMultiSelectAction?: (selectedIds: string[]) => void;
  /** Label for the multi-select confirm button. Defaults to "Remove selected". */
  multiSelectActionLabel?: string;
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
  { key: "sleepSchedule" as const, dimKey: "sleep_schedule", icon: Moon, label: "Sleep Schedule" },
  { key: "cleanliness" as const, dimKey: "cleanliness", icon: Sparkles, label: "Cleanliness" },
  { key: "foodHabits" as const, dimKey: "food_habits", icon: Utensils, label: "Food Habits" },
  { key: "smokingDrinking" as const, dimKey: "smoking_drinking", icon: Wind, label: "Smoking / Drinking" },
  { key: "guestsPolicy" as const, dimKey: "guests_policy", icon: Users, label: "Guests Policy" },
  { key: "workStyle" as const, dimKey: "work_style", icon: Home, label: "Work Style" },
  { key: "partyHabit" as const, dimKey: "party_habit", icon: PartyPopper, label: "Party Habit" }
] as const;

const DIMENSION_ICONS: Record<string, typeof Moon> = {
  sleep_schedule: Moon,
  cleanliness: Sparkles,
  food_habits: Utensils,
  smoking_drinking: Wind,
  guests_policy: Users,
  work_style: Home
};

function dimensionBarColor(match: boolean, score: number): string {
  if (match || score >= 70) return "bg-success";
  if (score >= 40) return "bg-warning";
  return "bg-error";
}

function dimensionScoreText(match: boolean, score: number): string {
  if (match || score >= 70) return "text-success";
  if (score >= 40) return "text-warning";
  return "text-error";
}

function matchToneLabel(score: number): string {
  if (score >= 70) return "Great match";
  if (score >= 40) return "Workable";
  return "Preference gaps";
}

function dimensionBuckets(dims: CompatibilityDimensionResult[]) {
  let aligned = 0;
  let workable = 0;
  let gaps = 0;
  for (const d of dims) {
    if (d.score >= 70) aligned++;
    else if (d.score >= 40) workable++;
    else gaps++;
  }
  return { aligned, workable, gaps };
}

function profilePhotos(profile: SwipeProfile): string[] {
  const urls = [
    ...(profile.imageUrls ?? []),
    ...(profile.photoUrl ? [profile.photoUrl] : [])
  ].filter((u): u is string => Boolean(u && u.trim()));
  return Array.from(new Set(urls));
}

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
  const prevIdsRef = useRef<string[]>(profiles.map((p) => p.id));
  useEffect(() => {
    const ids = profiles.map((p) => p.id);
    const prev = prevIdsRef.current;
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
      setInternalIndex((i) => {
        const swipedProfileId = swipedProfileIdRef.current;
        const activeCardWasRemoved =
          swipedProfileId !== null && profiles[i]?.id !== swipedProfileId;
        if (activeCardWasRemoved) {
          return Math.min(i, Math.max(0, profiles.length - 1));
        }
        const next = i + 1;
        return next < profiles.length ? next : i;
      });
    }
    setExitDirection(null);
    hasSwipedRef.current = false;
    swipedProfileIdRef.current = null;
  }, [controlledIndex, profiles]);

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
  );
}

/* -------------------------------------------------------------------------- */
/*  Expanded profile body (shared content hierarchy)                          */
/* -------------------------------------------------------------------------- */

function SwipeProfileExpandedBody({ profile }: { profile: SwipeProfile }) {
  const listingAmenities = [
    ...(profile.flatAmenities ?? []),
    ...(profile.societyAmenities ?? []),
    ...(profile.amenities ?? []),
    ...(profile.features ?? []),
    ...(profile.furnishing ?? [])
  ].filter(Boolean);
  const uniqueAmenities = Array.from(new Set(listingAmenities));
  const hasListing =
    Boolean(profile.propertyTitle) ||
    profile.monthlyRent != null ||
    (profile.imageUrls && profile.imageUrls.length > 0) ||
    Boolean(profile.roomType) ||
    Boolean(profile.flatConfig) ||
    Boolean(profile.societyName) ||
    Boolean(profile.availableFrom);
  const dims = profile.compatibilityDimensions ?? [];
  const buckets = dimensionBuckets(dims);
  const tone = matchToneLabel(profile.matchScore);
  const lifestyleCells = LIFESTYLE_ITEMS.filter((item) => profile[item.key]);

  const floorLabel =
    profile.floor != null
      ? profile.totalFloors != null
        ? `Floor ${profile.floor} of ${profile.totalFloors}`
        : `Floor ${profile.floor}`
      : null;

  return (
    <>
      {/* Quick facts strip */}
      <div className="flex flex-wrap gap-2 border-b border-line/45 pb-5">
        {profile.gender ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-paper-2 px-3 py-2 text-label-md font-semibold text-ink">
            <UserCircle aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
            {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
          </span>
        ) : null}
        {profile.profession ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-paper-2 px-3 py-2 text-label-md font-semibold text-ink max-w-[180px] truncate">
            <Briefcase aria-hidden="true" className="h-3.5 w-3.5 text-ink-3 shrink-0" />
            {profile.profession}
          </span>
        ) : null}
        {profile.budgetMin !== undefined || profile.budgetMax !== undefined ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-accent-soft px-3 py-2 text-label-md font-semibold text-accent">
            {formatBudgetRange(profile.budgetMin, profile.budgetMax)}
          </span>
        ) : null}
        {profile.moveInTimeline ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-teal-soft px-3 py-2 text-label-md font-semibold text-teal-mid">
            <Clock aria-hidden="true" className="h-3.5 w-3.5" />
            {formatMoveInTimeline(profile.moveInTimeline)}
          </span>
        ) : null}
        {profile.availableFrom ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-paper-2 px-3 py-2 text-label-md font-semibold text-ink">
            <Clock aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
            From {profile.availableFrom.slice(0, 10)}
          </span>
        ) : null}
      </div>

      {/* About */}
      {profile.bio ? (
        <section>
          <h3 className="text-h4 text-ink mb-2">About</h3>
          <p className="text-body-md text-ink-2 leading-relaxed max-w-[65ch]">
            {profile.bio}
          </p>
        </section>
      ) : null}

      {/* Lifestyle grid */}
      {lifestyleCells.length > 0 ? (
        <section>
          <h3 className="text-h4 text-ink mb-2">Lifestyle</h3>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-line/45 bg-paper-2 p-3">
            {lifestyleCells.map((item) => {
              const value = profile[item.key]!;
              const Icon = item.icon;
              const raw = formatLifestyleLabel(item.dimKey, value);
              const label = raw.charAt(0).toUpperCase() + raw.slice(1);
              return (
                <div key={item.key} className="flex items-center gap-2 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-caption text-ink-3 truncate">{item.label}</p>
                    <p className="text-label-md font-semibold text-ink truncate">
                      {label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Preferences */}
      {profile.genderPreference || profile.hasPets !== undefined ? (
        <section>
          <h3 className="text-h4 text-ink mb-2">Preferences</h3>
          <div className="rounded-xl border border-line/45 bg-paper-2 p-3 space-y-2">
            {profile.genderPreference ? (
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-caption text-ink-3">
                  <UserCircle aria-hidden="true" className="h-4 w-4" />
                  Gender preference
                </span>
                <span className="text-label-md font-semibold text-ink">
                  {profile.genderPreference === "any"
                    ? "Any gender"
                    : profile.genderPreference === "male"
                      ? "Male only"
                      : "Female only"}
                </span>
              </div>
            ) : null}
            {profile.hasPets !== undefined ? (
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-caption text-ink-3">
                  <PawPrint aria-hidden="true" className="h-4 w-4" />
                  Pets
                </span>
                <span className="text-label-md font-semibold text-ink">
                  {profile.hasPets ? "Has pets" : "No pets"}
                </span>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Deal-breakers */}
      {profile.nonNegotiables && profile.nonNegotiables.length > 0 ? (
        <section>
          <h3 className="text-h4 text-ink mb-1">Deal-breakers</h3>
          <p className="text-caption text-ink-3 mb-2">Non-negotiables they set</p>
          <div className="flex flex-wrap gap-2 rounded-xl border border-warning/25 bg-warning-soft p-3">
            {profile.nonNegotiables.map((nn) => {
              const label =
                NON_NEGOTIABLE_OPTIONS.find((o) => o.value === nn)?.label ??
                humanizeSnakeCase(nn);
              return (
                <span
                  key={nn}
                  className="inline-flex items-center gap-1.5 rounded-full border border-warning/25 bg-surface/70 px-2.5 py-1 text-caption font-semibold text-warning"
                >
                  <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />
                  {label}
                </span>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Compatibility summary + dimensions */}
      {dims.length > 0 ? (
        <section>
          <h3 className="text-h4 text-ink mb-3">Compatibility</h3>
          <div className="rounded-xl border border-line/45 bg-paper-2 p-3 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-surface p-1 shadow-xs">
                <ProgressRing
                  size="lg"
                  value={profile.matchScore}
                  label="Compatibility score"
                />
              </div>
              <div>
                <p
                  className={cn(
                    "text-body-md font-bold",
                    dimensionScoreText(profile.matchScore >= 50, profile.matchScore)
                  )}
                >
                  {tone}
                </p>
                <p className="text-caption text-ink-3">
                  {[
                    buckets.aligned > 0 ? `${buckets.aligned} aligned` : null,
                    buckets.workable > 0 ? `${buckets.workable} workable` : null,
                    buckets.gaps > 0 ? `${buckets.gaps} gaps` : null
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
            <div className="h-px bg-line/45" />
            <div className="flex flex-col gap-3.5">
              {dims.map((dim) => {
                const Icon = DIMENSION_ICONS[dim.name] ?? Sparkles;
                const peerLabel = dim.peer_value
                  ? formatLifestyleLabel(dim.name, dim.peer_value)
                  : "—";
                const userLabel = dim.user_value
                  ? formatLifestyleLabel(dim.name, dim.user_value)
                  : "—";
                const glyph =
                  dim.score >= 70 ? "✓" : dim.score >= 40 ? "~" : "!";
                return (
                  <div key={dim.name} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Icon
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 text-ink-3"
                        />
                        <span className="text-label-md font-semibold text-ink truncate">
                          {dim.label}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-label-md tabular-nums font-bold shrink-0",
                          dimensionScoreText(dim.match, dim.score)
                        )}
                      >
                        <span aria-hidden="true" className="mr-1">
                          {glyph}
                        </span>
                        {Math.round(dim.score)}%
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-6">
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-caption font-semibold text-accent">
                        {peerLabel}
                      </span>
                      <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-caption text-ink-2">
                        You: {userLabel}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface ml-6">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          dimensionBarColor(dim.match, dim.score)
                        )}
                        style={{
                          width: `${Math.min(100, Math.max(0, dim.score))}%`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : profile.topMatches && profile.topMatches.length > 0 ? (
        <section>
          <h3 className="text-h4 text-ink mb-2">Top matches</h3>
          <div className="flex flex-wrap gap-2">
            {profile.topMatches.map((match) => (
              <span
                key={match}
                className="rounded-full bg-success-soft px-2.5 py-1 text-caption font-semibold text-success"
              >
                {match}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {/* The Place */}
      {hasListing ? (
        <section>
          <h3 className="text-h4 text-ink mb-2">The Place</h3>
          {profile.propertyTitle ? (
            <p className="text-body-md font-semibold text-ink mb-2">
              {profile.propertyTitle}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {profile.flatConfig ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-2 px-2.5 py-1 text-caption font-semibold text-ink">
                <Home aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
                {profile.flatConfig}
              </span>
            ) : null}
            {profile.roomType ? (
              <span className="rounded-full border border-line bg-paper-2 px-2.5 py-1 text-caption font-semibold text-ink">
                {humanizeSnakeCase(profile.roomType)}
              </span>
            ) : null}
            {floorLabel ? (
              <span className="rounded-full border border-line bg-paper-2 px-2.5 py-1 text-caption font-semibold text-ink">
                {floorLabel}
              </span>
            ) : null}
            {profile.bedrooms != null ? (
              <span className="rounded-full border border-line bg-paper-2 px-2.5 py-1 text-caption font-semibold text-ink">
                {profile.bedrooms} BR
              </span>
            ) : null}
            {profile.areaSqft != null ? (
              <span className="rounded-full border border-line bg-paper-2 px-2.5 py-1 text-caption font-semibold text-ink">
                {Math.round(profile.areaSqft)} sqft
              </span>
            ) : null}
            {profile.societyName || profile.location ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-2 px-2.5 py-1 text-caption font-semibold text-ink">
                <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
                {profile.societyName ?? profile.location}
              </span>
            ) : null}
            {profile.availableFrom ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-2 px-2.5 py-1 text-caption font-semibold text-ink">
                <Clock aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
                Available {profile.availableFrom.slice(0, 10)}
              </span>
            ) : null}
          </div>
          {profile.monthlyRent != null ||
          profile.securityDeposit != null ||
          profile.maintenance != null ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.monthlyRent != null ? (
                <div className="rounded-xl bg-accent-soft px-3 py-2 text-label-md font-semibold text-accent">
                  ₹{Math.round(profile.monthlyRent).toLocaleString("en-IN")}/mo
                </div>
              ) : null}
              {profile.securityDeposit != null ? (
                <div className="rounded-xl bg-paper-2 px-3 py-2 text-label-md text-ink-2">
                  Deposit ₹
                  {Math.round(profile.securityDeposit).toLocaleString("en-IN")}
                </div>
              ) : null}
              {profile.maintenance != null ? (
                <div className="rounded-xl bg-paper-2 px-3 py-2 text-label-md text-ink-2">
                  Maint. ₹
                  {Math.round(profile.maintenance).toLocaleString("en-IN")}
                </div>
              ) : null}
            </div>
          ) : null}
          {uniqueAmenities.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {uniqueAmenities.slice(0, 12).map((a) => (
                <span
                  key={a}
                  className="rounded-full border border-line bg-paper-2 px-2.5 py-1 text-caption text-ink-2"
                >
                  {humanizeSnakeCase(a)}
                </span>
              ))}
            </div>
          ) : null}
          {profile.videoTourUrl ? (
            <a
              href={profile.videoTourUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-label-md font-semibold text-accent hover:underline"
            >
              Watch video tour
            </a>
          ) : null}
        </section>
      ) : null}

      {profile.moveInLabel && !profile.moveInTimeline ? (
        <p className="text-body-md text-ink-3">{profile.moveInLabel}</p>
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  SwipeableCard — top card with drag / gesture support                      */
/* -------------------------------------------------------------------------- */

function SwipeableCard({
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

function CollapsedProfileBadges({ profile }: { profile: SwipeProfile }) {
  const lifestylePreview = LIFESTYLE_ITEMS.filter((item) => profile[item.key])
    .slice(0, 2)
    .map((item) => {
      const value = profile[item.key]!;
      const raw = formatLifestyleLabel(item.dimKey, value);
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    });
  const dealCount = profile.nonNegotiables?.length ?? 0;
  const tone =
    profile.matchScore > 0 ? matchToneLabel(profile.matchScore) : null;

  return (
    <>
      {tone ? (
        <p className="mt-1 text-caption font-semibold text-white/90">{tone}</p>
      ) : null}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {profile.gender ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-black/45 backdrop-blur-xs px-2 py-0.5 text-caption font-semibold text-white">
            {profile.gender === "male"
              ? "Male"
              : profile.gender === "female"
                ? "Female"
                : profile.gender}
          </span>
        ) : null}
        {profile.profession ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-black/45 backdrop-blur-xs px-2 py-0.5 text-caption font-semibold text-white line-clamp-1 max-w-[150px]">
            {profile.profession}
          </span>
        ) : null}
        {profile.budgetMin !== undefined || profile.budgetMax !== undefined ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-accent/70 backdrop-blur-xs px-2 py-0.5 text-caption font-semibold text-white">
            {formatBudgetRange(profile.budgetMin, profile.budgetMax).replace(
              "Any budget",
              "Flex"
            )}
          </span>
        ) : null}
        {dealCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-warning/80 backdrop-blur-xs px-2 py-0.5 text-caption font-semibold text-white">
            <ShieldAlert aria-hidden="true" className="h-3 w-3" />
            {dealCount} deal-breaker{dealCount === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
      {profile.topMatches && profile.topMatches.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.topMatches.slice(0, 3).map((match) => (
            <span
              key={match}
              className="rounded-full bg-paper/80 px-2.5 py-1 text-caption font-semibold text-ink"
            >
              {match}
            </span>
          ))}
        </div>
      ) : lifestylePreview.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {lifestylePreview.map((label) => (
            <span
              key={label}
              className="rounded-full bg-paper/80 px-2.5 py-1 text-caption font-semibold text-ink"
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}
      {profile.moveInLabel ? (
        <p className="mt-3 text-caption text-white/80">{profile.moveInLabel}</p>
      ) : null}
    </>
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
