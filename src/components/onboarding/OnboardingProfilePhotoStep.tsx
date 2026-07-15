import { useCallback, useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { uiStore } from "@/lib/stores/ui-store";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import type { OnboardingDraft } from "@/lib/schemas/onboarding";

export function OnboardingProfilePhotoStep({
  fullName,
  profileImageUrl,
  patchDraft
}: {
  fullName?: string;
  profileImageUrl?: string;
  patchDraft: (patch: Partial<OnboardingDraft>) => void;
}) {
  const { upload: uploadImage } = useAvatarUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  // Tracks the active object URL so we can revoke it on swap/unmount to avoid
  // leaking blob: URLs. Null when the current preview is a hosted URL (or none).
  const objectUrlRef = useRef<string | null>(null);

  // Revoke any outstanding object URL when the component unmounts.
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const handlePhotoSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset so re-picking the same file (e.g. after a failure) fires again.
      e.target.value = "";
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        uiStore.getState().pushToast({
          type: "error",
          title: "Unsupported file",
          description: "Please choose an image file.",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        uiStore.getState().pushToast({
          type: "error",
          title: "Image too large",
          description: "Please choose an image under 5 MB.",
        });
        return;
      }

      // Show an instant local preview so the user gets visual feedback before
      // the (possibly slow or missing) upload round-trip completes.
      const localPreview = URL.createObjectURL(file);
      // Revoke the previous object URL (if any) before replacing it.
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      objectUrlRef.current = localPreview;
      setPhotoPreview(localPreview);

      setPhotoUploading(true);
      try {
        const publicUrl = await uploadImage(file);
        // Swap the local preview for the hosted URL and release the blob.
        if (objectUrlRef.current === localPreview) {
          URL.revokeObjectURL(localPreview);
          objectUrlRef.current = null;
        }
        setPhotoPreview(publicUrl);
        patchDraft({ profile_image_url: publicUrl });
        uiStore.getState().pushToast({
          type: "success",
          title: "Photo uploaded",
        });
      } catch (err) {
        // Keep the local object URL preview so the user still sees their
        // selection. Do NOT patch the draft with a hosted URL — the upload
        // didn't succeed, so profile_image_url stays as-is and the user can
        // retry. The error toast carries the friendly message.
        const description =
          err instanceof Error ? err.message : "Could not upload your photo. Please try again.";
        uiStore.getState().pushToast({
          type: "error",
          title: "Upload failed",
          description,
        });
      } finally {
        setPhotoUploading(false);
      }
    },
    [uploadImage, patchDraft]
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <>
      <h2 className="text-h2">Add a profile photo</h2>
      <p className="text-body-md text-ink-2">
        Profiles with photos get 3x more responses. You can add or change it later.
      </p>
      <div className="flex flex-col items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="sr-only"
          aria-label="Choose profile photo"
        />
        <Avatar
          name={fullName ?? "You"}
          size="xl"
          src={photoPreview ?? profileImageUrl ?? null}
          editable
          onEdit={openFilePicker}
        />
        <Button
          variant="secondary"
          onClick={openFilePicker}
          loading={photoUploading}
          disabled={photoUploading}
          leadingIcon={<Camera aria-hidden="true" className="h-4 w-4" />}
        >
          {photoUploading
            ? "Uploading..."
            : photoPreview || profileImageUrl
              ? "Change Photo"
              : "Choose Photo"}
        </Button>
      </div>
    </>
  );
}
