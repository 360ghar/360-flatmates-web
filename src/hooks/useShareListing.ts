import { useCallback, useMemo, useState, type RefObject } from "react";
import { toPng } from "html-to-image";
import { SITE_URL } from "@/lib/seo/config";
import type { Property } from "@/lib/api/types";

export interface UseShareListingOptions {
  property: Property;
  cardRef: RefObject<HTMLDivElement | null>;
  message?: string;
}

export interface UseShareListingReturn {
  shareUrl: string;
  copyLink: () => Promise<boolean>;
  shareOnWhatsApp: () => void;
  downloadImage: () => Promise<void>;
  shareImage: () => Promise<void>;
  isGenerating: boolean;
}

export function useShareListing({
  property,
  cardRef,
  message
}: UseShareListingOptions): UseShareListingReturn {
  const [isGenerating, setIsGenerating] = useState(false);

  const shareUrl = useMemo(() => `${SITE_URL}/share/${property.id}`, [property.id]);

  const copyLink = useCallback(async () => {
    if (!navigator.clipboard) {
      return false;
    }
    await navigator.clipboard.writeText(shareUrl);
    return true;
  }, [shareUrl]);

  const shareOnWhatsApp = useCallback(() => {
    const text = message ? `${message}\n\n${shareUrl}` : shareUrl;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, [message, shareUrl]);

  const generateImage = useCallback(async () => {
    if (!cardRef.current) {
      return null;
    }
    setIsGenerating(true);
    try {
      return await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true
      });
    } finally {
      setIsGenerating(false);
    }
  }, [cardRef]);

  const triggerDownload = useCallback(
    (dataUrl: string) => {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `360-flatmates-${property.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [property.id]
  );

  const downloadImage = useCallback(async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;
    triggerDownload(dataUrl);
  }, [generateImage, triggerDownload]);

  const shareImage = useCallback(async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    if (navigator.share && navigator.canShare) {
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File(
          [blob],
          `360-flatmates-${property.id}.png`,
          { type: "image/png" }
        );
        const shareData = {
          title: property.title,
          text: message || shareUrl,
          files: [file]
        };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      } catch {
        // Fall back to download if share fails or is aborted.
      }
    }

    triggerDownload(dataUrl);
  }, [generateImage, triggerDownload, property.id, property.title, message, shareUrl]);

  return {
    shareUrl,
    copyLink,
    shareOnWhatsApp,
    downloadImage,
    shareImage,
    isGenerating
  };
}
