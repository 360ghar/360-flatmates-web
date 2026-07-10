import {
  Briefcase,
  Clock,
  Home,
  IndianRupee,
  MapPin,
  PawPrint,
  ShieldAlert,
  UserCircle
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { NetworkImage } from "@/components/ui/NetworkImage";
import {
  LIFESTYLE_DIMENSIONS,
  NON_NEGOTIABLE_OPTIONS,
  type LifestyleDimensionKey
} from "@/lib/data";
import type { FlatmatesPeer } from "@/lib/api/types";
import {
  formatBudgetRange,
  formatLifestyleLabel,
  formatMoveInTimeline
} from "@/lib/utils/format";
import { humanizeSnakeCase } from "@/lib/utils";

/**
 * Rich, read-only flatmate profile detail. Mirrors the swipe card's expanded
 * view (specifications grid → about → budget & move-in → lifestyle →
 * preferences) and appends an optional listing summary when the peer has an
 * active flatmate/PG listing. Shared by the public profile page.
 */
export function FlatmateProfileDetail({ profile }: { profile: FlatmatesPeer }) {
  const budgetLabel =
    profile.budget_min !== undefined || profile.budget_max !== undefined
      ? formatBudgetRange(profile.budget_min, profile.budget_max)
      : null;
  const moveInLabel = profile.move_in_timeline
    ? formatMoveInTimeline(profile.move_in_timeline)
    : null;

  const lifestyleDims = LIFESTYLE_DIMENSIONS.filter((dim) =>
    Boolean(profile[dim.key as LifestyleDimensionKey])
  );

  const genderPrefLabel =
    profile.gender_preference === "any"
      ? "Any gender"
      : profile.gender_preference === "male"
        ? "Male only"
        : profile.gender_preference === "female"
          ? "Female only"
          : null;

  const nonNegotiables = profile.non_negotiables ?? [];
  const showPreferences =
    Boolean(genderPrefLabel) || profile.has_pets !== undefined;

  // Listing summary: only when the peer actually has listing context.
  const photos = profile.image_urls ?? [];
  const hasListing =
    Boolean(profile.property_id) ||
    profile.monthly_rent != null ||
    photos.length > 0 ||
    Boolean(profile.property_title);
  const listingAmenities = profile.flat_amenities ?? profile.amenities ?? [];

  return (
    <>
      <Card className="flex flex-col gap-5 p-5">
        {/* Basic specifications grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 border-b border-line/45 pb-5">
          <Spec label="Gender">
            {profile.gender
              ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)
              : "Not specified"}
          </Spec>
          <Spec label="Profession">
            <span className="line-clamp-1">
              {profile.profession || "Not specified"}
            </span>
          </Spec>
          <Spec label="Budget">
            {budgetLabel ?? "Any budget"}
          </Spec>
          <Spec label="Move-In Timeline">
            {moveInLabel ?? "Flexible"}
          </Spec>
        </div>

        {/* About */}
        {profile.bio || profile.profession ? (
          <section>
            <h3 className="text-h4 text-ink mb-2">About</h3>
            {profile.profession ? (
              <p className="flex items-center gap-2 text-body-md text-ink-2 mb-2">
                <Briefcase aria-hidden="true" className="h-4 w-4 text-ink-3" />
                {profile.profession}
              </p>
            ) : null}
            {profile.bio ? (
              <p className="text-body-md text-ink-2 leading-relaxed max-w-[65ch]">
                {profile.bio}
              </p>
            ) : null}
          </section>
        ) : null}

        {/* Budget & Move-in chips */}
        {budgetLabel || moveInLabel ? (
          <section>
            <h3 className="text-h4 text-ink mb-2">Budget &amp; Move-in</h3>
            <div className="flex flex-wrap gap-3">
              {budgetLabel ? (
                <div className="flex items-center gap-2 rounded-xl bg-accent-soft px-3 py-2">
                  <span className="text-label-md text-accent font-semibold">
                    {budgetLabel}
                  </span>
                </div>
              ) : null}
              {moveInLabel ? (
                <div className="flex items-center gap-2 rounded-xl bg-teal-soft px-3 py-2">
                  <Clock aria-hidden="true" className="h-4 w-4 text-teal-mid" />
                  <span className="text-label-md text-teal-mid font-semibold">
                    {moveInLabel}
                  </span>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Lifestyle */}
        {lifestyleDims.length > 0 ? (
          <section>
            <h3 className="text-h4 text-ink mb-2">Lifestyle</h3>
            <div className="flex flex-wrap gap-2">
              {lifestyleDims.map((dim) => {
                const value = profile[dim.key as LifestyleDimensionKey];
                if (!value) return null;
                const label = formatLifestyleLabel(dim.key, value);
                return (
                  <Chip key={dim.key} variant="info" className="bg-paper-2">
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </Chip>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Preferences */}
        {showPreferences ? (
          <section>
            <h3 className="text-h4 text-ink mb-2">Preferences</h3>
            <div className="flex flex-wrap gap-2">
              {genderPrefLabel ? (
                <Chip variant="info" className="bg-paper-2">
                  <UserCircle aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
                  {genderPrefLabel}
                </Chip>
              ) : null}
              {profile.has_pets !== undefined ? (
                <Chip variant="info" className="bg-paper-2">
                  <PawPrint aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
                  {profile.has_pets ? "Has pets" : "No pets"}
                </Chip>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Deal-breakers */}
        {nonNegotiables.length > 0 ? (
          <section>
            <h3 className="text-h4 text-ink mb-2">Deal-breakers</h3>
            <div className="flex flex-wrap gap-2">
              {nonNegotiables.map((nn) => {
                const label =
                  NON_NEGOTIABLE_OPTIONS.find((o) => o.value === nn)?.label ??
                  humanizeSnakeCase(nn);
                return (
                  <Chip
                    key={nn}
                    variant="info"
                    className="bg-warning-soft text-warning"
                  >
                    <ShieldAlert
                      aria-hidden="true"
                      className="h-3.5 w-3.5 text-warning"
                    />
                    {label}
                  </Chip>
                );
              })}
            </div>
          </section>
        ) : null}
      </Card>

      {/* Listing summary (only when the peer has a flatmate/PG listing) */}
      {hasListing ? (
        <Card className="flex flex-col gap-4 p-5">
          <h3 className="text-h4 text-ink">The Place</h3>
          {photos.length > 0 ? (
            <div className="overflow-hidden rounded-xl">
              <NetworkImage
                alt={profile.property_title ?? profile.full_name}
                src={photos[0]}
                width={800}
                wrapperClassName="h-44 w-full object-cover"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {profile.flat_config ? (
              <Chip variant="info" className="bg-paper-2">
                <Home aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
                {profile.flat_config}
              </Chip>
            ) : null}
            {profile.room_type ? (
              <Chip variant="info" className="bg-paper-2">
                {humanizeSnakeCase(profile.room_type)}
              </Chip>
            ) : null}
            {profile.floor ? (
              <Chip variant="info" className="bg-paper-2">
                Floor {profile.floor}
              </Chip>
            ) : null}
            {profile.locality || profile.sub_locality || profile.city ? (
              <Chip variant="info" className="bg-paper-2">
                <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
                {profile.society_name ??
                  profile.sub_locality ??
                  profile.locality ??
                  profile.city}
              </Chip>
            ) : null}
          </div>

          {profile.monthly_rent != null ||
          profile.security_deposit != null ||
          profile.maintenance != null ||
          profile.maintenance_charges != null ? (
            <div className="flex flex-wrap gap-3 border-t border-line/45 pt-4">
              {profile.monthly_rent != null ? (
                <CostLine
                  icon={<IndianRupee aria-hidden="true" className="h-4 w-4" />}
                  label="Rent/mo"
                  value={`₹${Math.round(profile.monthly_rent).toLocaleString()}`}
                />
              ) : null}
              {profile.security_deposit != null ? (
                <CostLine
                  icon={<IndianRupee aria-hidden="true" className="h-4 w-4" />}
                  label="Deposit"
                  value={`₹${Math.round(profile.security_deposit).toLocaleString()}`}
                />
              ) : null}
              {(profile.maintenance ?? profile.maintenance_charges) != null ? (
                <CostLine
                  icon={<IndianRupee aria-hidden="true" className="h-4 w-4" />}
                  label="Maintenance"
                  value={`₹${Math.round(
                    (profile.maintenance ?? profile.maintenance_charges) as number
                  ).toLocaleString()}`}
                />
              ) : null}
            </div>
          ) : null}

          {listingAmenities.length > 0 ? (
            <div className="flex flex-wrap gap-2 border-t border-line/45 pt-4">
              {listingAmenities.slice(0, 8).map((a) => (
                <Chip key={a} variant="info" className="bg-paper-2">
                  {a}
                </Chip>
              ))}
            </div>
          ) : null}
        </Card>
      ) : null}
    </>
  );
}

function Spec({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-ink-3">{label}</span>
      <span className="text-body-md font-semibold text-ink">{children}</span>
    </div>
  );
}

function CostLine({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-paper-2 px-3 py-2">
      <span className="text-ink-3">{icon}</span>
      <span className="text-label-md text-ink-2">{label}</span>
      <span className="text-label-md font-semibold text-ink">{value}</span>
    </div>
  );
}
