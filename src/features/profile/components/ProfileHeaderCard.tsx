import { userMessage } from "@/lib/api/errors";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Pencil, ImageOff, Loader2 } from "lucide-react";
import { useUpdateProfile } from "@/hooks/queries/useProfiles";
import type { FlatmatesProfileUpdate } from "@/lib/api/types";
import type { FlatmatesProfileInput } from "@/lib/schemas/profile";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { formatLifestyleLabel } from "@/lib/utils/format";
import { uiStore } from "@/lib/stores/ui-store";
import { ONBOARDING_STEPS } from "@/features/onboarding/store";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PaperScene } from "@/components/paper/PaperScene";
import { ProgressRing } from "@/components/ui/ProgressRing";

interface ProfileHeaderCardProps {
  profile: FlatmatesProfileInput;
}

export function ProfileHeaderCard({ profile }: ProfileHeaderCardProps) {
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();
  const { upload: uploadImage } = useAvatarUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Local preview shown while/after an upload attempt. Set to a blob: URL on
  // file selection and swapped to the hosted URL on success. On failure the
  // blob: URL is retained so the user still sees their selection.
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  // Tracks the active object URL so it can be revoked on swap/unmount.
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

  const onboardingProgress = profile.onboarding_completed
    ? 100
    : Math.min(
        ((profile.onboarding_current_step ?? 0) / ONBOARDING_STEPS.length) * 100,
        100
      );

  const lifestyle = (
    [
      ["sleep_schedule", profile.sleep_schedule],
      ["cleanliness", profile.cleanliness],
      ["food_habits", profile.food_habits],
      ["work_style", profile.work_style]
    ] as const
  )
    .map(([key, value]) => formatLifestyleLabel(key, value))
    .filter(Boolean)
    .join(" · ");

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

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

    // Instant local preview before the upload round-trip.
    const localPreview = URL.createObjectURL(file);
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
      uiStore.getState().pushToast({
        type: "success",
        title: "Photo updated",
      });
    } catch (err) {
      // Keep the local preview so the user still sees their selection. The
      // hosted URL is not applied — profile_image_url stays as-is and the
      // user can retry.
      const description =
        userMessage(err, "Could not update your profile photo. Please try again.");
      uiStore.getState().pushToast({
        type: "error",
        title: "Upload failed",
        description,
      });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    const payload: FlatmatesProfileUpdate = { profile_image_url: null };
    updateProfile.mutate(payload, {
      onSuccess: () => {
        // Clear any local blob preview and release the object URL.
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        setPhotoPreview(null);
        uiStore.getState().pushToast({
          type: "success",
          title: "Photo removed",
        });
      },
      onError: (err) => {
        uiStore.getState().pushToast({
          type: "error",
          title: "Could not remove photo",
          description: userMessage(err, "Please try again later or contact support."),
        });
      }
    });
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <Card variant="media" className="relative">
        <PaperScene className="aspect-[25/9] w-full" edgeClassName="bg-surface" />
        <div className="-mt-12 flex flex-col items-center gap-3 px-5 pb-6 text-center sm:-mt-14">
          <div className="relative z-20 rounded-cut-lg ring-4 ring-surface">
            <Avatar
              name={profile.full_name}
              size="xl"
              src={photoPreview ?? profile.profile_image_url ?? null}
              editable
              onEdit={() => {
                if (!photoUploading) handlePhotoUpload();
              }}
            />
            {photoUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-cut-lg bg-surface/60">
                <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-accent" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-h1 text-ink">{profile.full_name}</h1>
            {profile.profession && (
              <p className="mt-1 text-body-md text-ink-2">{profile.profession}</p>
            )}
            {(profile.city || profile.locality) && (
              <p className="mt-1 text-caption text-ink-3">
                {[profile.locality, profile.city].filter(Boolean).join(", ")}
              </p>
            )}
            {profile.mode ? <Badge className="mt-2" mode={profile.mode} variant="mode" /> : null}
          </div>

          {lifestyle ? <p className="max-w-[44ch] text-body-md text-ink-2">{lifestyle}</p> : null}

          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <Button
              size="compact"
              variant="secondary"
              onClick={() => navigate("/profile/edit")}
              leadingIcon={<Pencil aria-hidden="true" className="h-4 w-4" />}
            >
              Edit profile
            </Button>
            {profile.profile_image_url && (
              <Button
                size="compact"
                variant="tertiary"
                onClick={handleRemovePhoto}
                loading={updateProfile.isPending}
                leadingIcon={<ImageOff aria-hidden="true" className="h-4 w-4" />}
              >
                Remove photo
              </Button>
            )}
          </div>

          {!profile.onboarding_completed && (
            <div className="paper-grain mt-2 flex w-full flex-col items-center gap-4 rounded-hand bg-paper-3 p-4 text-center shadow-xs sm:flex-row sm:p-5 sm:text-left">
              <ProgressRing size="lg" value={onboardingProgress} label="Profile completion" />
              <div className="min-w-0 flex-1">
                <h2 className="text-label-lg text-ink">Complete your profile</h2>
                <p className="mt-0.5 text-body-md text-ink-2">
                  {Math.round(onboardingProgress)}% done. A full profile gets better matches.
                </p>
              </div>
              <Button size="compact" onClick={() => navigate("/onboarding")} className="w-full shrink-0 sm:w-auto">
                Continue
              </Button>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
