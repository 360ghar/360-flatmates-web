function encodeBase64(bytes: Uint8Array): string {
  const bin = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join("");
  return btoa(bin);
}

function createMinimalPng(r: number, g: number, b: number): string {
  const width = 4;
  const height = 4;

  // Build raw pixel data: each row has a filter byte (0=None) then RGB
  const rawData = new Uint8Array(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 3);
    rawData[rowOffset] = 0; // filter byte: None
    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 3;
      rawData[px] = r;
      rawData[px + 1] = g;
      rawData[px + 2] = b;
    }
  }

  // Compress with zlib deflate (stored block)
  const zlibData = compressZlib(rawData);

  // IHDR chunk data: width, height, bit depth, color type, compression, filter, interlace
  const ihdrData = new Uint8Array(13);
  ihdrData[0] = (width >> 24) & 0xff;
  ihdrData[1] = (width >> 16) & 0xff;
  ihdrData[2] = (width >> 8) & 0xff;
  ihdrData[3] = width & 0xff;
  ihdrData[4] = (height >> 24) & 0xff;
  ihdrData[5] = (height >> 16) & 0xff;
  ihdrData[6] = (height >> 8) & 0xff;
  ihdrData[7] = height & 0xff;
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  ihdrData[10] = 0; // compression: deflate
  ihdrData[11] = 0; // filter: adaptive
  ihdrData[12] = 0; // interlace: none

  const idatType = new Uint8Array([0x49, 0x44, 0x41, 0x54]); // "IDAT"

  const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrChunk = makeChunk(new Uint8Array([0x49, 0x48, 0x44, 0x52]), ihdrData);
  const idatChunk = makeChunk(idatType, zlibData);
  const iendChunk = makeChunk(new Uint8Array([0x49, 0x45, 0x4e, 0x44]), new Uint8Array(0));

  const total = signature.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
  const png = new Uint8Array(total);
  let offset = 0;
  png.set(signature, offset); offset += signature.length;
  png.set(ihdrChunk, offset); offset += ihdrChunk.length;
  png.set(idatChunk, offset); offset += idatChunk.length;
  png.set(iendChunk, offset);

  return "data:image/png;base64," + encodeBase64(png);
}

function makeChunk(type: Uint8Array, data: Uint8Array): Uint8Array {
  const len = data.length;
  const chunk = new Uint8Array(4 + 4 + len + 4); // length + type + data + crc
  // Length (big-endian)
  chunk[0] = (len >> 24) & 0xff;
  chunk[1] = (len >> 16) & 0xff;
  chunk[2] = (len >> 8) & 0xff;
  chunk[3] = len & 0xff;
  // Type
  chunk[4] = type[0];
  chunk[5] = type[1];
  chunk[6] = type[2];
  chunk[7] = type[3];
  // Data
  chunk.set(data, 8);
  // CRC over type + data
  const crcInput = new Uint8Array(4 + len);
  crcInput.set(type, 0);
  crcInput.set(data, 4);
  const crc = crc32(crcInput);
  chunk[8 + len] = (crc >> 24) & 0xff;
  chunk[8 + len + 1] = (crc >> 16) & 0xff;
  chunk[8 + len + 2] = (crc >> 8) & 0xff;
  chunk[8 + len + 3] = crc & 0xff;
  return chunk;
}

function compressZlib(raw: Uint8Array): Uint8Array {
  // Zlib format: CMF + FLG + deflate data + Adler-32
  // Use a single stored (non-compressed) block for simplicity
  const maxBlock = 65535;
  const blocks: Uint8Array[] = [];

  // CMF: deflate, window size 7 (32K)
  // FLG: no preset dict, check bits so CMF*256+FLG is multiple of 31
  const cmf = 0x78; // CM=8 (deflate), CINFO=7 (32K window)
  const flg = 0x01; // FCHECK=1 so 0x7801 = 30721, 30721 % 31 = 0
  blocks.push(new Uint8Array([cmf, flg]));

  let offset = 0;
  while (offset < raw.length) {
    const remaining = raw.length - offset;
    const blockLen = Math.min(remaining, maxBlock);
    const isLast = offset + blockLen >= raw.length;

    // Stored block header: BFINAL (1 bit) + BTYPE (2 bits) = 1 byte
    // BFINAL=1 if last, BTYPE=00 (stored)
    blocks.push(new Uint8Array([isLast ? 0x01 : 0x00]));

    // LEN (2 bytes LE) + NLEN (2 bytes LE, one's complement of LEN)
    const len = blockLen;
    const nlen = len ^ 0xffff;
    blocks.push(new Uint8Array([
      len & 0xff,
      (len >> 8) & 0xff,
      nlen & 0xff,
      (nlen >> 8) & 0xff
    ]));

    // Raw data
    blocks.push(raw.slice(offset, offset + blockLen));
    offset += blockLen;
  }

  // Adler-32 checksum (big-endian)
  const adler = adler32(raw);
  blocks.push(new Uint8Array([
    (adler >> 24) & 0xff,
    (adler >> 16) & 0xff,
    (adler >> 8) & 0xff,
    adler & 0xff
  ]));

  // Concatenate all blocks
  const totalLen = blocks.reduce((sum, b) => sum + b.length, 0);
  const result = new Uint8Array(totalLen);
  let pos = 0;
  for (const block of blocks) {
    result.set(block, pos);
    pos += block.length;
  }
  return result;
}

function adler32(data: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
})();

export function generateBlurPlaceholder(hexColor: string): string {
  const clean = hexColor.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return createMinimalPng(r, g, b);
}

type BlurPlaceholderKey = "warm" | "neutral" | "avatar" | "city";

let blurPlaceholdersCache: Record<BlurPlaceholderKey, string> | null = null;

export function getBlurPlaceholders(): Record<BlurPlaceholderKey, string> {
  if (!blurPlaceholdersCache) {
    blurPlaceholdersCache = {
      warm: generateBlurPlaceholder("#E8DCC8"),
      neutral: generateBlurPlaceholder("#D4D0C8"),
      avatar: generateBlurPlaceholder("#C8BFAA"),
      city: generateBlurPlaceholder("#B8B0A0"),
    };
  }
  return blurPlaceholdersCache;
}

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
