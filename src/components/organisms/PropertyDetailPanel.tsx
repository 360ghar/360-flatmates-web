import { X, MapPin as MapPinIcon, ShieldCheck, BedDouble, Bath, Ruler, Calendar } from "lucide-react";
import type { MapPin, Property } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { PriceText } from "@/components/ui/PriceText";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, focusRing } from "@/components/ui/component-utils";
import { formatCurrencyINR } from "@/lib/utils/format";

export interface PropertyDetailPanelProps {
  selectedPin: MapPin;
  fullProperty: Property | undefined;
  isPropertyLoading: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function PropertyDetailPanel({
  selectedPin,
  fullProperty,
  isPropertyLoading,
  onClose,
  onNavigate,
}: PropertyDetailPanelProps) {
  return (
    <div className="hidden md:flex md:w-[320px] lg:w-[380px] xl:w-[420px] shrink-0 flex-col border-l border-line bg-surface overflow-y-auto">
      <div className="p-4 lg:p-5 border-b border-line flex items-center justify-between sticky top-0 bg-surface z-10">
        <h2 className="text-h3 font-semibold text-ink">Property Details</h2>
        <button
          type="button"
          aria-label="Close"
          className={cn("rounded-[8px] p-1.5 text-ink-3 hover:bg-paper-2 hover:text-ink transition-colors", focusRing)}
          onClick={onClose}
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      {isPropertyLoading ? (
        <div className="p-4 lg:p-5 space-y-4">
          <Skeleton className="w-full aspect-[16/10] rounded-xl" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
          <Skeleton className="h-24 w-full" />
        </div>
      ) : fullProperty ? (
        <div className="p-4 lg:p-5 space-y-5">
          <div className="relative group">
            <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
              {fullProperty.image_urls && fullProperty.image_urls.length > 0 ? (
                fullProperty.image_urls.map((url, index) => (
                  <div key={index} className="w-full shrink-0 aspect-[16/10] snap-start overflow-hidden rounded-xl border border-line bg-paper-2">
                    <NetworkImage
                      alt={fullProperty.title}
                      src={url}
                      wrapperClassName="w-full h-full rounded-xl"
                      className="object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))
              ) : (
                <div className="w-full shrink-0 aspect-[16/10] overflow-hidden rounded-xl border border-line bg-paper-2">
                  <NetworkImage
                    alt={fullProperty.title}
                    src={fullProperty.main_image_url || selectedPin.main_image_url}
                    wrapperClassName="w-full h-full rounded-xl"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
            {fullProperty.image_urls && fullProperty.image_urls.length > 1 && (
              <span className="absolute bottom-3 right-3 text-[9px] font-sans bg-ink/70 text-paper px-2 py-0.5 rounded-full pointer-events-none">
                Swipe for more ({fullProperty.image_urls.length})
              </span>
            )}
          </div>

          <div>
            <PriceText value={fullProperty.monthly_rent} variant="hero" className="text-accent font-sans font-normal text-2xl" />
            <h3 className="mt-1 text-h3 font-sans font-normal text-ink leading-tight">{fullProperty.title}</h3>
            {fullProperty.locality && (
              <p className="mt-1 flex items-center gap-1.5 text-body-md text-ink-2">
                <MapPinIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
                <span className="truncate">{fullProperty.locality}{fullProperty.city ? `, ${fullProperty.city}` : ""}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-line bg-paper/20 p-2.5 text-center">
              <span className="text-[9px] uppercase font-sans tracking-wider text-ink-3 block">Rent</span>
              <PriceText
                value={fullProperty.monthly_rent}
                variant="inline"
                suffix=""
                className="mt-0.5 text-body-md font-sans font-normal text-accent"
              />
            </div>
            <div className="rounded-xl border border-line bg-paper/20 p-2.5 text-center">
              <span className="text-[9px] uppercase font-sans tracking-wider text-ink-3 block">Deposit</span>
              <p className="text-body-md font-sans font-normal text-ink mt-0.5">
                {fullProperty.security_deposit ? formatCurrencyINR(fullProperty.security_deposit) : "TBD"}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-paper/20 p-2.5 text-center">
              <span className="text-[9px] uppercase font-sans tracking-wider text-ink-3 block">Maint.</span>
              <p className="text-body-md font-sans font-normal text-ink mt-0.5">
                {fullProperty.maintenance_charges ? formatCurrencyINR(fullProperty.maintenance_charges) : "None"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {fullProperty.bedrooms !== undefined && (
              <Chip variant="info" className="bg-paper-2 border-0 text-ink-2 px-2.5 py-1 flex items-center gap-1">
                <BedDouble aria-hidden="true" className="h-3.5 w-3.5 text-ink-3 shrink-0" />
                <span>{fullProperty.bedrooms} BHK</span>
              </Chip>
            )}
            {fullProperty.bathrooms !== undefined && (
              <Chip variant="info" className="bg-paper-2 border-0 text-ink-2 px-2.5 py-1 flex items-center gap-1">
                <Bath aria-hidden="true" className="h-3.5 w-3.5 text-ink-3 shrink-0" />
                <span>{fullProperty.bathrooms} Bath</span>
              </Chip>
            )}
            {fullProperty.area_sqft !== undefined && (
              <Chip variant="info" className="bg-paper-2 border-0 text-ink-2 px-2.5 py-1 flex items-center gap-1">
                <Ruler aria-hidden="true" className="h-3.5 w-3.5 text-ink-3 shrink-0" />
                <span>{fullProperty.area_sqft} sqft</span>
              </Chip>
            )}
            {fullProperty.sharing_type && (
              <Chip variant="info" className="bg-accent-soft/30 border-0 text-accent font-semibold px-2.5 py-1 capitalize">
                {fullProperty.sharing_type.replace("_", " ")}
              </Chip>
            )}
            {fullProperty.gender_preference && (
              <Chip variant="info" className="bg-paper border-0 text-ink-2 px-2.5 py-1 capitalize">
                {fullProperty.gender_preference === "any" ? "Open to Both" : `${fullProperty.gender_preference} only`}
              </Chip>
            )}
          </div>

          {fullProperty.available_from && (
            <div className="flex items-center gap-2 text-body-md text-ink-2 bg-paper-2/40 px-3 py-2 rounded-xl border border-line-low">
              <Calendar className="h-4 w-4 text-accent shrink-0" />
              <span>Available from: <strong>{new Date(fullProperty.available_from).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong></span>
            </div>
          )}

          {fullProperty.description && (
            <div className="border-t border-line pt-3">
              <h4 className="text-caption uppercase font-sans tracking-wider text-ink-3">About this flat</h4>
              <p className="mt-1 text-body-md text-ink-2 leading-relaxed whitespace-pre-line">
                {fullProperty.description}
              </p>
            </div>
          )}

          {fullProperty.features && fullProperty.features.length > 0 && (
            <div className="border-t border-line pt-3">
              <h4 className="text-caption uppercase font-sans tracking-wider text-ink-3 mb-2">Amenities</h4>
              <div className="flex flex-wrap gap-1.5">
                {fullProperty.features.map(f => (
                  <Chip key={f} className="bg-paper border-[0.5px] border-line px-2.5 py-1 text-caption text-ink-2 font-medium">
                    {f}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {fullProperty.owner && (
            <div className="border-t border-line pt-4 flex items-center gap-3">
              <div className="relative shrink-0">
                <Avatar name={fullProperty.owner.full_name} size="sm" src={fullProperty.owner.profile_image_url} />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success border-2 border-surface animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[8px] uppercase font-sans tracking-wider text-ink-3 leading-none block">Verified Host</span>
                <h4 className="text-body-md font-semibold text-ink leading-tight flex items-center gap-0.5 mt-0.5">
                  {fullProperty.owner.full_name}
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                </h4>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2 border-t border-line">
            <Button
              fullWidth
              onClick={() => onNavigate(`/listing/${fullProperty.id}`)}
            >
              View Details
            </Button>
            {fullProperty.owner && (
              <Button
                fullWidth
                variant="secondary"
                onClick={() => onNavigate(`/profile/${fullProperty.owner!.id}`)}
              >
                Contact Host
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-ink-3">No details available.</div>
      )}
    </div>
  );
}
