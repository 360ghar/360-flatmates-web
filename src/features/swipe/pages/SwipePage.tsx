import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "zustand";
import { AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import { useSwipeDeck, useSwipeAction } from "@/features/swipe/hooks/useSwipes";
import { useBootstrap } from "@/hooks/queries/useBootstrap";
import { swipeStore } from "@/features/swipe/store";
import { uiStore } from "@/lib/stores/ui-store";
import { ApiClientError } from "@/lib/api/errors";
import { SwipeCardSkeleton } from "@/features/swipe/components/SwipeCardSkeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { SwipeDeck, type SwipeProfile } from "@/features/swipe/components/SwipeDeck";
import { MatchCelebration } from "@/features/swipe/components/MatchCelebration";
import { SwipeHintOverlay } from "@/features/swipe/components/SwipeHintOverlay";
import { peerToSwipeProfile } from "@/features/swipe/lib/peer-to-swipe-profile";

const SWIPE_HINT_DISMISSED_KEY = "360-flatmates-swipe-hint-dismissed";

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

  if (isLoading) return <SwipeCardSkeleton />;

  if (error) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <ErrorState title="Could not load people" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex justify-center">
        <SwipeDeck
          profiles={swipeProfiles}
          onPass={(profileId) => handleSwipeAction("pass", profileId)}
          onLike={(profileId) => handleSwipeAction("like", profileId)}
          onSuperLike={(profileId) => handleSwipeAction("super_like", profileId)}
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
