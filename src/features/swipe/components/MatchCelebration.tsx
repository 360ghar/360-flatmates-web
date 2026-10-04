import { useMemo } from "react";
import { m } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { handleDialogBackdropClick, useNativeDialog } from "@/components/ui/useNativeDialog";
import type { SwipeProfile } from "@/features/swipe/lib/swipeDeck.types";

/* Cut-paper confetti in the scene's own colours. */
const CONFETTI = ["var(--color-clay)", "var(--color-marigold)", "var(--color-pine)", "var(--color-paper-3)"];

/** Both people liked each other: the score, and a way to say hello. Stays until dismissed. */
export function MatchCelebration({
  profile,
  onDismiss,
  onChat
}: {
  profile: SwipeProfile;
  onDismiss: () => void;
  onChat: () => void;
}) {
  const dialogRef = useNativeDialog(true, onDismiss);
  const bits = useMemo(() => {
    let seed = 1;
    const rand = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    return Array.from({ length: 22 }, (_, i) => {
      const angle = ((i * 360) / 22 + rand() * 15) * (Math.PI / 180);
      const distance = 110 + rand() * 120;
      return {
        id: i,
        color: CONFETTI[i % CONFETTI.length],
        w: 6 + rand() * 8,
        h: 4 + rand() * 5,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        rotate: rand() * 540 - 270,
        delay: rand() * 0.15,
        duration: 0.9 + rand() * 0.5
      };
    });
  }, []);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- backdrop click; Escape closes from the keyboard
    <dialog
      ref={dialogRef}
      aria-label="Match celebration"
      onClick={(e) => handleDialogBackdropClick(e, onDismiss)}
      className="fixed inset-0 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-4 backdrop:bg-scrim/70"
    >
      <div className="relative">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {bits.map((b) => (
            <m.span
              key={b.id}
              className="absolute rounded-[2px]"
              style={{ width: b.w, height: b.h, backgroundColor: b.color }}
              initial={{ x: 0, y: 0, rotate: 0, scale: 0.4 }}
              animate={{ x: b.x, y: b.y, rotate: b.rotate, scale: [0.4, 1, 1, 0] }}
              transition={{ delay: b.delay, duration: b.duration, ease: "easeOut" }}
            />
          ))}
        </div>

        <m.div
          className="paper-grain relative flex w-[min(360px,calc(100vw-32px))] flex-col items-center gap-5 rounded-hand bg-surface p-8 text-center shadow-md"
          initial={{ scale: 0.9, y: 24 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 16, stiffness: 160 }}
        >
          <ProgressRing value={profile.matchScore} size="xl" label="Compatibility score" />
          <div>
            <h2 className="text-display text-ink">It&apos;s a match</h2>
            <p className="mt-3 text-body-lg text-ink-2">
              You and <span className="font-semibold text-ink">{profile.name}</span> liked each other.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3">
            <Button fullWidth onClick={onChat}>
              Say hello
            </Button>
            <Button fullWidth variant="tertiary" onClick={onDismiss}>
              Keep swiping
            </Button>
          </div>
        </m.div>
      </div>
    </dialog>
  );
}
