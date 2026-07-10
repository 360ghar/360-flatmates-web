import { useRef, useState } from "react";
import { Link2, MessageCircle, Download, Share2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ShareListingCard } from "@/components/molecules/ShareListingCard";
import { useShareListing } from "@/hooks/useShareListing";
import { uiStore } from "@/lib/stores/ui-store";
import type { Property } from "@/lib/api/types";
import type { ShareCardFormat } from "@/lib/data";

interface ShareSheetProps {
  property: Property;
  open: boolean;
  onClose: () => void;
}

const FORMAT_OPTIONS = [
  { value: "original", label: "Standard" },
  { value: "whatsapp_square", label: "WhatsApp" },
  { value: "instagram_story", label: "Instagram" }
];

export function ShareSheet({ property, open, onClose }: ShareSheetProps) {
  const [format, setFormat] = useState<ShareCardFormat>("original");
  const cardRef = useRef<HTMLDivElement>(null);
  const { shareUrl, copyLink, shareOnWhatsApp, downloadImage, shareImage, isGenerating } =
    useShareListing({
      property,
      cardRef,
      message: `Check out this flat on 360 Flatmates`
    });

  const handleCopy = async () => {
    const ok = await copyLink();
    if (ok) {
      uiStore.getState().pushToast({
        type: "success",
        title: "Link copied",
        description: "Share it anywhere you like."
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Share this listing" size="wide" footer={null}>
      <div className="flex flex-col gap-6">
        <SegmentedControl
          options={FORMAT_OPTIONS}
          value={format}
          onValueChange={(value) => setFormat(value as ShareCardFormat)}
          ariaLabel="Share card format"
        />

        <div className="flex justify-center rounded-xl bg-paper-2 p-4">
          <ShareListingCard
            ref={cardRef}
            property={property}
            shareUrl={shareUrl}
            format={format}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={handleCopy}>
            <Link2 className="h-4 w-4" aria-hidden="true" />
            Copy Link
          </Button>
          <Button variant="secondary" onClick={shareOnWhatsApp}>
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </Button>
          <Button variant="secondary" onClick={downloadImage} loading={isGenerating}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Download Image
          </Button>
          <Button onClick={shareImage} loading={isGenerating}>
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Share Image
          </Button>
        </div>
      </div>
    </Modal>
  );
}
