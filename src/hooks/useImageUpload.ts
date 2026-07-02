import { useCallback } from "react";
import { convertToWebP } from "@/lib/image-utils";
import { getEnv } from "@/lib/env";
import { buildApiUrl } from "@/lib/api/client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// Compress on the client before uploading to keep avatar payloads small.
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.82;

interface UploadResponse {
  profile_image_url: string | null;
}

/**
 * Compress `file` to WebP and return the result as a Blob ready for multipart
 * upload. `convertToWebP` returns a base64 data URL (or, on fallback paths, a
 * data URL of the original bytes); `fetch()`-ing that data URL yields the
 * binary Blob. If conversion throws, the caller falls back to the raw file.
 */
async function toWebpBlob(file: File): Promise<Blob> {
  const dataUrl = await convertToWebP(file, MAX_DIMENSION, WEBP_QUALITY);
  const res = await fetch(dataUrl);
  return res.blob();
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as unknown;
    if (typeof payload === "object" && payload !== null) {
      const rec = payload as Record<string, unknown>;
      if (typeof rec.detail === "string") return rec.detail;
      if (typeof rec.message === "string") return rec.message;
    }
  } catch {
    // body wasn't JSON — fall through to status text
  }
  return response.statusText || "Upload failed. Please try again.";
}

/**
 * Uploads a profile avatar via the dedicated `POST /users/me/avatar` endpoint
 * (multipart/form-data, auth required) and returns the hosted avatar URL.
 *
 * The backend converts to WebP, downscales to 512px, stores with PUBLIC
 * visibility, sets `profile_image_url` on the user directly, and deletes the
 * prior avatar — returning the updated user. We reuse its `profile_image_url`
 * so the onboarding draft and final submit stay in sync. (The generic `/upload`
 * would store privately and skip this pipeline.)
 *
 * NOTE: the shared `apiClient.request()` cannot carry multipart — it
 * unconditionally `JSON.stringify`s the body and sets `Content-Type:
 * application/json` (see src/lib/api/client.ts). So this performs a direct
 * `fetch`, attaching the same bearer token the apiClient uses (the Supabase
 * session access token) and reusing `buildApiUrl` + `VITE_API_BASE_URL` so the
 * URL/base match other authenticated requests exactly. The browser sets the
 * multipart `Content-Type` (with boundary) automatically — do not set it.
 */
export function useImageUpload() {
  const upload = useCallback(async (file: File): Promise<string> => {
    const { data } = await getSupabaseBrowserClient().auth.getSession();
    const token = data.session?.access_token ?? null;
    if (!token) {
      throw new Error("Sign in required to upload photos.");
    }

    // Best-effort client-side compression; fall back to the raw bytes so a
    // canvas failure never blocks the upload.
    let blob: Blob = file;
    try {
      blob = await toWebpBlob(file);
    } catch (error) {
      console.error("WebP conversion failed, uploading original:", error);
    }

    const form = new FormData();
    // ponytail: filename extension tracks the compressed type so the backend
    // preserves the webp optimization rather than re-encoding from the name.
    const ext = blob === file
      ? (file.name.split(".").pop()?.toLowerCase() || "jpg")
      : "webp";
    form.append("file", blob, `avatar.${ext}`);

    const response = await fetch(buildApiUrl(getEnv().VITE_API_BASE_URL, "/users/me/avatar"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const payload = (await response.json()) as UploadResponse;
    if (!payload.profile_image_url) {
      throw new Error("Upload succeeded but no image URL was returned.");
    }
    return payload.profile_image_url;
  }, []);

  return { upload };
}
