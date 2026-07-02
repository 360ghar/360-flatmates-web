import { useCallback } from "react";

import { convertToWebP } from "@/lib/image-utils";

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.82;

/**
 * Converts an image into a client-side preview/data URL for property photo
 * flows. Listing creation and edit screens then hand that string to the
 * property image upload mutation once the property exists.
 */
export function useImageUpload() {
  const upload = useCallback(async (file: File): Promise<string> => {
    return convertToWebP(file, MAX_DIMENSION, WEBP_QUALITY);
  }, []);

  return { upload };
}
