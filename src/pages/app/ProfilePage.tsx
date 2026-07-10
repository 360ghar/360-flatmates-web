import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  Heart,
  Pencil,
  Shield,
  UserX,
  LogOut,
  Trash2,
  AlertTriangle,
  Users,
  Smartphone,
  Check,
  ImageOff,
  Loader2,
} from "lucide-react";
import { useMyProfile, useUpdateProfile, useDeleteAccount } from "@/hooks/queries";
import type { FlatmatesProfileUpdate } from "@/lib/api/types";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { useAuth } from "@/hooks/useAuth";
import { uiStore } from "@/lib/stores/ui-store";
import { MenuItemRow } from "@/components/molecules";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { usePWA } from "@/hooks/usePWA";
import { PWAInstallInstructionsModal } from "@/components/organisms/PWAInstallInstructionsModal";

export function ProfilePage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile, isLoading, refetch } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();
  const { upload: uploadImage } = useAvatarUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showPWAInstructions, setShowPWAInstructions] = useState(false);
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
  const deleteEnabled = deleteConfirmText.trim().toUpperCase() === "DELETE";
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA();

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/login");
    } catch {
      uiStore.getState().pushToast({
        type: "error",
        title: "Sign out failed",
        description: "Please try again.",
      });
    } finally {
      setSigningOut(false);
      setShowSignOutDialog(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount.mutateAsync();
      // The backend hard-deletes the Supabase user, so the local sign-out is
      // best-effort: don't fail the flow if the session is already gone.
      try {
        await signOut();
      } catch {
        /* user already removed from Supabase */
      }
      uiStore.getState().pushToast({
        type: "success",
        title: "Your account has been deleted",
      });
      navigate("/login");
      return;
    } catch {
      // The mutation may have failed only because the network dropped after the
      // server hard-deleted the user. The account is gone either way — drive
      // the user to the login screen and let them recover from there instead of
      // leaving them on a dead profile page with a misleading error.
      uiStore.getState().pushToast({
        type: "info",
        title: "Your account has been deleted",
        description:
          "If the request did not reach the server, contact support at support@360ghar.com.",
      });
      try {
        await signOut();
      } catch {
        /* user already removed from Supabase */
      }
      navigate("/login");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmText("");
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 p-4 md:p-6 max-w-2xl mx-auto">
        {/* Profile header card: avatar + name + profession + badges */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface p-6 shadow-sm text-center w-full">
          <Skeleton className="h-[120px] w-[120px] rounded-xl" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        {/* Menu section groups */}
        <div className="flex flex-col gap-5 w-full">
          {/* Profile section */}
          <div className="rounded-2xl border border-line bg-surface p-0 shadow-sm divide-y divide-line">
            <Skeleton variant="menuItemRow" />
          </div>
          {/* Activity section */}
          <Skeleton className="h-3 w-14" />
          <div className="rounded-2xl border border-line bg-surface p-0 shadow-sm divide-y divide-line">
            <Skeleton variant="menuItemRow" count={2} />
          </div>
          {/* Preferences section */}
          <Skeleton className="h-3 w-20" />
          <div className="rounded-2xl border border-line bg-surface p-0 shadow-sm divide-y divide-line">
            <Skeleton variant="menuItemRow" />
          </div>
          {/* Theme card with toggle placeholder */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-14 rounded-full" />
          </div>
          {/* Privacy & Safety section */}
          <Skeleton className="h-3 w-24" />
          <div className="rounded-2xl border border-line bg-surface p-0 shadow-sm divide-y divide-line">
            <Skeleton variant="menuItemRow" count={2} />
          </div>
          {/* Account section with sign out / delete */}
          <Skeleton className="h-3 w-16" />
          <div className="rounded-2xl border border-line bg-surface p-0 shadow-sm divide-y divide-line">
            <Skeleton variant="menuItemRow" count={2} />
          </div>
        </div>
      </div>
    );
  }

  const hasProfile = !!profile;
  const onboardingProgress = hasProfile
    ? profile.onboarding_completed
      ? 100
      : ((profile.onboarding_current_step ?? 0) / 8) * 100
    : 0;

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
    <div className="flex flex-col gap-5 page-fade max-w-2xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header card: profile-dependent */}
      {hasProfile ? (
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
      ) : (
        <Card className="flex flex-col items-center gap-3 p-6 text-center">
          <ErrorState
            title="Could not load profile"
            description="Please try again."
            onRetry={() => refetch()}
          />
        </Card>
      )}

      {/* Activity section: profile-dependent */}
      {hasProfile && (
        <section>
          <h2 className="mb-2 px-1 text-label-md font-semibold uppercase tracking-wide text-ink-3">
            Activity
          </h2>
          <Card variant="media" className="divide-y divide-line border-line shadow-sm">
            <MenuItemRow
              icon={Heart}
              label="Likes"
              description="People who liked you"
              onClick={() => navigate("/likes")}
            />
            <MenuItemRow
              icon={Users}
              label="Matches"
              description="People you matched with"
              onClick={() => navigate("/likes")}
              isLast
            />
          </Card>
        </section>
      )}

      {/* Preferences: always visible */}
      <section>
      <h2 className="mb-2 px-1 text-label-md font-semibold uppercase tracking-wide text-ink-3">
        Preferences
      </h2>
      <Card variant="media" className="divide-y divide-line border-line shadow-sm">
        <MenuItemRow
          icon={Bell}
          label="Notifications"
          description="Push, email, and quiet hours"
          onClick={() => navigate("/settings/notifications")}
        />
        {isInstalled ? (
          <MenuItemRow
            icon={Smartphone}
            label="App Status"
            description="Installed on your device"
            disabled
            trailing={
              <span className="text-caption font-semibold text-success flex items-center gap-1 pr-1">
                <Check className="h-3.5 w-3.5" /> Installed
              </span>
            }
          />
        ) : isIOS ? (
          <MenuItemRow
            icon={Smartphone}
            label="Install App"
            description="How to install on your iOS device"
            onClick={() => setShowPWAInstructions(true)}
          />
        ) : isInstallable ? (
          <MenuItemRow
            icon={Smartphone}
            label="Install App"
            description="Install 360 Flatmates on your device"
            onClick={installApp}
          />
        ) : null}
      </Card>

      </section>

      <Card className="flex items-center justify-between gap-4 border-line p-5 shadow-sm">
        <div>
          <h2 className="text-h3">Theme</h2>
          <p className="mt-0.5 text-caption text-ink-3">Light, dark, or system</p>
        </div>
        <ThemeToggle size="md" />
      </Card>

      <section>
      <h2 className="mb-2 px-1 text-label-md font-semibold uppercase tracking-wide text-ink-3">
        Privacy & safety
      </h2>
      <Card variant="media" className="divide-y divide-line border-line shadow-sm">
        <MenuItemRow
          icon={Shield}
          label="Blocked Users"
          description="Manage who you have blocked"
          onClick={() => navigate("/settings/blocked-users")}
        />
        <MenuItemRow
          icon={UserX}
          label="Report a Problem"
          onClick={() => navigate("/settings/report-problem")}
        />
      </Card>
      </section>

      <section>
      <h2 className="mb-2 px-1 text-label-md font-semibold uppercase tracking-wide text-ink-3">
        Account
      </h2>
      <Card variant="media" className="divide-y divide-line border-line shadow-sm">
        <MenuItemRow
          icon={LogOut}
          label="Sign Out"
          tone="warning"
          onClick={() => setShowSignOutDialog(true)}
        />
        <MenuItemRow
          icon={Trash2}
          label="Delete Account"
          description="Permanently delete your account and data"
          tone="error"
          onClick={() => setShowDeleteDialog(true)}
        />
      </Card>
      </section>

      {/* Sign Out Confirmation */}
      <Modal
        open={showSignOutDialog}
        title="Sign Out"
        description="Are you sure you want to sign out? You will need to log in again to access your account."
        onClose={() => setShowSignOutDialog(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSignOutDialog(false)} className="w-full md:w-auto">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSignOut} loading={signingOut} className="w-full bg-error text-white hover:bg-error/95 md:w-auto">
              Sign Out
            </Button>
          </>
        }
      />

      {/* Delete Account Confirmation */}
      <Modal
        open={showDeleteDialog}
        title="Delete Account"
        onClose={() => {
          setShowDeleteDialog(false);
          setDeleteConfirmText("");
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmText("");
              }}
              className="w-full md:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteAccount}
              disabled={!deleteEnabled || deleting}
              loading={deleting}
              className="w-full bg-error text-white hover:bg-error/95 md:w-auto"
            >
              Delete Account
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-xl bg-error-soft p-4">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-error" />
            <div>
              <p className="text-body-md font-semibold text-error">This action is irreversible</p>
              <p className="mt-1 text-body-md text-ink-2">
                Deleting your account will permanently remove your profile, listings, conversations,
                and all associated data. This cannot be undone.
              </p>
            </div>
          </div>
          <Input
            label="Type DELETE to confirm"
            placeholder="DELETE"
            autoComplete="off"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />
        </div>
      </Modal>

      {/* PWA iOS Instructions Modal */}
      <PWAInstallInstructionsModal
        open={showPWAInstructions}
        onClose={() => setShowPWAInstructions(false)}
      />
    </div>
  );
}
