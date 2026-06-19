import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { useStore } from "zustand";
import { AppShell, type ShellUser } from "@/components/organisms/AppShell";
import type { UserMode } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useMyProfile } from "@/hooks/queries/useProfiles";
import { uiStore } from "@/lib/stores/ui-store";
import { PageSpinner } from "@/components/ui/Spinner";
import { PWAInstallBanner } from "@/components/molecules/PWAInstallBanner";
import { OfflineBanner } from "@/components/ui/Layout";

const ROUTE_TITLES: Record<string, string> = {
  "/home": "Home",
  "/search": "Search",
  "/search/semantic": "Semantic search",
  "/swipe": "Discover",
  "/likes": "Likes & chat",
  "/matches": "Matches",
  "/chats": "Messages",
  "/explore": "Explore",
  "/listing": "Listing",
  "/notifications": "Notifications",
  "/profile": "Profile",
  "/profile/edit": "Edit profile",
  "/settings": "Settings",
  "/settings/appearance": "Appearance",
  "/settings/notifications": "Notification settings",
  "/settings/blocked-users": "Blocked users",
  "/settings/report-problem": "Report a problem",
  "/post": "Post a listing",
  "/post/review": "Review listing",
  "/manage": "Manage listings",
  "/dashboard": "Dashboard",
  "/dashboard/analytics": "Analytics",
  "/visits": "Visits",
  "/compatibility": "Compatibility",
  "/my-listings": "My listing",
  "/choose-role": "Choose your role",
  "/location": "Location",
  "/onboarding": "Welcome",
  "/verify": "Verify phone",
  "/help": "Help",
  "/alerts": "Alerts",
  "/saved-searches": "Saved searches",
  "/payments": "Payment methods",
  "/payments/new": "Add payment method",
};

function titleForPath(pathname: string): string | undefined {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return undefined;
  for (const key of Object.keys(ROUTE_TITLES)) {
    if (segments[0] && key.startsWith(`/${segments[0]}`) && key !== `/${segments[0]}`) {
      return ROUTE_TITLES[key];
    }
  }
  return undefined;
}

export function AppLayout() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useMyProfile();
  const { pathname } = useLocation();
  const [offline, setOffline] = useState(false);

  const collapsed = useStore(uiStore, (s) => s.sidebar === "collapsed");
  const setSidebar = useStore(uiStore, (s) => s.setSidebar);
  const sidebarWidth = useStore(uiStore, (s) => s.sidebarWidth);
  const setSidebarWidth = useStore(uiStore, (s) => s.setSidebarWidth);

  const mode: UserMode = (profile?.mode as UserMode) ?? "open_to_both";

  const shellUser: ShellUser | undefined = profile
    ? { name: profile.full_name, avatarUrl: profile.profile_image_url, mode, city: profile.city }
    : undefined;

  // Online/offline detection — surface a banner when the connection drops.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (authLoading) {
    return <PageSpinner />;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <OfflineBanner visible={offline} />
      <AppShell
        mode={mode}
        activeHref={pathname}
        title={titleForPath(pathname)}
        user={shellUser}
        collapsed={collapsed}
        onCollapsedChange={(c) => setSidebar(c ? "collapsed" : "expanded")}
        sidebarWidth={sidebarWidth}
        onSidebarWidthChange={setSidebarWidth}
      >
        <PWAInstallBanner className="mb-5" />
        <Outlet />
      </AppShell>
    </>
  );
}
