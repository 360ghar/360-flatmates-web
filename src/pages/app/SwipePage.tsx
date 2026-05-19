import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { useSwipeDeck, useSwipeAction } from "@/hooks/queries";
import { useKeyboardSwipe } from "@/hooks/useKeyboardSwipe";
import { useStore } from "zustand";
import { swipeStore } from "@/lib/stores/swipe-store";
import type { FlatmatesPeer } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { SwipeDeck, type SwipeProfile } from "@/components/organisms/SwipeDeck";
import { formatLocation, formatMoveInTimeline } from "@/lib/utils/format";
import { motion } from "framer-motion";

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

  /* ----- Track the deck's current index for keyboard swipe ----- */
  const [deckIndex, setDeckIndex] = useState(0);

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
          onSettled: () => {
            setStoreAnimating(false);
            clearStoreDirection();
          }
        }
      );
    },
    [storeAnimating, swipeAction, swipeProfiles, setStoreAnimating, setStoreDirection, clearStoreDirection]
  );

  /* ----- Keyboard swipe handlers ----- */
  const currentProfile = swipeProfiles[deckIndex];

  const handleKeyboardPass = useCallback(() => {
    if (currentProfile) handleSwipeAction("pass", currentProfile.id);
  }, [currentProfile, handleSwipeAction]);

  const handleKeyboardLike = useCallback(() => {
    if (currentProfile) handleSwipeAction("like", currentProfile.id);
  }, [currentProfile, handleSwipeAction]);

  const handleKeyboardSuperLike = useCallback(() => {
    if (currentProfile) handleSwipeAction("super_like", currentProfile.id);
  }, [currentProfile, handleSwipeAction]);

  const handleKeyboardExpand = useCallback(() => {
    swipeStore.getState().toggleExpanded();
  }, []);

  const handleKeyboardDismiss = useCallback(() => {
    /* dismiss match celebration or do nothing */
    setMatchProfile(null);
  }, []);

  useKeyboardSwipe({
    onPass: handleKeyboardPass,
    onLike: handleKeyboardLike,
    onSuperLike: handleKeyboardSuperLike,
    onExpand: handleKeyboardExpand,
    onDismiss: handleKeyboardDismiss,
    enabled: !!currentProfile && !storeAnimating
  });

  /* ----- Rendering ----- */

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-6 p-4">
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
      <div className="flex justify-center py-2 md:py-4">
        <SwipeDeck
          profiles={swipeProfiles}
          onPass={(profileId) => handleSwipeAction("pass", profileId)}
          onLike={(profileId) => handleSwipeAction("like", profileId)}
          onSuperLike={(profileId) => handleSwipeAction("super_like", profileId)}
          onExpand={() => { /* expansion toggled inside SwipeDeck */ }}
          onEmptyAction={() => navigate("/explore")}
          onNearEnd={handleNearEnd}
          onIndexChange={setDeckIndex}
          superLikesRemaining={3}
          isAnimating={storeAnimating}
        />
      </div>

      {/* Match celebration overlay */}
      {matchProfile && (
        <MatchCelebration
          profile={matchProfile}
          onDismiss={() => setMatchProfile(null)}
          onChat={() => {
            setMatchProfile(null);
            navigate("/chats");
          }}
        />
      )}
    </>
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
    const timer = setTimeout(onDismiss, 8000);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/75 backdrop-blur-md"
      onClick={onDismiss}
      role="dialog"
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

        {/* Outer Halo Glow */}
        <div className="absolute h-96 w-96 rounded-full bg-accent/20 blur-[120px] pointer-events-none animate-pulse" />

        {/* Celebration Card Container */}
        <motion.div
          className="relative max-w-sm rounded-3xl border border-line bg-surface p-8 shadow-2xl text-center flex flex-col items-center gap-6"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.8, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 15, stiffness: 100 }}
        >
          {/* Match Score Progress Ring with animated delay */}
          <div className="relative flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 12 }}
            >
              <ProgressRing value={profile.matchScore} size="xl" />
            </motion.div>
            
            {/* Sparkle details */}
            <span className="absolute -top-1 -right-2 text-2xl animate-bounce">✨</span>
            <span className="absolute -bottom-2 -left-2 text-xl animate-bounce delay-150">🎉</span>
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
