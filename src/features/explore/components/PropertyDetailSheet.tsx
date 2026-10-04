import { X } from "lucide-react";
import type { MapPin } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { PriceText } from "@/components/ui/PriceText";

export interface PropertyDetailSheetProps {
  pin: MapPin;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

/** Below md: the picked place on a paper strip under the map. */
export function PropertyDetailSheet({ pin, onClose, onNavigate }: PropertyDetailSheetProps) {
  return (
    <section
      aria-label="Selected place"
      className="paper-grain max-h-[40vh] overflow-y-auto bg-surface p-3 shadow-[0_-1px_0_var(--color-edge)] md:hidden"
    >
      <div className="flex items-start gap-3">
        {pin.main_image_url ? (
          <NetworkImage alt="" src={pin.main_image_url} wrapperClassName="h-16 w-16 shrink-0 rounded-cut-md" />
        ) : null}
        <div className="min-w-0 flex-1">
          <PriceText value={pin.monthly_rent} variant="hero" />
          <h3 className="mt-0.5 line-clamp-1 text-body-lg font-semibold text-ink">{pin.title}</h3>
          {pin.locality ? <p className="mt-0.5 text-caption text-ink-3">{pin.locality}</p> : null}
        </div>
        <Button aria-label="Close" size="icon" variant="icon" className="-mr-1 -mt-1" onClick={onClose}>
          <X aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>
      <Button className="mt-3" size="compact" fullWidth onClick={() => onNavigate(`/listing/${pin.id}`)}>
        View listing
      </Button>
    </section>
  );
}
