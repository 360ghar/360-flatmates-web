import { Clock, Home, MapPin } from "lucide-react";
import { humanizeSnakeCase } from "@/lib/utils/format";
import type { SwipeProfile } from "./swipeDeck.types";

export function ProfileListingSection({ profile }: { profile: SwipeProfile }) {
  const listingAmenities = [
    ...(profile.flatAmenities ?? []),
    ...(profile.societyAmenities ?? []),
    ...(profile.amenities ?? []),
    ...(profile.features ?? []),
    ...(profile.furnishing ?? [])
  ].filter(Boolean);
  const uniqueAmenities = Array.from(new Set(listingAmenities));
  const hasListing =
    Boolean(profile.propertyTitle) ||
    profile.monthlyRent != null ||
    (profile.imageUrls && profile.imageUrls.length > 0) ||
    Boolean(profile.roomType) ||
    Boolean(profile.flatConfig) ||
    Boolean(profile.societyName) ||
    Boolean(profile.availableFrom);
  const floorLabel =
    profile.floor != null
      ? profile.totalFloors != null
        ? `Floor ${profile.floor} of ${profile.totalFloors}`
        : `Floor ${profile.floor}`
      : null;

  if (!hasListing) return null;

  return (
    <section>
      <h3 className="text-h4 text-ink mb-2">The Place</h3>
      {profile.propertyTitle ? (
        <p className="text-body-md font-semibold text-ink mb-2">
          {profile.propertyTitle}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {profile.flatConfig ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-2 px-2.5 py-1 text-caption font-semibold text-ink">
            <Home aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
            {profile.flatConfig}
          </span>
        ) : null}
        {profile.roomType ? (
          <span className="rounded-full border border-line bg-paper-2 px-2.5 py-1 text-caption font-semibold text-ink">
            {humanizeSnakeCase(profile.roomType)}
          </span>
        ) : null}
        {floorLabel ? (
          <span className="rounded-full border border-line bg-paper-2 px-2.5 py-1 text-caption font-semibold text-ink">
            {floorLabel}
          </span>
        ) : null}
        {profile.bedrooms != null ? (
          <span className="rounded-full border border-line bg-paper-2 px-2.5 py-1 text-caption font-semibold text-ink">
            {profile.bedrooms} BR
          </span>
        ) : null}
        {profile.areaSqft != null ? (
          <span className="rounded-full border border-line bg-paper-2 px-2.5 py-1 text-caption font-semibold text-ink">
            {Math.round(profile.areaSqft)} sqft
          </span>
        ) : null}
        {profile.societyName || profile.location ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-2 px-2.5 py-1 text-caption font-semibold text-ink">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
            {profile.societyName ?? profile.location}
          </span>
        ) : null}
        {profile.availableFrom ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-2 px-2.5 py-1 text-caption font-semibold text-ink">
            <Clock aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
            Available {profile.availableFrom.slice(0, 10)}
          </span>
        ) : null}
      </div>
      {profile.monthlyRent != null ||
      profile.securityDeposit != null ||
      profile.maintenance != null ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.monthlyRent != null ? (
            <div className="rounded-xl bg-accent-soft px-3 py-2 text-label-md font-semibold text-accent">
              ₹{Math.round(profile.monthlyRent).toLocaleString("en-IN")}/mo
            </div>
          ) : null}
          {profile.securityDeposit != null ? (
            <div className="rounded-xl bg-paper-2 px-3 py-2 text-label-md text-ink-2">
              Deposit ₹
              {Math.round(profile.securityDeposit).toLocaleString("en-IN")}
            </div>
          ) : null}
          {profile.maintenance != null ? (
            <div className="rounded-xl bg-paper-2 px-3 py-2 text-label-md text-ink-2">
              Maint. ₹
              {Math.round(profile.maintenance).toLocaleString("en-IN")}
            </div>
          ) : null}
        </div>
      ) : null}
      {uniqueAmenities.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {uniqueAmenities.slice(0, 12).map((a) => (
            <span
              key={a}
              className="rounded-full border border-line bg-paper-2 px-2.5 py-1 text-caption text-ink-2"
            >
              {humanizeSnakeCase(a)}
            </span>
          ))}
        </div>
      ) : null}
      {profile.videoTourUrl ? (
        <a
          href={profile.videoTourUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-label-md font-semibold text-accent hover:underline"
        >
          Watch video tour
        </a>
      ) : null}
    </section>
  );
}
