import { MapPin as MapPinIcon, X } from "lucide-react";
import type { MapPin, Property } from "@/lib/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FactList } from "@/components/ui/FactList";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { PriceText } from "@/components/ui/PriceText";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrencyINR, formatDate, formatSharingType } from "@/lib/utils/format";

export interface PropertyDetailPanelProps {
  selectedPin: MapPin;
  fullProperty: Property | undefined;
  isPropertyLoading: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

const GENDER: Record<string, string> = { any: "Anyone", male: "Men only", female: "Women only" };

/** From md: the picked place beside the map. Photos scroll sideways. */
export function PropertyDetailPanel({ selectedPin, fullProperty, isPropertyLoading, onClose, onNavigate }: PropertyDetailPanelProps) {
  const p = fullProperty;
  const photos = p?.image_urls?.length ? p.image_urls : [p?.main_image_url || selectedPin.main_image_url].filter(Boolean);

  return (
    <aside
      aria-label="Selected place"
      className="paper-grain hidden shrink-0 flex-col overflow-y-auto bg-surface shadow-[-1px_0_0_var(--color-edge)] md:flex md:w-[340px] lg:w-[380px] xl:w-[420px]"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-surface px-4 py-2 shadow-[0_1px_0_var(--color-edge)] lg:px-5">
        <h2 className="text-h3 text-ink">Place</h2>
        <Button aria-label="Close" size="icon" variant="icon" onClick={onClose}>
          <X aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>

      {isPropertyLoading ? (
        <div className="flex flex-col gap-4 p-4 lg:p-5">
          <Skeleton className="aspect-[16/10] w-full rounded-cut-md" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : p ? (
        <div className="flex flex-col gap-5 p-4 lg:p-5">
          <div className="scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto">
            {photos.map((url) => (
              <NetworkImage
                key={url}
                alt={p.title}
                src={url}
                width={800}
                wrapperClassName="aspect-[16/10] w-full shrink-0 snap-start overflow-hidden rounded-cut-md"
              />
            ))}
          </div>
          {photos.length > 1 ? <p className="-mt-3 text-caption text-ink-3">{photos.length} photos. Scroll sideways for more.</p> : null}

          <div>
            <PriceText value={p.monthly_rent} variant="hero" />
            <h3 className="mt-1 text-h3 text-ink">{p.title}</h3>
            {p.locality ? (
              <p className="mt-1 flex items-center gap-1.5 text-body-md text-ink-2">
                <MapPinIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-3" />
                <span className="truncate">{[p.locality, p.city].filter(Boolean).join(", ")}</span>
              </p>
            ) : null}
          </div>

          <FactList
            className="sm:grid-cols-2"
            facts={[
              ["Deposit", p.security_deposit ? formatCurrencyINR(p.security_deposit) : null],
              ["Maintenance", p.maintenance_charges ? formatCurrencyINR(p.maintenance_charges) : null],
              ["Bedrooms", p.bedrooms !== undefined ? `${p.bedrooms} BHK` : null],
              ["Bathrooms", p.bathrooms],
              ["Area", p.area_sqft !== undefined ? `${p.area_sqft} sq ft` : null],
              ["Sharing", p.sharing_type ? formatSharingType(p.sharing_type) : null],
              ["Flatmates", p.gender_preference ? GENDER[p.gender_preference] : null],
              ["Available from", p.available_from ? formatDate(p.available_from) : null]
            ]}
          />

          {p.description ? (
            <section>
              <h4 className="text-label-lg text-ink">About this flat</h4>
              <p className="mt-1 whitespace-pre-line text-body-md text-ink-2">{p.description}</p>
            </section>
          ) : null}

          {p.features?.length ? (
            <p className="text-body-md text-ink-2">
              <span className="font-semibold text-ink">Included: </span>
              {p.features.join(", ")}
            </p>
          ) : null}

          {p.owner ? (
            <div className="flex items-center gap-3">
              <Avatar name={p.owner.full_name} size="sm" src={p.owner.profile_image_url} />
              <div className="min-w-0">
                <p className="text-caption text-ink-3">Listed by</p>
                <p className="truncate text-body-md font-semibold text-ink">{p.owner.full_name}</p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Button fullWidth onClick={() => onNavigate(`/listing/${p.id}`)}>
              View listing
            </Button>
            {p.owner ? (
              <Button fullWidth variant="tertiary" onClick={() => onNavigate(`/profile/${p.owner!.id}`)}>
                See {p.owner.full_name.split(" ")[0]}&apos;s profile
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="p-5 text-body-md text-ink-2">No details for this place.</p>
      )}
    </aside>
  );
}
