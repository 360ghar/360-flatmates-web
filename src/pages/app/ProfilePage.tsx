import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  Heart,
  Shield,
  UserX,
  LogOut,
  Trash2,
  AlertTriangle,
  Users,
  Smartphone,
  Check,
} from "lucide-react";
import { useMyProfile, useDeleteAccount } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { uiStore } from "@/lib/stores/ui-store";
import { MenuItemRow } from "@/components/molecules";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { usePWA } from "@/hooks/usePWA";
import { PWAInstallInstructionsModal } from "@/components/organisms/PWAInstallInstructionsModal";
import { ProfileHeaderCard } from "./ProfileHeaderCard";

export function ProfilePage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile, isLoading, refetch } = useMyProfile();
  const deleteAccount = useDeleteAccount();

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
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <Skeleton variant="profilePage" />
      </div>
    );
  }

  const hasProfile = !!profile;

  return (
    <div className="flex flex-col gap-5 page-fade max-w-2xl mx-auto">
      {/* Header card: profile-dependent */}
      {hasProfile ? (
        <ProfileHeaderCard profile={profile} />
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
