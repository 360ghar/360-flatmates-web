import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  Heart,
  Shield,
  UserX,
  LogOut,
  Trash2,
  Users,
  Smartphone,
  Check,
  Palette,
  Repeat,
  MapPin,
  HelpCircle,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { useMyProfile, useDeleteAccount } from "@/hooks/queries/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { uiStore } from "@/lib/stores/ui-store";
import { MenuItemRow } from "@/components/ui/MenuItemRow";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Page } from "@/components/ui/Layout";
import { ProfilePageSkeleton } from "@/features/profile/components/ProfilePageSkeleton";
import { InlineError } from "@/components/ui/StateViews";
import { usePWA } from "@/features/pwa/hooks/usePWA";
import { PWAInstallInstructionsModal } from "@/features/pwa/components/PWAInstallInstructionsModal";
import { ProfileHeaderCard } from "@/features/profile/components/ProfileHeaderCard";

export function ProfilePage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const isAdmin = user?.app_metadata?.role === "admin";
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
      <Page width="narrow">
        <ProfilePageSkeleton />
      </Page>
    );
  }

  return (
    <Page width="narrow">
      {profile ? (
        <ProfileHeaderCard profile={profile} />
      ) : (
        <InlineError title="Could not load your profile" onRetry={() => refetch()} />
      )}

      {profile ? (
        <MenuSection title="Activity">
          <MenuItemRow icon={Heart} label="Likes" description="People who liked you" onClick={() => navigate("/likes")} />
          <MenuItemRow icon={Users} label="Matches" description="People you matched with" onClick={() => navigate("/matches")} />
        </MenuSection>
      ) : null}

      <MenuSection title="Preferences">
        <MenuItemRow
          icon={Bell}
          label="Notifications"
          description="Push, email and quiet hours"
          onClick={() => navigate("/settings/notifications")}
        />
        <MenuItemRow
          icon={Palette}
          label="Appearance"
          description="Light, dark or match your device"
          onClick={() => navigate("/settings/appearance")}
        />
        <MenuItemRow
          icon={Repeat}
          label="How you use 360"
          description="Find a room, fill a room, or both"
          onClick={() => navigate("/choose-role")}
        />
        <MenuItemRow
          icon={MapPin}
          label="Your location"
          description="The city and area we search around"
          onClick={() => navigate("/location")}
        />
        {isInstalled ? (
          <MenuItemRow
            icon={Smartphone}
            label="App"
            description="Installed on this device"
            disabled
            trailing={<Check aria-label="Installed" className="h-5 w-5 shrink-0 text-success" />}
          />
        ) : isIOS ? (
          <MenuItemRow
            icon={Smartphone}
            label="Install the app"
            description="How to add 360 Flatmates to your home screen"
            onClick={() => setShowPWAInstructions(true)}
          />
        ) : isInstallable ? (
          <MenuItemRow
            icon={Smartphone}
            label="Install the app"
            description="Add 360 Flatmates to this device"
            onClick={installApp}
          />
        ) : null}
      </MenuSection>

      <MenuSection title="Privacy and safety">
        <MenuItemRow
          icon={Shield}
          label="Blocked people"
          description="Manage who you have blocked"
          onClick={() => navigate("/settings/blocked-users")}
        />
        <MenuItemRow icon={UserX} label="Report a problem" onClick={() => navigate("/settings/report-problem")} />
        <MenuItemRow
          icon={HelpCircle}
          label="Help"
          description="Answers about matching, visits and safety"
          onClick={() => navigate("/help")}
        />
      </MenuSection>

      <MenuSection title="Account">
        <MenuItemRow
          icon={CreditCard}
          label="Payment methods"
          description="Cards and UPI for boosts"
          onClick={() => navigate("/payments")}
        />
        {isAdmin ? (
          <MenuItemRow
            icon={ShieldCheck}
            label="Moderation"
            description="Review listings, reports and the blog"
            onClick={() => navigate("/admin")}
          />
        ) : null}
        <MenuItemRow icon={LogOut} label="Sign out" tone="warning" onClick={() => setShowSignOutDialog(true)} />
        <MenuItemRow
          icon={Trash2}
          label="Delete account"
          description="Remove your account and all your data"
          tone="error"
          onClick={() => setShowDeleteDialog(true)}
        />
      </MenuSection>

      <ConfirmModal
        open={showSignOutDialog}
        title="Sign out?"
        description="You need to sign in again to see your matches and chats."
        confirmLabel="Sign out"
        destructive
        loading={signingOut}
        onConfirm={handleSignOut}
        onClose={() => setShowSignOutDialog(false)}
      />

      <ConfirmModal
        open={showDeleteDialog}
        title="Delete your account?"
        description="This removes your profile, listings, chats and all other data. You cannot undo it."
        confirmLabel="Delete account"
        destructive
        loading={deleting}
        confirmDisabled={!deleteEnabled}
        onConfirm={handleDeleteAccount}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeleteConfirmText("");
        }}
      >
        <Input
          label="Type DELETE to confirm"
          placeholder="DELETE"
          autoComplete="off"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
        />
      </ConfirmModal>

      <PWAInstallInstructionsModal open={showPWAInstructions} onClose={() => setShowPWAInstructions(false)} />
    </Page>
  );
}

/** A titled group of menu rows on one paper card. */
function MenuSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-h3 text-ink">{title}</h2>
      <Card variant="media" className="flex flex-col p-1">
        {children}
      </Card>
    </section>
  );
}
