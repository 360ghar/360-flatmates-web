import { X } from "lucide-react";
import type { MapPin } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { PriceText } from "@/components/ui/PriceText";
import { cn, focusRing } from "@/components/ui/component-utils";

export interface PropertyDetailSheetProps {
  pin: MapPin;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function PropertyDetailSheet({ pin, onClose, onNavigate }: PropertyDetailSheetProps) {
  return (
    <div className="md:hidden max-h-[40vh] overflow-y-auto border-t border-line bg-surface p-2 sm:p-3 shadow-sm">
      <div className="flex items-start gap-2.5">
        {pin.main_image_url && (
          <NetworkImage
            alt={pin.title}
            src={pin.main_image_url}
            wrapperClassName="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-xl"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <PriceText value={pin.monthly_rent ?? 0} variant="hero" />
              <h3 className="mt-0.5 line-clamp-1 text-h4 font-semibold text-ink sm:text-h3">{pin.title}</h3>
              {pin.locality && (
                <p className="mt-0.5 text-caption text-ink-3">{pin.locality}</p>
              )}
            </div>
            <button
              type="button"
              aria-label="Close"
              className={cn("shrink-0 rounded-[9px] p-1.5 text-ink-3 hover:bg-paper-2 hover:text-ink", focusRing)}
              onClick={onClose}
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-1.5 sm:mt-2 flex gap-2">
            <Button
              size="compact"
              fullWidth
              onClick={() => onNavigate(`/listing/${pin.id}`)}
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
