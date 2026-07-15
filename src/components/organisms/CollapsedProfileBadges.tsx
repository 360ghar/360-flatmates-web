import { ShieldAlert } from "lucide-react";
import { formatBudgetRange, formatLifestyleLabel } from "@/lib/utils/format";
import type { SwipeProfile } from "./swipeDeck.types";
import { LIFESTYLE_ITEMS, matchToneLabel } from "./swipeDeck.utils";

export function CollapsedProfileBadges({ profile }: { profile: SwipeProfile }) {
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
