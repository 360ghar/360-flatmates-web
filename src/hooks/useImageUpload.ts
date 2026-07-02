import { useCallback } from "react";

import { convertUploadImageToDataUrl } from "@/lib/image-utils";

/**
 * Converts an image into a client-side preview/data URL for property photo
 * flows. Listing creation and edit screens then hand that string to the
 * property image upload mutation once the property exists.
 */
export function useImageUpload() {
  const upload = useCallback(async (file: File): Promise<string> => {
    return convertUploadImageToDataUrl(file);
  }, []);

  return { upload };
}
