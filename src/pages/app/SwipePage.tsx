import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import {
  useSwipeDeck,
  useSwipeAction,
  useBootstrap
} from "@/hooks/queries";
import { useStore } from "zustand";
import { swipeStore } from "@/lib/stores/swipe-store";
import { uiStore } from "@/lib/stores/ui-store";
import { ApiClientError } from "@/lib/api/errors";
import type { FlatmatesPeer, FlatmatesProfile } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { handleDialogBackdropClick, useNativeDialog } from "@/components/ui/useNativeDialog";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { SwipeDeck, type SwipeProfile } from "@/components/organisms/SwipeDeck";
import { formatLocation, formatMoveInTimeline } from "@/lib/utils/format";
import {
  calculateCompatibility,
  type CompatibilityProfile
} from "@/lib/compatibility";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUp, X, Sparkles, Star } from "lucide-react";

const SWIPE_HINT_DISMISSED_KEY = "360-flatmates-swipe-hint-dismissed";

function toCompatibilityProfile(
  source: FlatmatesProfile | FlatmatesPeer | null | undefined,
  id?: number
): CompatibilityProfile {
  return {
    id: id ?? source?.id,
    sleep_schedule: source?.sleep_schedule,
    cleanliness: source?.cleanliness,
    food_habits: source?.food_habits,
    smoking: source?.smoking,
    drinking: source?.drinking,
    guests_policy: source?.guests_policy,
    work_style: source?.work_style
  };
}

function peerToSwipeProfile(
  peer: FlatmatesPeer,
  me?: FlatmatesProfile | null
): SwipeProfile {
  const compat =
    me != null
      ? calculateCompatibility(
          toCompatibilityProfile(me, me.id),
          toCompatibilityProfile(peer, peer.id)
        )
      : null;

  return {
    id: String(peer.id),
    name: peer.full_name,
    age: peer.age,
    ageBucket: peer.age_bucket,
    photoUrl: peer.profile_image_url ?? peer.main_image_url,
    mode: peer.mode,
    verified: false,
    location: formatLocation(peer.locality, peer.city) || undefined,
    matchScore: peer.match_percentage ?? compat?.overall_percentage ?? 0,
    topMatches: peer.top_matches ?? [],
    moveInLabel: peer.move_in_timeline
      ? formatMoveInTimeline(peer.move_in_timeline)
      : undefined,
    bio: peer.bio,
    profession: peer.profession,
    budgetMin: peer.budget_min,
    budgetMax: peer.budget_max,
    moveInTimeline: peer.move_in_timeline,
    sleepSchedule: peer.sleep_schedule,
    cleanliness: peer.cleanliness,
    foodHabits: peer.food_habits,
    smoking: peer.smoking,
    drinking: peer.drinking,
    guestsPolicy: peer.guests_policy,
    workStyle: peer.work_style,
    gender: peer.gender,
    genderPreference: peer.gender_preference,
    nonNegotiables: peer.non_negotiables,
    hasPets: peer.has_pets,
    partyHabit: peer.party_habit,
    compatibilityDimensions: compat?.dimensions,
    propertyTitle: peer.property_title,
    imageUrls: peer.image_urls,
    monthlyRent: peer.monthly_rent,
    securityDeposit: peer.security_deposit,
    maintenance: peer.maintenance ?? peer.maintenance_charges,
    roomType: peer.room_type,
    flatConfig: peer.flat_config,
    floor: peer.floor ?? (peer.floor_number != null ? String(peer.floor_number) : null),
    societyName: peer.society_name,
    flatAmenities: peer.flat_amenities,
    societyAmenities: peer.society_amenities,
    amenities: peer.amenities,
    features: peer.features,
    furnishing: peer.furnishing,
    availableFrom: peer.available_from,
    areaSqft: peer.area_sqft,
    bedrooms: peer.bedrooms,
    totalFloors: peer.total_floors,
    videoTourUrl: peer.video_tour_url
  };
}

/* -------------------------------------------------------------------------- */
/*  SwipePage                                                                  */
/* -------------------------------------------------------------------------- */

