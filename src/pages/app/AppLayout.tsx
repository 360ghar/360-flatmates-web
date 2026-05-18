import { Outlet, useLocation } from "react-router";
import { useStore } from "zustand";
import { AppShell, type ShellUser } from "@/components/organisms/AppShell";
import type { UserMode } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useMyProfile } from "@/hooks/queries/useProfiles";
import { uiStore } from "@/lib/stores/ui-store";
import { PageSpinner } from "@/components/ui/Spinner";

export function AppLayout() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useMyProfile();
  const { pathname } = useLocation();

  const collapsed = useStore(uiStore, (s) => s.sidebar === "collapsed");
  const setSidebar = useStore(uiStore, (s) => s.setSidebar);
  const sidebarWidth = useStore(uiStore, (s) => s.sidebarWidth);
  const setSidebarWidth = useStore(uiStore, (s) => s.setSidebarWidth);

  const mode: UserMode = (profile?.mode as UserMode) ?? "open_to_both";

  const shellUser: ShellUser | undefined = profile
    ? { name: profile.full_name, avatarUrl: profile.profile_image_url, mode, city: profile.city }
    : undefined;

  if (authLoading) {
    return <PageSpinner />;
  }

  if (!user) {
    return null;
  }

  return (
    <AppShell
      mode={mode}
      activeHref={pathname}
      user={shellUser}
      collapsed={collapsed}
      onCollapsedChange={(c) => setSidebar(c ? "collapsed" : "expanded")}
      sidebarWidth={sidebarWidth}
      onSidebarWidthChange={setSidebarWidth}
    >
      <Outlet />
    </AppShell>
  );
}
