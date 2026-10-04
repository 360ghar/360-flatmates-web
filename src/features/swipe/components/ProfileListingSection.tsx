import { FactList } from "@/components/ui/FactList";
import { formatDate, humanizeSnakeCase } from "@/lib/utils/format";
import type { SwipeProfile } from "@/features/swipe/lib/swipeDeck.types";

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

  const money = (n?: number | null) => (n != null ? `₹${Math.round(n).toLocaleString("en-IN")}` : null);

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-h4 text-ink">Their place</h3>
      {profile.propertyTitle ? <p className="text-body-md font-semibold text-ink">{profile.propertyTitle}</p> : null}
      <FactList
        className="sm:grid-cols-2"
        facts={[
          ["Rent", profile.monthlyRent != null ? `${money(profile.monthlyRent)}/mo` : null],
          ["Deposit", money(profile.securityDeposit)],
          ["Maintenance", money(profile.maintenance)],
          ["Flat", profile.flatConfig],
          ["Room", profile.roomType ? humanizeSnakeCase(profile.roomType) : null],
          ["Floor", floorLabel?.replace("Floor ", "")],
          ["Bedrooms", profile.bedrooms],
          ["Area", profile.areaSqft != null ? `${Math.round(profile.areaSqft)} sq ft` : null],
          ["Where", profile.societyName ?? profile.location],
          ["Available from", profile.availableFrom ? formatDate(profile.availableFrom) : null]
        ]}
      />
      {uniqueAmenities.length > 0 ? (
        <p className="text-body-md text-ink-2">
          <span className="font-semibold text-ink">Included: </span>
          {uniqueAmenities.slice(0, 12).map(humanizeSnakeCase).join(", ")}
        </p>
      ) : null}
      {profile.videoTourUrl ? (
        <a
          href={profile.videoTourUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center self-start text-label-lg text-accent underline-offset-4 hover:underline"
        >
          Watch video tour
        </a>
      ) : null}
    </section>
  );
}