/** Matches the card fly-off animation in SwipeDeck. */
const SWIPE_FLY_OFF_MS = 320;

interface PendingMatch {
  profile: SwipeProfile;
  conversationId: number | null;
}

export function SwipePage() {
  const navigate = useNavigate();
  const { data: profiles, isLoading, error, refetch } = useSwipeDeck();
  const { data: bootstrap } = useBootstrap();
  const swipeAction = useSwipeAction();
  const [matches, setMatches] = useState<PendingMatch[]>([]);
  const activeMatch = matches[0];
  const mounted = useRef(false);

  /* ----- Zustand swipe store ----- */
  const storeAnimating = useStore(swipeStore, (s) => s.isAnimating);
  const setStoreAnimating = useStore(swipeStore, (s) => s.setAnimating);
  const setStoreDirection = useStore(swipeStore, (s) => s.setDirection);
  const clearStoreDirection = useStore(swipeStore, (s) => s.clearDirection);

  const me = bootstrap?.profile ?? null;

  const swipeProfiles: SwipeProfile[] = useMemo(
    () => (profiles ?? []).map((peer) => peerToSwipeProfile(peer, me)),
    [profiles, me]
  );

  /* ----- Card replenishment: refetch when running low ----- */
  const replenishTriggered = useRef(false);
  const timers = useRef<number[]>([]);
  useEffect(() => {
    mounted.current = true;
    const pending = timers.current;
    return () => {
      mounted.current = false;
      pending.forEach((id) => window.clearTimeout(id));
      // Leaving mid fly-off must not leave the global store locked.
      swipeStore.getState().setAnimating(false);
      swipeStore.getState().clearDirection();
    };
  }, []);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const handleNearEnd = useCallback(() => {
    if (replenishTriggered.current) return;
    replenishTriggered.current = true;
    refetch().finally(() => {
      later(() => {
        replenishTriggered.current = false;
      }, 2000);
    });
  }, [refetch, later]);

  /* ----- Swipe action handler ----- */
  const handleSwipeAction = useCallback(
    (action: "pass" | "like" | "super_like", profileId: string) => {
      if (storeAnimating) return;

      // Set direction in store
      const dir = action === "pass" ? "left" : action === "like" ? "right" : "up";
      setStoreDirection(dir);
      setStoreAnimating(true);
      // Unlock after the fly-off, not after the network round trip (W24):
      // the next card is usable while this swipe is still saving.
      later(() => {
        setStoreAnimating(false);
        clearStoreDirection();
      }, SWIPE_FLY_OFF_MS);

      // mutateAsync, not per-call mutate callbacks: TanStack only runs those for
      // the latest call, and swipes overlap now, so earlier matches/errors would be lost.
      const matched = swipeProfiles.find((p) => p.id === profileId);
      swipeAction
        .mutateAsync({
          target_type: "user",
          action,
          target_user_id: Number(profileId)
        })
        .then(
          (result) => {
            if (mounted.current && result.did_match && matched) {
              setMatches((queued) => [...queued, {
                profile: matched,
                conversationId: result.conversation_id ?? null
              }]);
            }
          },
          (err) => {
            // Super-like daily cap (429) gets a distinct, actionable message.
            const isRateLimited =
              err instanceof ApiClientError && err.status === 429;
            uiStore.getState().pushToast(
              isRateLimited
                ? {
                    type: "warning",
                    title: "Super-like limit reached",
                    description: "You've used all your super-likes for today. Try again tomorrow."
                  }
                : {
                    type: "error",
                    title: "Swipe not saved",
                    description: "Something went wrong. Please try again."
                  }
            );
          }
        );
    },
    [storeAnimating, swipeAction, swipeProfiles, setStoreAnimating, setStoreDirection, clearStoreDirection, later]
  );

  /* ----- First-time hint overlay (F4-18) -----
   * Show a one-time tooltip explaining keyboard shortcuts and action buttons.
   * Dismissal state is persisted in localStorage so it only shows once. */
  const [showHint, setShowHint] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.localStorage.getItem(SWIPE_HINT_DISMISSED_KEY);
  });
  const dismissHint = useCallback(() => {
    setShowHint(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SWIPE_HINT_DISMISSED_KEY, "1");
    }
  }, []);

  // The native match dialog handles Escape. A second window listener would
  // remove two queued matches for the same key press.
  const dismissMatch = useCallback(() => {
    setMatches((queued) => queued.slice(1));
  }, []);

  /* ----- Rendering ----- */
  // Multi-select batch-unswipe is intentionally omitted for the flatmate deck:
  // POST /swipes/batch-remove only accepts property_ids, not user IDs.

  if (isLoading) {
    return (
      <div className="py-2 md:py-4">
        <Skeleton variant="swipeCard" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex justify-center py-2 md:py-4">
        <SwipeDeck
          profiles={swipeProfiles}
          onPass={(profileId) => handleSwipeAction("pass", profileId)}
          onLike={(profileId) => handleSwipeAction("like", profileId)}
          onSuperLike={(profileId) => handleSwipeAction("super_like", profileId)}
          onExpand={() => { /* expansion toggled inside SwipeDeck */ }}
          onEmptyAction={() => navigate("/explore")}
          onNearEnd={handleNearEnd}
          isAnimating={storeAnimating}
        />
      </div>

      {/* First-time swipe hint (F4-18) */}
      <AnimatePresence>
        {showHint ? <SwipeHintOverlay onDismiss={dismissHint} /> : null}
      </AnimatePresence>

      {/* Match celebration overlay */}
      {activeMatch && (
        <MatchCelebration
          key={activeMatch.profile.id}
          profile={activeMatch.profile}
          onDismiss={dismissMatch}
          onChat={() => {
            dismissMatch();
            // Open the new match's conversation directly (W22).
            navigate(activeMatch.conversationId ? `/chats/${activeMatch.conversationId}` : "/chats");
          }}
        />
      )}
    </LazyMotion>
  );
}

