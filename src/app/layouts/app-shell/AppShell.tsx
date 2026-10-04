import { useMemo, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { Tooltip } from "radix-ui";
import type { UserMode } from "@/components/ui/Badge";
import { cn } from "@/components/ui/component-utils";
import { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_DEFAULT } from "@/lib/stores/ui-store";
import { useNotifications, useUnreadNotificationCount } from "@/features/notifications/hooks/useNotifications";
import { MobileTabBar } from "./MobileTabBar";
import { NAV_ITEMS, type NavItemConfig, type ShellUser } from "./nav-config";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export type { NavItemConfig, ShellUser };

export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  mode: UserMode;
  /** The nav href to mark active (route handle navTab, else the path). */
  activeHref?: string;
  title?: string;
  /** Back target of a secondary page (route handle). */
  back?: string;
  user?: ShellUser;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  sidebarWidth?: number;
  onSidebarWidthChange?: (width: number) => void;
  /** Overrides the unread notification count read from the query cache. */
  notificationCount?: number;
  unreadMessageCount?: number;
  navItems?: NavItemConfig[];
}

/**
 * Signed-in chrome: sidebar (tablet rail, desktop list), top bar and the
 * phone tab strip. The page column's gutters live here.
 */
export function AppShell({
  children,
  mode,
  activeHref,
  title,
  back,
  user,
  collapsed = false,
  onCollapsedChange,
  sidebarWidth = SIDEBAR_WIDTH_DEFAULT,
  onSidebarWidthChange,
  notificationCount,
  unreadMessageCount = 0,
  navItems = NAV_ITEMS,
  className,
  style,
  ...props
}: AppShellProps) {
  const { data: notifications } = useNotifications();
  // Prefer the server unread total: the first page alone undercounts once
  // unread spans pages. Fall back to the first-page count while it loads.
  const { data: serverUnreadTotal } = useUnreadNotificationCount();
  const unreadNotifications =
    notificationCount ??
    serverUnreadTotal ??
    (Array.isArray(notifications) ? notifications.filter((n) => !n.is_read).length : 0);

  const items = useMemo(
    () =>
      navItems
        .filter((item) => item.showFor.includes(mode))
        .map((item) => (item.href === "/chats" && unreadMessageCount > 0 ? { ...item, badge: unreadMessageCount } : item)),
    [navItems, mode, unreadMessageCount]
  );

  return (
    <Tooltip.Provider delayDuration={250}>
      <div
        className={cn("min-h-dvh bg-paper text-ink", className)}
        style={{ "--sidebar-w": `${collapsed ? SIDEBAR_WIDTH_COLLAPSED : sidebarWidth}px`, ...style } as CSSProperties}
        {...props}
      >
        <Sidebar
          items={items}
          activeHref={activeHref}
          user={user}
          collapsed={collapsed}
          onCollapsedChange={onCollapsedChange}
          sidebarWidth={sidebarWidth}
          onSidebarWidthChange={onSidebarWidthChange}
        />
        <div className="min-h-dvh pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] md:pb-0 md:pl-[72px] lg:pl-[var(--sidebar-w)]">
          <TopBar user={user} title={title} back={back} unreadCount={unreadNotifications} />
          <main id="main" className="px-[var(--gutter)] py-6 md:py-8">
            {children}
          </main>
        </div>
        <MobileTabBar items={items} mode={mode} activeHref={activeHref} />
      </div>
    </Tooltip.Provider>
  );
}
