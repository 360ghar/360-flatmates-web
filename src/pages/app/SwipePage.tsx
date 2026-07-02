import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import {
  useBatchRemoveSwipes,
  useSwipeDeck,
  useSwipeAction
} from "@/hooks/queries";
import { useKeyboardSwipe } from "@/hooks/useKeyboardSwipe";
import { useStore } from "zustand";
import { swipeStore } from "@/lib/stores/swipe-store";
import { uiStore } from "@/lib/stores/ui-store";
import { ApiClientError } from "@/lib/api/errors";
import type { FlatmatesPeer } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { SwipeDeck, type SwipeProfile } from "@/components/organisms/SwipeDeck";
import { formatLocation, formatMoveInTimeline } from "@/lib/utils/format";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUp, X, Heart, Sparkles, Star, Trash2 } from "lucide-react";

const SWIPE_HINT_DISMISSED_KEY = "360-flatmates-swipe-hint-dismissed";

function peerToSwipeProfile(peer: FlatmatesPeer): SwipeProfile {
  return {
    id: String(peer.id),
    name: peer.full_name,
    age: peer.age,
    photoUrl: peer.profile_image_url,
    mode: peer.mode,
    verified: false,
    location: formatLocation(peer.locality, peer.city) || undefined,
    matchScore: peer.match_percentage ?? 0,
    topMatches: [],
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
    smokingDrinking: peer.smoking_drinking,
    guestsPolicy: peer.guests_policy,
    workStyle: peer.work_style,
    gender: peer.gender,
    genderPreference: peer.gender_preference,
    nonNegotiables: peer.non_negotiables,
    hasPets: peer.has_pets,
    partyHabit: peer.party_habit
  };
}

/* -------------------------------------------------------------------------- */
/*  SwipePage                                                                  */
/* -------------------------------------------------------------------------- */