/* -------------------------------------------------------------------------- */
/*  SwipeHintOverlay — first-time tooltip                                     */
/* -------------------------------------------------------------------------- */

function SwipeHintOverlay({ onDismiss }: { onDismiss: () => void }) {
  // Key caps only help where there is a keyboard and a pointer that hovers.
  const hasKeyboard = useMediaQuery("(hover: hover) and (pointer: fine)");
  return (
    <m.div
      className="pointer-events-none fixed inset-0 z-[var(--z-overlay)] flex items-end justify-center pb-32 md:pb-40"
      role="dialog"
      aria-label="Swipe controls overview"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <m.div
        className="pointer-events-auto relative w-[min(380px,calc(100vw-32px))] rounded-hand bg-surface-elevated paper-grain p-5 shadow-lg"
        initial={{ y: 12 }}
        animate={{ y: 0 }}
        exit={{ y: 12, opacity: 0 }}
        transition={{ type: "spring", damping: 18, stiffness: 200 }}
      >
        <button
          type="button"
          aria-label="Dismiss swipe hint"
          onClick={onDismiss}
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-cut-md text-ink-2 transition-colors hover:bg-surface-soft hover:text-ink"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
        <h3 className="text-body-md font-semibold text-ink">Quick swipe guide</h3>
        <p className="mt-1 text-caption text-ink-3">
          {hasKeyboard
            ? "Swipe profiles with your keyboard or the action buttons below."
            : "Swipe the card, or tap the buttons below it."}
        </p>
        <ul className="mt-4 flex flex-col gap-2.5">
          <HintRow
            icon={<ArrowLeft aria-hidden="true" className="h-4 w-4 text-error" />}
            label={hasKeyboard ? "Pass" : "Pass: swipe left"}
            kbd={hasKeyboard ? "←" : ""}
          />
          <HintRow
            icon={<ArrowUp aria-hidden="true" className="h-4 w-4 text-warning" />}
            label={hasKeyboard ? "Super Like" : "Super Like: swipe up"}
            kbd={hasKeyboard ? "↑" : ""}
          />
          <HintRow
            icon={<ArrowRight aria-hidden="true" className="h-4 w-4 text-success" />}
            label={hasKeyboard ? "Like" : "Like: swipe right"}
            kbd={hasKeyboard ? "→" : ""}
          />
          <HintRow
            icon={<Star aria-hidden="true" className="h-4 w-4 text-warning" />}
            label={hasKeyboard ? "Expand profile details" : "Tap the card for profile details"}
            kbd={hasKeyboard ? "Space" : ""}
          />
        </ul>
        <Button className="mt-5 w-full" size="compact" onClick={onDismiss}>
          Got it
        </Button>
      </m.div>
    </m.div>
  );
}

