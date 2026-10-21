import { Outlet, useLocation } from "react-router";
import { useStore } from "zustand";
import { AppShell, type ShellUser } from "@/app/layouts/app-shell/AppShell";
import type { UserMode } from "@/components/ui/Badge";
import { OfflineBanner, PageChromeContext } from "@/components/ui/Layout";
import { PageSpinner } from "@/components/ui/Spinner";
import { useBootstrap } from "@/hooks/queries/useBootstrap";
import { useMyProfile } from "@/hooks/queries/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { useRouteHandle } from "@/hooks/useRouteHandle";
import { uiStore } from "@/lib/stores/ui-store";
import { PWAInstallBanner } from "@/features/pwa/components/PWAInstallBanner";

function normalizeUserMode(mode?: string | null): UserMode {
  if (mode === "room_poster" || mode === "co_hunter" || mode === "open_to_both") {
    return mode;
  }

  return "open_to_both";
}

export function AppLayout() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useMyProfile();
  const { data: bootstrap } = useBootstrap();
  const { pathname } = useLocation();
  const handle = useRouteHandle();

  const collapsed = useStore(uiStore, (s) => s.sidebar === "collapsed");
  const setSidebar = useStore(uiStore, (s) => s.setSidebar);
  const sidebarWidth = useStore(uiStore, (s) => s.sidebarWidth);
  const setSidebarWidth = useStore(uiStore, (s) => s.setSidebarWidth);

  const mode = normalizeUserMode(profile?.mode);

  const shellUser: ShellUser | undefined = profile
    ? { name: profile.full_name, avatarUrl: profile.profile_image_url, mode, city: profile.city }
    : undefined;

  if (authLoading || !user) {
    // A spinner, never a blank page, while the session is restored.
    return <PageSpinner />;
  }

  return (
    <>
      <OfflineBanner />
      <AppShell
        mode={mode}
        activeHref={handle.navTab ?? pathname}
        title={handle.title}
        back={handle.back}
        user={shellUser}
        unreadMessageCount={bootstrap?.unread_message_count ?? 0}
        collapsed={collapsed}
        onCollapsedChange={(c) => setSidebar(c ? "collapsed" : "expanded")}
        sidebarWidth={sidebarWidth}
        onSidebarWidthChange={setSidebarWidth}
      >
        <PageChromeContext.Provider value={{ back: handle.back, titleInTopBar: Boolean(handle.back), shell: true }}>
          <PWAInstallBanner className="mx-auto mb-5 max-w-[var(--page-max)]" />
          <Outlet />
        </PageChromeContext.Provider>
      </AppShell>
    </>
  );
}
