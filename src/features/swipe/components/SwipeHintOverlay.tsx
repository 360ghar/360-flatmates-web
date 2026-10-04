import type { ReactNode } from "react";
import { m } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUp, Star, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/Button";
import { cn, focusRing } from "@/components/ui/component-utils";

/** First visit only: how to swipe. Dismissal is kept in localStorage by the page. */
export function SwipeHintOverlay({ onDismiss }: { onDismiss: () => void }) {
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
        className="paper-grain pointer-events-auto relative w-[min(380px,calc(100vw-32px))] rounded-hand bg-paper-3 p-5 shadow-md"
        initial={{ y: 12 }}
        animate={{ y: 0 }}
        exit={{ y: 12, opacity: 0 }}
        transition={{ type: "spring", damping: 18, stiffness: 200 }}
      >
        <button
          type="button"
          aria-label="Dismiss swipe hint"
          onClick={onDismiss}
          className={cn("absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-cut-md text-ink-2 transition-colors hover:bg-surface-soft hover:text-ink", focusRing)}
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
        <h2 className="pr-10 text-h3 text-ink">How to swipe</h2>
        <p className="mt-1 text-body-md text-ink-2">
          {hasKeyboard
            ? "Swipe profiles with your keyboard or the action buttons below."
            : "Swipe the card, or tap the buttons below it."}
        </p>
        <ul className="mt-4 flex flex-col gap-2.5">
          <HintRow
            icon={<ArrowLeft aria-hidden="true" className="h-4 w-4 text-ink-2" />}
            label={hasKeyboard ? "Pass" : "Pass: swipe left"}
            kbd={hasKeyboard ? "←" : ""}
          />
          <HintRow
            icon={<ArrowUp aria-hidden="true" className="h-4 w-4 text-ink-2" />}
            label={hasKeyboard ? "Super like" : "Super like: swipe up"}
            kbd={hasKeyboard ? "↑" : ""}
          />
          <HintRow
            icon={<ArrowRight aria-hidden="true" className="h-4 w-4 text-ink-2" />}
            label={hasKeyboard ? "Like" : "Like: swipe right"}
            kbd={hasKeyboard ? "→" : ""}
          />
          <HintRow
            icon={<Star aria-hidden="true" className="h-4 w-4 text-ink-2" />}
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
  icon: ReactNode;
  label: string;
  kbd: string;
}) {
  return (
    <li className="flex min-h-8 items-center justify-between gap-3 text-body-md text-ink">
      <span className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
      {kbd ? (
        <kbd className="min-w-8 rounded-cut-sm bg-surface px-2 py-0.5 text-center font-sans text-label-md text-ink-2 shadow-xs">
          {kbd}
        </kbd>
      ) : null}
    </li>
  );
}
