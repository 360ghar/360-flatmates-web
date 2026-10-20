import { useState } from "react";
import { apiClient } from "@/lib/api";
import type { Schemas } from "@/lib/api/schema";
import { convertUploadImageToDataUrl } from "@/lib/image-utils";

/**
 * Upload one listing photo to the media library (`POST /upload`) and return
 * its hosted URL. A listing takes photos as hosted URLs in `image_urls`.
 */
export async function uploadListingPhoto(file: File): Promise<string> {
  let blob: Blob = file;
  try {
    // WebP at 1600 px at most: a phone photo is several MB as taken.
    blob = await (await fetch(await convertUploadImageToDataUrl(file))).blob();
  } catch {
    // Conversion failed: upload the original file.
  }
  const form = new FormData();
  form.append("file", blob, blob === file ? file.name : `photo.${blob.type.split("/")[1] || "jpg"}`);
  form.append("folder_type", "property_image");
  const result = await apiClient.request<Schemas["UploadResult"], FormData>({
    method: "POST",
    path: "/upload",
    body: form
  });
  return result.public_url;
}

/**
 * Upload picked photos. `upload` resolves to the hosted URLs in pick order and
 * the number of photos that failed. A file that is not an image is skipped.
 */
export function useListingPhotoUpload() {
  const [uploadingCount, setUploadingCount] = useState(0);

  async function upload(files: File[]): Promise<{ urls: string[]; failed: number }> {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return { urls: [], failed: 0 };
    setUploadingCount((n) => n + images.length);
    const results = await Promise.allSettled(
      images.map(async (file) => {
        try {
          return await uploadListingPhoto(file);
        } finally {
          setUploadingCount((n) => n - 1);
        }
      })
    );
    const urls = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    return { urls, failed: images.length - urls.length };
  }

  return { upload, uploadingCount };
}
