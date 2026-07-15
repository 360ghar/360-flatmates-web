import { useCallback, useState } from "react";
import { useImageUpload } from "@/hooks/useImageUpload";
import { uiStore } from "@/lib/stores/ui-store";
import type { PropertyCreate } from "@/lib/api/types";
import { type PendingImage } from "./postListingUtils";

/** Collects the ready-to-submit preview URLs from a list of pending images in
 *  a single pass (skips images that haven't finished processing yet). */
function previewUrls(images: PendingImage[]): string[] {
  const urls: string[] = [];
  for (const img of images) {
    if (img.preview) urls.push(img.preview);
  }
  return urls;
}

export function usePendingImages(setForm: (updater: (prev: Partial<PropertyCreate>) => Partial<PropertyCreate>) => void) {
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const { upload: uploadImageFile } = useImageUpload();

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const newImages: PendingImage[] = await Promise.all(
      imageFiles.map(
        async (f) => {
          try {
            const preview = await uploadImageFile(f);
            return {
              id: `${f.name}-${crypto.randomUUID()}`,
              file: f,
              preview,
              uploaded: false,
              uploading: false
            };
          } catch {
            return {
              id: `${f.name}-${crypto.randomUUID()}`,
              file: f,
              preview: "",
              uploaded: false,
              uploading: false
            };
          }
        }
      )
    );
    setPendingImages((prev) => [...prev, ...newImages]);
    setForm((prev) => ({
      ...prev,
      image_urls: [...(prev.image_urls ?? []), ...previewUrls(newImages)]
    }));
  }, [uploadImageFile, setForm]);

  function removeImage(id: string) {
    // Functional update (like retryImage below): avoids clobbering a
    // concurrent handleFiles add with a stale `pendingImages` snapshot.
    let nextImageUrls: string[] = [];
    setPendingImages((prev) => {
      const next = prev.filter((i) => i.id !== id);
      nextImageUrls = previewUrls(next);
      return next;
    });
    setForm((f) => ({ ...f, image_urls: nextImageUrls }));
  }

  /* Re-attempt the local conversion/encoding for an image that failed to preview. */
  const retryImage = useCallback(
    async (id: string) => {
      const target = pendingImages.find((i) => i.id === id);
      if (!target) return;
      setPendingImages((prev) => prev.map((i) => (i.id === id ? { ...i, uploading: true } : i)));
      try {
        const preview = await uploadImageFile(target.file);
        // Read from `prev` (not the `pendingImages` closed over above) so a
        // concurrent add/remove/retry that resolved during this await isn't
        // clobbered by this call's stale snapshot.
        let nextImageUrls: string[] = [];
        setPendingImages((prev) => {
          const next = prev.map((i) => (i.id === id ? { ...i, preview, uploading: false } : i));
          nextImageUrls = previewUrls(next);
          return next;
        });
        setForm((f) => ({ ...f, image_urls: nextImageUrls }));
      } catch {
        setPendingImages((prev) => prev.map((i) => (i.id === id ? { ...i, uploading: false } : i)));
        uiStore.getState().pushToast({
          type: "error",
          title: "Could not process photo",
          description: "Please try a different image."
        });
      }
    },
    [pendingImages, uploadImageFile, setForm]
  );

  return { pendingImages, setPendingImages, handleFiles, removeImage, retryImage };
}
