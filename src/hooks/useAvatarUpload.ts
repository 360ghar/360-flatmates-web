import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { buildApiUrl, parseErrorEnvelope } from "@/lib/api/client";
import type { SelfUser } from "@/lib/api/types";
import { refreshAccessToken } from "@/lib/auth/refresh";
import { debug } from "@/lib/debug";
import { getEnv } from "@/lib/env";
import type { OwnProfile } from "@/lib/schemas/profile";
import { convertUploadImageToDataUrl } from "@/lib/image-utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const REQUEST_TIMEOUT_MS = 30_000;

/** `POST /users/me/avatar` answers 200 with the signed-in user. */
type UploadResponse = Pick<SelfUser, "profile_image_url">;

async function toWebpBlob(file: File): Promise<Blob> {
  const dataUrl = await convertUploadImageToDataUrl(file);
  const res = await fetch(dataUrl);
  return res.blob();
}

function fileExtensionFor(blob: Blob): string {
  switch (blob.type) {
    case "image/webp":
      return "webp";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/svg+xml":
      return "svg";
    case "image/jpeg":
    case "image/jpg":
    default:
      return "jpg";
  }
}

/**
 * Message for a failed upload. The backend sends the error envelope: a 422 names
 * the failing field first, any other status carries a `message`.
 */
async function readErrorMessage(response: Response): Promise<string> {
  const fallback = response.statusText || "Upload failed. Please try again.";
  try {
    const { message, fields } = parseErrorEnvelope((await response.json()) as unknown, fallback);
    const [first] = Object.values(fields).flat();
    return first ?? message;
  } catch {
    // body was not JSON: fall through to the status text
    return fallback;
  }
}

async function postAvatar(form: FormData, token: string, signal: AbortSignal): Promise<Response> {
  return fetch(buildApiUrl(getEnv().VITE_API_BASE_URL, "/users/me/avatar"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    signal,
  });
}

export function useAvatarUpload() {
  const queryClient = useQueryClient();

  const upload = useCallback(
    async (file: File): Promise<string> => {
      const { data } = await getSupabaseBrowserClient().auth.getSession();
      const token = data.session?.access_token ?? null;
      if (!token) {
        throw new Error("Sign in required to upload photos.");
      }

      let blob: Blob = file;
      try {
        blob = await toWebpBlob(file);
      } catch (error) {
        debug.error("AvatarUpload", "WebP conversion failed, uploading original", error);
      }

      const form = new FormData();
      form.append("file", blob, `avatar.${fileExtensionFor(blob)}`);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        let response = await postAvatar(form, token, controller.signal);

        if (response.status === 401) {
          const refreshedToken = await refreshAccessToken();
          if (!refreshedToken) {
            throw new Error("Your session expired. Please sign in again.");
          }
          response = await postAvatar(form, refreshedToken, controller.signal);
        }

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const payload = (await response.json()) as UploadResponse;
        if (!payload.profile_image_url) {
          throw new Error("Upload succeeded but no image URL was returned.");
        }

        queryClient.setQueryData<OwnProfile | undefined>(["profile", "me"], (current) =>
          current ? { ...current, profile_image_url: payload.profile_image_url ?? undefined } : current
        );
        void queryClient.invalidateQueries({ queryKey: ["profile", "me"] });

        return payload.profile_image_url;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw new Error("Upload timed out. Please try again.");
        }
        throw error;
      } finally {
        window.clearTimeout(timeoutId);
      }
    },
    [queryClient]
  );

  return { upload };
}
