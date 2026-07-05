import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { buildApiUrl } from "@/lib/api/client";
import type { FlatmatesProfile } from "@/lib/api/types";
import { refreshAccessToken } from "@/lib/auth/refresh";
import { debug } from "@/lib/debug";
import { getEnv } from "@/lib/env";
import { convertUploadImageToDataUrl } from "@/lib/image-utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const REQUEST_TIMEOUT_MS = 30_000;

interface UploadResponse {
  profile_image_url: string | null;
}

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

async function readErrorMessage(response: Response): Promise<string> {
  // The avatar endpoint isn't in the OpenAPI spec, so a 404 likely means the
  // backend hasn't shipped it yet. Surface a friendly, actionable message
  // instead of the raw "Not Found" status text.
  if (response.status === 404) {
    return "Photo upload isn't available right now. Your selection is saved — please try again later.";
  }
  try {
    const payload = (await response.json()) as unknown;
    if (typeof payload === "object" && payload !== null) {
      const record = payload as Record<string, unknown>;
      if (Array.isArray(record.detail)) {
        const messages = record.detail
          .map((item) => {
            if (typeof item === "object" && item !== null) {
              const msg = (item as Record<string, unknown>).msg;
              return typeof msg === "string" ? msg : null;
            }
            return null;
          })
          .filter((msg): msg is string => Boolean(msg));
        if (messages.length > 0) {
          return messages.join(", ");
        }
      }
      if (typeof record.detail === "string") return record.detail;
      if (typeof record.message === "string") return record.message;
    }
  } catch {
    // body wasn't JSON — fall through to status text
  }
  return response.statusText || "Upload failed. Please try again.";
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

        queryClient.setQueryData<FlatmatesProfile | undefined>(["profile", "me"], (current) =>
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
