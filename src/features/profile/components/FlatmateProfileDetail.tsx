import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { FactList, type Fact } from "@/components/ui/FactList";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { LIFESTYLE_DIMENSIONS, NON_NEGOTIABLE_OPTIONS, type LifestyleDimensionKey } from "@/lib/data";
import type { FlatmatesPeer } from "@/lib/api/types";
import {
  formatBudgetRange,
  formatCurrencyINR,
  formatLifestyleLabel,
  formatMoveInTimeline,
  humanizeSnakeCase
} from "@/lib/utils/format";

const GENDER_PREFERENCE: Record<string, string> = { any: "Any gender", male: "Men only", female: "Women only" };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-h3 text-ink">{title}</h2>
      {children}
    </section>
  );
}

/**
 * A flatmate's profile, read-only: about, basics, lifestyle and deal-breakers,
 * then their place when they have a listing.
 */
export function FlatmateProfileDetail({ profile }: { profile: FlatmatesPeer }) {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const basics: Fact[] = [
    ["Gender", profile.gender ? cap(profile.gender) : null],
    ["Profession", profile.profession],
    [
      "Budget",
      profile.budget_min !== undefined || profile.budget_max !== undefined
        ? formatBudgetRange(profile.budget_min, profile.budget_max)
        : null
    ],
    ["Move-in", profile.move_in_timeline ? formatMoveInTimeline(profile.move_in_timeline) : null],
    ["Flatmate", profile.gender_preference ? GENDER_PREFERENCE[profile.gender_preference] : null],
    ["Pets", profile.has_pets === undefined ? null : profile.has_pets ? "Has pets" : "No pets"]
  ];
  const lifestyle: Fact[] = LIFESTYLE_DIMENSIONS.map((dim) => {
    const value = profile[dim.key as LifestyleDimensionKey];
    return [dim.label, value ? cap(formatLifestyleLabel(dim.key, value)) : null];
  });
  const dealBreakers = (profile.non_negotiables ?? []).map(
    (nn) => NON_NEGOTIABLE_OPTIONS.find((o) => o.value === nn)?.label ?? humanizeSnakeCase(nn)
  );

  const photos = profile.image_urls ?? [];
  const maintenance = profile.maintenance ?? profile.maintenance_charges;
  const hasListing =
    Boolean(profile.property_id) || profile.monthly_rent != null || photos.length > 0 || Boolean(profile.property_title);
  const amenities = profile.flat_amenities ?? profile.amenities ?? [];

  return (
    <>
      <Card className="flex flex-col gap-8 p-5 sm:p-6">
        {profile.bio ? (
          <Section title="About">
            <p className="max-w-[65ch] text-body-lg text-ink-2">{profile.bio}</p>
          </Section>
        ) : null}
        <Section title="Basics">
          <FactList facts={basics} />
        </Section>
        {lifestyle.some(([, v]) => v) ? (
          <Section title="Lifestyle">
            <FactList facts={lifestyle} />
          </Section>
        ) : null}
        {dealBreakers.length > 0 ? (
          <Section title="Deal-breakers">
            <p className="text-body-md text-ink-2">{dealBreakers.join(", ")}.</p>
          </Section>
        ) : null}
      </Card>

      {hasListing ? (
        <Card className="flex flex-col gap-4 p-5 sm:p-6">
          <h2 className="text-h3 text-ink">Their place</h2>
          {photos.length > 0 ? (
            <NetworkImage
              alt={profile.property_title ?? `${profile.full_name}'s place`}
              src={photos[0]}
              width={800}
              wrapperClassName="h-48 w-full overflow-hidden rounded-cut-md object-cover"
            />
          ) : null}
          <FactList
            facts={[
              ["Rent", profile.monthly_rent != null ? `${formatCurrencyINR(profile.monthly_rent)}/mo` : null],
              ["Deposit", profile.security_deposit != null ? formatCurrencyINR(profile.security_deposit) : null],
              ["Maintenance", maintenance != null ? formatCurrencyINR(maintenance) : null],
              ["Flat", profile.flat_config],
              ["Room", profile.room_type ? cap(humanizeSnakeCase(profile.room_type)) : null],
              ["Floor", profile.floor],
              ["Area", profile.society_name ?? profile.sub_locality ?? profile.locality ?? profile.city]
            ]}
          />
          {amenities.length > 0 ? (
            <p className="text-body-md text-ink-2">
              <span className="font-semibold text-ink">Included: </span>
              {amenities.slice(0, 8).join(", ")}
            </p>
          ) : null}
        </Card>
      ) : null}
    </>
  );
}