function HintRow({
  icon,
  label,
  kbd
}: {
  icon: React.ReactNode;
  label: string;
  kbd: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 text-body-sm text-ink-2">
      <span className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
      {kbd ? (
        <kbd className="rounded-md border border-line bg-surface-soft px-2 py-0.5 font-sans text-caption text-ink-2">
          {kbd}
        </kbd>
      ) : null}
    </li>
  );
}


function MatchCelebration({
  profile,
  onDismiss,
  onChat,
}: {
  profile: SwipeProfile;
  onDismiss: () => void;
  onChat: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const particles = useMemo(() => {
    let seed = 1;
    const nextRand = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    return Array.from({ length: 24 }).map((_, i) => {
      const angle = (i * 360) / 24 + nextRand() * 15;
      const distance = 80 + nextRand() * 120;
      const size = 6 + nextRand() * 10;
      const delay = nextRand() * 0.2;
      const duration = 0.8 + nextRand() * 0.6;
      const colors = [
        "var(--color-accent)",
        "var(--color-accent-300)",
        "var(--color-teal-mid)",
        "var(--color-error)",
        "var(--color-warning)",
      ];
      const color = colors[Math.floor(nextRand() * colors.length)];

      return {
        id: i,
        color,
        size,
        delay,
        duration,
        x: Math.cos((angle * Math.PI) / 180) * distance,
        y: Math.sin((angle * Math.PI) / 180) * distance,
      };
    });
  }, []);

  const dialogRef = useNativeDialog(true, onDismiss);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Match celebration"
      onClick={(e) => handleDialogBackdropClick(e, onDismiss)}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none flex items-center justify-center bg-transparent p-0 backdrop:bg-[rgb(18_24_20/0.72)]"
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Confetti Explosion Group */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {particles.map((p) => (
            <m.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
              }}
              initial={{ x: 0, y: 0, scale: 0.3, opacity: 1 }}
              animate={{
                x: p.x,
                y: p.y,
                scale: [0.3, 1, 0.8, 0],
                opacity: [1, 1, 0.6, 0],
              }}
              transition={{
                delay: p.delay,
                duration: p.duration,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        {/* Celebration Card Container */}
        <m.div
          className="relative max-w-sm rounded-hand bg-surface paper-grain shadow-sm p-8 text-center shadow-lg flex flex-col items-center gap-6"
          initial={{ scale: 0.8, y: 40 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 15, stiffness: 100 }}
        >
          {/* Match Score Progress Ring with animated delay */}
          <div className="relative flex items-center justify-center">
            <m.div
              initial={{ scale: 0.5, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", damping: 12 }}
            >
              <ProgressRing value={profile.matchScore} size="xl" label="Compatibility score" />
            </m.div>

            <Sparkles className="absolute -right-2 -top-1 h-6 w-6 animate-pulse text-action" aria-hidden="true" />
            <Sparkles className="absolute -bottom-2 -left-2 h-5 w-5 animate-pulse text-accent delay-150" aria-hidden="true" />
          </div>

          <div>
            <h2 className="text-display text-4xl text-ink leading-none">
              It&apos;s a <span className="text-serif-italic">Match!</span>
            </h2>
            <p className="mt-3 text-body-md text-ink-2 px-4 leading-relaxed">
              You and <strong className="text-ink font-semibold">{profile.name}</strong> liked each other.
            </p>
          </div>

          <div className="flex w-full gap-3 mt-2">
            <Button variant="secondary" onClick={onDismiss} className="flex-1">
              Keep Swiping
            </Button>
            <Button onClick={onChat} className="flex-1">
              Say Hello
            </Button>
          </div>
        </m.div>
      </div>
    </dialog>
  );
}
