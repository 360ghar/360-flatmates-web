export const UPLOAD_IMAGE_MAX_DIMENSION = 1600;
export const UPLOAD_IMAGE_WEBP_QUALITY = 0.82;

/**
 * Converts an image file to WebP format on the client side, resizing it if it exceeds max dimensions.
 * Returns a promise resolving to the base64 WebP data URL.
 */
export function convertToWebP(
  file: File,
  maxDimension = 1200,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's already an SVG or we're not in a browser environment, read as-is
    if (
      file.type === "image/svg+xml" ||
      typeof window === "undefined" ||
      typeof document === "undefined"
    ) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        try {
          URL.revokeObjectURL(img.src);
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Downscale if exceeds max dimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            // Fallback if context creation fails (e.g., in headless test environments)
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to WebP data URL
          const webpDataUrl = canvas.toDataURL("image/webp", quality);
          resolve(webpDataUrl);
        } catch {
          // Fallback to FileReader on canvas exception
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        // Fallback to FileReader on image load error
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      };
    } catch {
      // General fallback
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }
  });
}

export function convertUploadImageToDataUrl(file: File): Promise<string> {
  return convertToWebP(file, UPLOAD_IMAGE_MAX_DIMENSION, UPLOAD_IMAGE_WEBP_QUALITY);
}

/**
 * Optimizes an image URL if it is from a supported CDN (Unsplash).
 * Transforms format to webp and adjusts dimensions/quality.
 */
export function optimizeImageUrl(
  url: string | null | undefined,
  options?: { width?: number; quality?: number; format?: "webp" | "avif" }
): string | null | undefined {
  if (!url) return url;

  const width = options?.width;
  const quality = options?.quality ?? 80;
  const format = options?.format ?? "webp";

  try {
    if (url.includes("images.unsplash.com")) {
      const parsedUrl = new URL(url);

      if (width) {
        parsedUrl.searchParams.set("w", width.toString());
      }
      parsedUrl.searchParams.set("fm", format);
      parsedUrl.searchParams.set("q", quality.toString());

      if (!parsedUrl.searchParams.has("fit")) {
        parsedUrl.searchParams.set("fit", "crop");
      }
      if (!parsedUrl.searchParams.has("auto")) {
        parsedUrl.searchParams.set("auto", "format");
      }

      return parsedUrl.toString();
    }
  } catch (e) {
    console.error("Error optimizing image URL:", e);
  }

  return url;
}
