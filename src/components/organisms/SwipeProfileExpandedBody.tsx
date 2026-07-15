import {
  Briefcase,
  Clock,
  PawPrint,
  ShieldAlert,
  UserCircle
} from "lucide-react";
import {
  formatBudgetRange,
  formatLifestyleLabel,
  formatMoveInTimeline,
  humanizeSnakeCase
} from "@/lib/utils/format";
import { NON_NEGOTIABLE_OPTIONS } from "@/lib/data";
import type { SwipeProfile } from "./swipeDeck.types";
import { LIFESTYLE_ITEMS } from "./swipeDeck.utils";
import { ProfileCompatibilitySection } from "./ProfileCompatibilitySection";
import { ProfileListingSection } from "./ProfileListingSection";

export function SwipeProfileExpandedBody({ profile }: { profile: SwipeProfile }) {
  const lifestyleCells = LIFESTYLE_ITEMS.filter((item) => profile[item.key]);

  return (
    <>
      {/* Quick facts strip */}
      <div className="flex flex-wrap gap-2 border-b border-line/45 pb-5">
        {profile.gender ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-paper-2 px-3 py-2 text-label-md font-semibold text-ink">
            <UserCircle aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
            {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
          </span>
        ) : null}
        {profile.profession ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-paper-2 px-3 py-2 text-label-md font-semibold text-ink max-w-[180px] truncate">
            <Briefcase aria-hidden="true" className="h-3.5 w-3.5 text-ink-3 shrink-0" />
            {profile.profession}
          </span>
        ) : null}
        {profile.budgetMin !== undefined || profile.budgetMax !== undefined ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-accent-soft px-3 py-2 text-label-md font-semibold text-accent">
            {formatBudgetRange(profile.budgetMin, profile.budgetMax)}
          </span>
        ) : null}
        {profile.moveInTimeline ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-teal-soft px-3 py-2 text-label-md font-semibold text-teal-mid">
            <Clock aria-hidden="true" className="h-3.5 w-3.5" />
            {formatMoveInTimeline(profile.moveInTimeline)}
          </span>
        ) : null}
        {profile.availableFrom ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-paper-2 px-3 py-2 text-label-md font-semibold text-ink">
            <Clock aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
            From {profile.availableFrom.slice(0, 10)}
          </span>
        ) : null}
      </div>

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
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-line/45 bg-paper-2 p-3">
            {lifestyleCells.map((item) => {
              const value = profile[item.key]!;
              const Icon = item.icon;
              const raw = formatLifestyleLabel(item.dimKey, value);
              const label = raw.charAt(0).toUpperCase() + raw.slice(1);
              return (
                <div key={item.key} className="flex items-center gap-2 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
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
          <div className="rounded-xl border border-line/45 bg-paper-2 p-3 space-y-2">
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
                      ? "Male only"
                      : "Female only"}
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
          <div className="flex flex-wrap gap-2 rounded-xl border border-warning/25 bg-warning-soft p-3">
            {profile.nonNegotiables.map((nn) => {
              const label =
                NON_NEGOTIABLE_OPTIONS.find((o) => o.value === nn)?.label ??
                humanizeSnakeCase(nn);
              return (
                <span
                  key={nn}
                  className="inline-flex items-center gap-1.5 rounded-full border border-warning/25 bg-surface/70 px-2.5 py-1 text-caption font-semibold text-warning"
                >
                  <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />
                  {label}
                </span>
              );
            })}
          </div>
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
