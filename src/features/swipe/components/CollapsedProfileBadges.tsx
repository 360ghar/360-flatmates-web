import { ShieldAlert } from "lucide-react";
import { formatBudgetRange, formatLifestyleLabel } from "@/lib/utils/format";
import type { SwipeProfile } from "@/features/swipe/lib/swipeDeck.types";
import { LIFESTYLE_ITEMS, matchToneLabel } from "@/features/swipe/lib/swipeDeck.utils";

/** The facts printed on the photo: plain lines on the scrim, no chips. */
export function CollapsedProfileBadges({ profile }: { profile: SwipeProfile }) {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const facts = [
    profile.gender ? cap(profile.gender) : null,
    profile.profession,
    profile.budgetMin !== undefined || profile.budgetMax !== undefined
      ? formatBudgetRange(profile.budgetMin, profile.budgetMax)
      : null
  ].filter(Boolean);
  const shared = profile.topMatches?.length
    ? profile.topMatches.slice(0, 3)
    : LIFESTYLE_ITEMS.filter((item) => profile[item.key])
        .slice(0, 2)
        .map((item) => cap(formatLifestyleLabel(item.dimKey, profile[item.key]!)));
  const dealCount = profile.nonNegotiables?.length ?? 0;
  const tone = profile.matchScore > 0 ? matchToneLabel(profile.matchScore) : null;

  return (
    <div className="mt-1 flex flex-col gap-1 text-white/90 [text-shadow:0_1px_2px_rgb(18_24_20/0.5)]">
      {tone ? <p className="text-caption font-semibold">{tone}</p> : null}
      {facts.length ? <p className="line-clamp-1 text-body-md">{facts.join(" · ")}</p> : null}
      {shared.length ? <p className="line-clamp-1 text-body-md font-semibold text-white">{shared.join(" · ")}</p> : null}
      {dealCount > 0 || profile.moveInLabel ? (
        <p className="flex items-center gap-1.5 text-caption">
          {dealCount > 0 ? (
            <>
              <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />
              {dealCount} {dealCount === 1 ? "deal-breaker" : "deal-breakers"}
            </>
          ) : null}
          {dealCount > 0 && profile.moveInLabel ? <span aria-hidden="true">·</span> : null}
          {profile.moveInLabel ? <span>Moves in: {profile.moveInLabel}</span> : null}
        </p>
      ) : null}
    </div>
  );
}
