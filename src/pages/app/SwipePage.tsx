import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { useSwipeDeck, useSwipeAction } from "@/hooks/queries";
import { useKeyboardSwipe } from "@/hooks/useKeyboardSwipe";
import { useSwipeStore } from "@/lib/stores/swipe-store";
import type { FlatmatesPeer } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { SwipeDeck, type SwipeProfile } from "@/components/organisms/SwipeDeck";
import { formatLocation, formatMoveInTimeline } from "@/lib/utils/format";

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
    hasPets: peer.has_pets
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
  const {
    isAnimating: storeAnimating,
    setAnimating: setStoreAnimating,
    setDirection: setStoreDirection,
    clearDirection: clearStoreDirection,
    setCardQueue
  } = useSwipeStore();

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

/* -------------------------------------------------------------------------- */
/*  MatchCelebration                                                          */
/* -------------------------------------------------------------------------- */

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
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm"
      onClick={onDismiss}
      role="dialog"
      aria-label="Match celebration"
    >
      <div
        className="match-celebration flex flex-col items-center gap-4 rounded-2xl bg-surface p-8 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <ProgressRing value={profile.matchScore} size="xl" />
        </div>
        <h2 className="text-h1 text-center">It&apos;s a Match!</h2>
        <p className="text-body-md text-ink-2 text-center">
          You and {profile.name} liked each other.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onDismiss}>Keep Swiping</Button>
          <Button onClick={onChat}>Say Hello</Button>
        </div>
      </div>
    </div>
  );
}
