import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { formatRent } from "@/lib/utils/format";
import { SITE_NAME } from "@/lib/seo/config";
import type { Property } from "@/lib/api/types";
import type { ShareCardFormat } from "@/lib/data";

interface ShareListingCardProps {
  property: Property;
  shareUrl: string;
  format?: ShareCardFormat;
}

const FORMAT_CLASSES: Record<ShareCardFormat, string> = {
  original: "w-[600px] max-w-full aspect-[4/3]",
  whatsapp_square: "w-[400px] max-w-full aspect-square",
  instagram_story: "w-[400px] max-w-full aspect-[4/5]"
};

export const ShareListingCard = forwardRef<HTMLDivElement, ShareListingCardProps>(
  ({ property, shareUrl, format = "original" }, ref) => {
    const price = property.monthly_rent ? formatRent(property.monthly_rent) : null;
    const location = [property.locality, property.city].filter(Boolean).join(", ");

    return (
      <div
        ref={ref}
        className={`flex flex-col overflow-hidden rounded-2xl shadow-2xl ${FORMAT_CLASSES[format]}`}
      >
        <div className="relative flex-1 min-h-0">
          <NetworkImage
            src={property.main_image_url}
            alt={property.title}
            wrapperClassName="absolute inset-0 h-full w-full"
            className="object-cover"
            crossOrigin="anonymous"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="flex flex-col gap-2 bg-accent p-5 text-surface">
          <span className="text-label-md font-semibold uppercase tracking-wider opacity-80">
            {SITE_NAME}
          </span>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="text-h3 font-sans font-semibold leading-tight truncate">
                {property.title}
              </h3>
              <p className="text-body-md opacity-90">
                {price ? `${price} · ` : null}
                {location}
              </p>
            </div>
            <div className="shrink-0 rounded-md bg-surface p-1">
              <QRCodeSVG
                value={shareUrl}
                size={80}
                level="M"
                bgColor="transparent"
                fgColor="#ff385c"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ShareListingCard.displayName = "ShareListingCard";
