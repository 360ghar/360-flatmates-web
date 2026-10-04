import {
  PawPrint,
  ShieldAlert,
  UserCircle
} from "lucide-react";
import {
  formatBudgetRange,
  formatLifestyleLabel,
  formatDate,
  formatMoveInTimeline,
  humanizeSnakeCase
} from "@/lib/utils/format";
import { FactList } from "@/components/ui/FactList";
import { NON_NEGOTIABLE_OPTIONS } from "@/lib/data";
import type { SwipeProfile } from "@/features/swipe/lib/swipeDeck.types";
import { LIFESTYLE_ITEMS } from "@/features/swipe/lib/swipeDeck.utils";
import { ProfileCompatibilitySection } from "./ProfileCompatibilitySection";
import { ProfileListingSection } from "./ProfileListingSection";

export function SwipeProfileExpandedBody({ profile }: { profile: SwipeProfile }) {
  const lifestyleCells = LIFESTYLE_ITEMS.filter((item) => profile[item.key]);

  return (
    <>
      <FactList
        className="sm:grid-cols-2"
        facts={[
          ["Gender", profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : null],
          ["Profession", profile.profession],
          [
            "Budget",
            profile.budgetMin !== undefined || profile.budgetMax !== undefined
              ? formatBudgetRange(profile.budgetMin, profile.budgetMax)
              : null
          ],
          ["Move-in", profile.moveInTimeline ? formatMoveInTimeline(profile.moveInTimeline) : null],
          ["Room free from", profile.availableFrom ? formatDate(profile.availableFrom) : null]
        ]}
      />

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
          <div className="grid grid-cols-2 gap-3 rounded-cut-md bg-surface-soft p-3">
            {lifestyleCells.map((item) => {
              const value = profile[item.key]!;
              const Icon = item.icon;
              const raw = formatLifestyleLabel(item.dimKey, value);
              const label = raw.charAt(0).toUpperCase() + raw.slice(1);
              return (
                <div key={item.key} className="flex items-center gap-2 min-w-0">
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-3" />
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
          <div className="space-y-2 rounded-cut-md bg-surface-soft p-3">
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
                      ? "Men only"
                      : "Women only"}
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
          <ul className="flex flex-col gap-1.5">
            {profile.nonNegotiables.map((nn) => (
              <li key={nn} className="flex items-center gap-2 text-body-md text-ink">
                <ShieldAlert aria-hidden="true" className="h-4 w-4 shrink-0 text-clay" />
                {NON_NEGOTIABLE_OPTIONS.find((o) => o.value === nn)?.label ?? humanizeSnakeCase(nn)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ProfileCompatibilitySection profile={profile} />

      <ProfileListingSection profile={profile} />

      {profile.moveInLabel && !profile.moveInTimeline ? (
        <p className="text-body-md text-ink-3">{profile.moveInLabel}</p>
      ) : null}
    </>
  );
}
