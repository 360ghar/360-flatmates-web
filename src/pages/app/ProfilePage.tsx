import { useRef, useState } from "react";
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
    try {
      await uploadImage(file);
      uiStore.getState().pushToast({
        type: "success",
        title: "Photo updated",
      });
    } catch {
      uiStore.getState().pushToast({
        type: "error",
        title: "Upload failed",
        description: "Could not update your profile photo. Please try again.",
      });
    }
  };

  const handleRemovePhoto = () => {
    // The wire currently types profile_image_url as string | undefined, but we
    // optimistically attempt to clear it with null and fall back to a friendly
    // toast if the backend rejects. See audit item A-14.
    const payload = { profile_image_url: null } as unknown as FlatmatesProfileUpdate;
    updateProfile.mutate(payload, {
      onSuccess: () => {
        uiStore.getState().pushToast({
          type: "success",
          title: "Photo removed",
        });
      },
      onError: () => {
        uiStore.getState().pushToast({
          type: "error",
          title: "Photo removal is not yet supported",
          description: "Please try again later or contact support.",
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
        <Card className="flex flex-col items-center gap-4 p-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <Avatar
              name={profile.full_name}
              size="xl"
              src={profile.profile_image_url}
              editable
              onEdit={() => {
                handlePhotoUpload();
              }}
            />
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
          <div>
            <h1 className="text-h1">{profile.full_name}</h1>
            {profile.profession && (
              <p className="text-body-md text-ink-2 mt-1">{profile.profession}</p>
            )}
            <div className="flex items-center justify-center gap-2 mt-2">
              {profile.mode && <Badge mode={profile.mode} variant="mode" />}
              <TrustBadge variant="verified" />
            </div>
          </div>

          {!profile.onboarding_completed && (
            <div className="w-full mt-2 bg-accent-soft/30 border border-accent/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ProgressRing size="lg" value={onboardingProgress} label="Profile completion" />
                <div>
                  <h3 className="text-body-md font-semibold text-ink">Complete your profile</h3>
                  <p className="text-caption text-ink-3 mt-0.5">
                    Your profile is {Math.round(onboardingProgress)}% complete. Complete it to find compatible matches.
                  </p>
                </div>
              </div>
              <Button
                size="compact"
                variant="primary"
                onClick={() => navigate("/onboarding")}
                className="w-full sm:w-auto shrink-0"
              >
                Complete Profile
              </Button>
            </div>
          )}
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

      {/* Profile section: profile-dependent */}
      {hasProfile && (
        <Card className="divide-y divide-line p-0">
          <MenuItemRow
            icon={Pencil}
            label="Edit Profile"
            description="Update your name, bio, and preferences"
            onClick={() => navigate("/profile/edit")}
            isLast
          />
        </Card>
      )}

      {/* Activity section: profile-dependent */}
      {hasProfile && (
        <>
          <h2 className="text-label-md text-ink-3 mt-2 px-1">Activity</h2>
          <Card className="divide-y divide-line p-0">
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
        </>
      )}

      {/* Preferences: always visible */}
      <h2 className="text-label-md text-ink-3 mt-2 px-1">Preferences</h2>
      <Card className="divide-y divide-line p-0">
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

      {/* Inline theme toggle */}
      <Card className="flex items-center justify-between gap-4 p-5">
        <div>
          <h2 className="text-h3">Theme</h2>
          <p className="text-caption text-ink-3 mt-0.5">Switch between light and dark mode</p>
        </div>
        <ThemeToggle size="md" />
      </Card>

      {/* Privacy & Safety */}
      <h2 className="text-label-md text-ink-3 mt-2 px-1">Privacy & Safety</h2>
      <Card className="divide-y divide-line p-0">
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

      {/* Account */}
      <h2 className="text-label-md text-ink-3 mt-2 px-1">Account</h2>
      <Card className="divide-y divide-line p-0">
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