export function SwipePage() {
  const navigate = useNavigate();
  const { data: profiles, isLoading, error, refetch } = useSwipeDeck();
  const swipeAction = useSwipeAction();
  const [matchProfile, setMatchProfile] = useState<SwipeProfile | null>(null);

  /* ----- Zustand swipe store ----- */
  const storeAnimating = useStore(swipeStore, (s) => s.isAnimating);
  const setStoreAnimating = useStore(swipeStore, (s) => s.setAnimating);
  const setStoreDirection = useStore(swipeStore, (s) => s.setDirection);
  const clearStoreDirection = useStore(swipeStore, (s) => s.clearDirection);
  const setCardQueue = useStore(swipeStore, (s) => s.setCardQueue);

  const swipeProfiles: SwipeProfile[] = useMemo(
    () => (profiles ?? []).map(peerToSwipeProfile),
    [profiles]
  );

  /* ----- Sync profiles into the store's cardQueue for any consumer ----- */
  useEffect(() => {
    if (profiles && profiles.length > 0) {
      setCardQueue(profiles);
    }
  }, [profiles, setCardQueue]);

  /* ----- Card replenishment: refetch when running low ----- */
  const replenishTriggered = useRef(false);
  const handleNearEnd = useCallback(() => {
    if (replenishTriggered.current) return;
    replenishTriggered.current = true;
    refetch().finally(() => {
      // Allow re-triggering after some time
      setTimeout(() => {
        replenishTriggered.current = false;
      }, 2000);
    });
  }, [refetch]);

  /* ----- Swipe action handler ----- */
  const handleSwipeAction = useCallback(
    (action: "pass" | "like" | "super_like", profileId: string) => {
      if (storeAnimating) return;

      // Set direction in store
      const dir = action === "pass" ? "left" : action === "like" ? "right" : "up";
      setStoreDirection(dir);
      setStoreAnimating(true);

      swipeAction.mutate(
        {
          target_type: "user",
          action,
          target_user_id: Number(profileId)
        },
        {
          onSuccess: (result) => {
            if (result.did_match) {
              const matched = swipeProfiles.find((p) => p.id === profileId);
              if (matched) setMatchProfile(matched);
            }
          },
          onError: (err) => {
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
          },
          onSettled: () => {
            setStoreAnimating(false);
            clearStoreDirection();
          }
        }
      );
    },
    [storeAnimating, swipeAction, swipeProfiles, setStoreAnimating, setStoreDirection, clearStoreDirection]
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

  /* ----- Keyboard support -----
   * Swipe keys (ArrowLeft/Right/Up, Space) are owned solely by SwipeDeck's
   * focusable <section> onKeyDown handler, which both fires the action callback
   * AND advances the visual deck. We deliberately do NOT also wire those keys
   * through the global `useKeyboardSwipe` here: doing so double-fires the swipe
   * (window listener + section handler) and the global path could not advance
   * the uncontrolled deck. This hook is retained only to let Escape dismiss the
   * match-celebration overlay from anywhere on the page. */
  const handleKeyboardDismiss = useCallback(() => {
    setMatchProfile(null);
  }, []);

  useKeyboardSwipe({
    onDismiss: handleKeyboardDismiss,
    enabled: !!matchProfile
  });

  /* ----- Rendering ----- */
  /* ----- Multi-select for batch-unswipe ----- */
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const batchRemove = useBatchRemoveSwipes();

  const handleSelectToggle = useCallback((profileId: string) => {
    setSelectedIds((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId]
    );
  }, []);

  const handleMultiSelectAction = useCallback(
    (ids: string[]) => {
      const numericIds = ids
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0);
      if (numericIds.length === 0) return;
      batchRemove.mutate(
        { property_ids: numericIds },
        {
          onSuccess: (result) => {
            uiStore.getState().pushToast({
              type: "success",
              title: `Removed ${result.removed_count ?? numericIds.length} swipes`
            });
            setSelectedIds([]);
            setMultiSelect(false);
            refetch();
          },
          onError: () =>
            uiStore.getState().pushToast({
              type: "error",
              title: "Could not remove swipes"
            })
        }
      );
    },
    [batchRemove, refetch]
  );

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
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-3">
        <span className="text-eyebrow text-ink-3 uppercase tracking-widest">
          {multiSelect ? "Multi-select" : "Swipe through profiles"}
        </span>
        <Button
          variant={multiSelect ? "primary" : "secondary"}
          size="compact"
          onClick={() => {
            setMultiSelect((prev) => {
              if (prev) setSelectedIds([]);
              return !prev;
            });
          }}
          aria-pressed={multiSelect}
        >
          <Trash2 aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
          {multiSelect ? "Exit select" : "Select to remove"}
        </Button>
      </div>
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
          multiSelect={multiSelect}
          selectedIds={selectedIds}
          onSelectToggle={handleSelectToggle}
          onMultiSelectAction={handleMultiSelectAction}
        />
      </div>

      {/* First-time swipe hint (F4-18) */}
      <AnimatePresence>
        {showHint ? <SwipeHintOverlay onDismiss={dismissHint} /> : null}
      </AnimatePresence>

      {/* Match celebration overlay */}
      {matchProfile && (
        <MatchCelebration
          profile={matchProfile}
          onDismiss={handleKeyboardDismiss}
          onChat={() => {
            setMatchProfile(null);
            navigate("/chats");
          }}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  SwipeHintOverlay — first-time tooltip                                     */
/* -------------------------------------------------------------------------- */

function SwipeHintOverlay({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[var(--z-overlay)] flex items-end justify-center pb-32 md:pb-40"
      role="dialog"
      aria-label="Swipe controls overview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="pointer-events-auto relative w-[min(380px,calc(100vw-32px))] rounded-2xl border border-line bg-surface/95 p-5 shadow-2xl backdrop-blur-md"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        transition={{ type: "spring", damping: 18, stiffness: 200 }}
      >
        <button
          type="button"
          aria-label="Dismiss swipe hint"
          onClick={onDismiss}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
        <h3 className="text-body-md font-semibold text-ink">Quick swipe guide</h3>
        <p className="mt-1 text-caption text-ink-3">
          Swipe profiles with your keyboard or the action buttons below.
        </p>
        <ul className="mt-4 flex flex-col gap-2.5">
          <HintRow
            icon={<ArrowLeft aria-hidden="true" className="h-4 w-4 text-error" />}
            label="Pass"
            kbd="←"
          />
          <HintRow
            icon={<ArrowUp aria-hidden="true" className="h-4 w-4 text-warning" />}
            label="Super Like"
            kbd="↑"
          />
          <HintRow
            icon={<ArrowRight aria-hidden="true" className="h-4 w-4 text-success" />}
            label="Like"
            kbd="→"
          />
          <HintRow
            icon={<Heart aria-hidden="true" className="h-4 w-4 text-success" />}
            label="Tap buttons or swipe card"
            kbd=""
          />
          <HintRow
            icon={<Star aria-hidden="true" className="h-4 w-4 text-warning" />}
            label="Expand profile details"
            kbd="Space"
          />
        </ul>
        <Button className="mt-5 w-full" size="compact" onClick={onDismiss}>
          Got it
        </Button>
      </motion.div>
    </motion.div>
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
        <kbd className="rounded-md border border-line bg-paper-2 px-2 py-0.5 font-mono text-caption text-ink-2">
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

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-ink/75 backdrop-blur-md"
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Match celebration"
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Confetti Explosion Group */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
              }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: p.x,
                y: p.y,
                scale: [0, 1, 0.8, 0],
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
        <motion.div
          className="relative max-w-sm overflow-hidden rounded-2xl border border-line bg-surface p-8 text-center shadow-lg flex flex-col items-center gap-6"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.8, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 15, stiffness: 100 }}
        >
          <div className="absolute inset-0 map-grid-bg opacity-20" aria-hidden="true" />
          {/* Match Score Progress Ring with animated delay */}
          <div className="relative flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 12 }}
            >
              <ProgressRing value={profile.matchScore} size="xl" label="Compatibility score" />
            </motion.div>

            <Sparkles className="absolute -right-2 -top-1 h-6 w-6 animate-bounce text-action" aria-hidden="true" />
            <Sparkles className="absolute -bottom-2 -left-2 h-5 w-5 animate-bounce text-accent delay-150" aria-hidden="true" />
          </div>

          <div>
            <h2 className="text-display text-4xl text-ink font-normal leading-none">
              It&apos;s a <span className="text-serif-italic text-accent italic font-normal text-4xl md:text-5xl">Match!</span>
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
        </motion.div>
      </div>
    </div>
  );
}
