import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Pencil, ImageOff, Loader2 } from "lucide-react";
import { useUpdateProfile } from "@/hooks/queries";
import type { FlatmatesProfileUpdate } from "@/lib/api/types";
import type { FlatmatesProfileInput } from "@/lib/schemas/profile";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { uiStore } from "@/lib/stores/ui-store";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { TrustBadge } from "@/components/ui/TrustBadge";

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
    : ((profile.onboarding_current_step ?? 0) / 8) * 100;

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
        err instanceof Error ? err.message : "Could not update your profile photo. Please try again.";
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
          description: err instanceof Error ? err.message : "Please try again later or contact support.",
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

      <Card variant="media" className="relative border-line shadow-md">
        <div className="h-20 bg-gradient-to-br from-accent-soft via-lavender to-surface-soft sm:h-24" aria-hidden="true" />
        <div className="-mt-12 flex flex-col items-center gap-3 px-5 pb-6 text-center sm:-mt-14">
          <div className="relative rounded-2xl ring-4 ring-surface shadow-md">
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
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-surface/60">
                <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-accent" />
              </div>
            )}
          </div>
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
          <div>
            <h1 className="text-h1">{profile.full_name}</h1>
            {profile.profession && (
              <p className="mt-1 text-body-md text-ink-2">{profile.profession}</p>
            )}
            {(profile.city || profile.locality) && (
              <p className="mt-1 text-caption text-ink-3">
                {[profile.locality, profile.city].filter(Boolean).join(", ")}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {profile.mode && <Badge mode={profile.mode} variant="mode" />}
              <TrustBadge variant="verified" />
            </div>
          </div>

          {/* Lifestyle strip when dimensions exist */}
          {(profile.sleep_schedule ||
            profile.cleanliness ||
            profile.food_habits ||
            profile.work_style) && (
            <div className="mt-1 flex w-full flex-wrap justify-center gap-1.5">
              {profile.sleep_schedule && (
                <span className="rounded-full bg-purple-soft px-2.5 py-1 text-caption font-medium text-purple-ink">
                  {profile.sleep_schedule.replace(/_/g, " ")}
                </span>
              )}
              {profile.cleanliness && (
                <span className="rounded-full bg-blue-soft px-2.5 py-1 text-caption font-medium text-blue-ink">
                  {profile.cleanliness.replace(/_/g, " ")}
                </span>
              )}
              {profile.food_habits && (
                <span className="rounded-full bg-green-soft px-2.5 py-1 text-caption font-medium text-green-ink">
                  {profile.food_habits.replace(/_/g, " ")}
                </span>
              )}
              {profile.work_style && (
                <span className="rounded-full bg-teal-soft px-2.5 py-1 text-caption font-medium text-teal-ink">
                  {profile.work_style.replace(/_/g, " ")}
                </span>
              )}
            </div>
          )}

          <Button
            size="compact"
            className="mt-1 rounded-full px-5"
            onClick={() => navigate("/profile/edit")}
            leadingIcon={<Pencil aria-hidden="true" className="h-4 w-4" />}
          >
            Edit profile
          </Button>

          {!profile.onboarding_completed && (
            <div className="mt-2 flex w-full flex-col items-center justify-between gap-4 rounded-2xl border border-accent/15 bg-accent-soft/40 p-4 text-center sm:flex-row sm:p-5 sm:text-left">
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <ProgressRing size="lg" value={onboardingProgress} label="Profile completion" />
                <div>
                  <h3 className="text-body-md font-semibold text-ink">Complete your profile</h3>
                  <p className="mt-0.5 text-caption text-ink-3">
                    {Math.round(onboardingProgress)}% done — finish to get better matches.
                  </p>
                </div>
              </div>
              <Button
                size="compact"
                variant="primary"
                onClick={() => navigate("/onboarding")}
                className="w-full shrink-0 rounded-full sm:w-auto"
              >
                Continue
              </Button>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
