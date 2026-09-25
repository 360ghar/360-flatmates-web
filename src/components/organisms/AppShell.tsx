import { type ComponentType, type FormEvent, type HTMLAttributes, type ReactNode, type SVGProps, useCallback, useMemo, useRef, useState } from "react";
import {
  AlertsIcon,
  AppearanceIcon,
  ChatsIcon,
  DashboardIcon,
  ExploreIcon,
  HeartIcon,
  HomeIcon,
  MoreIcon,
  PostIcon,
  ProfileIcon,
  SavedIcon,
  SwipeIcon,
  VisitsIcon
} from "../paper/NavIcons";
import { useNavigate } from "react-router";
import { PrefetchLink } from "../ui/PrefetchLink";
import {
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";
import {
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_DEFAULT,
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_MIN
} from "@/lib/stores/ui-store";
import { Avatar } from "../ui/Avatar";
import { type UserMode } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Logo } from "../ui/Logo";
import { SearchBar } from "../ui/SearchBar";
import { ThemeToggle } from "../ui/ThemeToggle";
import { cn, focusRing, interactiveMotion } from "../ui/component-utils";
import { useNotifications } from "@/hooks/queries";
import { BottomSheet } from "../ui/Modal";
import { useSidebarResize } from "./useSidebarResize";

export interface ShellUser {
  name: string;
  avatarUrl?: string | null;
  mode?: UserMode;
  city?: string;
}

export interface NavItemConfig {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  showFor: UserMode[];
  badge?: number;
  /** One-word label for the mobile tab bar; `label` stays the accessible name. */
  shortLabel?: string;
  /** If true, item only appears in the desktop sidebar — never in the mobile bottom nav */
  sidebarOnly?: boolean;
}

export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  mode: UserMode;
  activeHref?: string;
  title?: string;
  user?: ShellUser;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  sidebarWidth?: number;
  onSidebarWidthChange?: (width: number) => void;
  notificationCount?: number;
  topBarActions?: ReactNode;
  navItems?: NavItemConfig[];
}

const defaultNavItems: NavItemConfig[] = [
  /* ── Discovery ── */
  { label: "Home", href: "/home", icon: HomeIcon, showFor: ["room_poster", "co_hunter", "open_to_both"] },
  { label: "Explore", href: "/explore", icon: ExploreIcon, showFor: ["co_hunter", "open_to_both"] },
  { label: "Swipe", href: "/swipe", icon: SwipeIcon, showFor: ["room_poster", "co_hunter", "open_to_both"] },
  { label: "Saved Searches", href: "/saved-searches", icon: SavedIcon, showFor: ["room_poster", "co_hunter", "open_to_both"], sidebarOnly: true },
  /* ── Social ── */
  { label: "Likes & Matches", shortLabel: "Likes", href: "/likes", icon: HeartIcon, showFor: ["room_poster", "co_hunter", "open_to_both"] },
  { label: "Chats", href: "/chats", icon: ChatsIcon, showFor: ["room_poster", "co_hunter", "open_to_both"], sidebarOnly: true },
  /* ── Management ── */
  { label: "Post & Manage", shortLabel: "Post", href: "/manage", icon: PostIcon, showFor: ["room_poster", "open_to_both"] },
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon, showFor: ["room_poster", "open_to_both"], sidebarOnly: true },
  { label: "Visits", href: "/visits", icon: VisitsIcon, showFor: ["room_poster", "co_hunter", "open_to_both"], sidebarOnly: true },
  /* ── Alerts & Profile ── */
  { label: "Alerts", href: "/alerts", icon: AlertsIcon, showFor: ["room_poster", "co_hunter", "open_to_both"], sidebarOnly: true },
  { label: "Profile", href: "/profile", icon: ProfileIcon, showFor: ["room_poster", "co_hunter", "open_to_both"] },
];

const MORE_NAV_ITEM: NavItemConfig = {
  label: "More",
  href: "#more",
  icon: MoreIcon,
  showFor: ["room_poster", "co_hunter", "open_to_both"],
  sidebarOnly: false,
};

export function AppShell({
  children,
  mode,
  activeHref,
  title,
  user,
  collapsed = false,
  onCollapsedChange,
  sidebarWidth = SIDEBAR_WIDTH_DEFAULT,
  onSidebarWidthChange,
  notificationCount,
  topBarActions,
  navItems = defaultNavItems,
  className,
  ...props
}: AppShellProps) {
  // Derive unread notification count from live query data
  const { data: notifications } = useNotifications();
  const unreadCount = useMemo(
    () => notificationCount ?? (Array.isArray(notifications) ? notifications.filter((n) => !n.is_read).length : 0),
    [notificationCount, notifications]
  );

  const visibleItems = useMemo(
    () => navItems.filter((item) => item.showFor.includes(mode)),
    [navItems, mode]
  );
  const sidebarOnlyItems = useMemo(
    () => visibleItems.filter((item) => item.sidebarOnly),
    [visibleItems]
  );
  const [moreOpen, setMoreOpen] = useState(false);
  const mobileItems = useMemo(() => {
    const primary = visibleItems.filter((item) => !item.sidebarOnly);
    if (primary.length <= 5 && sidebarOnlyItems.length === 0) {
      return primary;
    }
    // Surface a "More" affordance so sidebar-only destinations (Chats,
    // Dashboard, Visits, Alerts, SavedSearches, Matches) and any overflow
    // primary items are reachable on mobile.
    return [...primary.slice(0, 4), MORE_NAV_ITEM];
  }, [visibleItems, sidebarOnlyItems]);
  const {
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleKeyDown,
    handleDoubleClick,
  } = useSidebarResize(collapsed, sidebarWidth, onSidebarWidthChange);
  const asideRef = useRef<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Close the "More" sheet on route change so the next page isn't covered.
  // Adjusting state during render (vs. setState-in-effect) is React's
  // recommended pattern for resetting state in response to a changed value.
  const [moreSheetRoute, setMoreSheetRoute] = useState(activeHref ?? "");
  if ((activeHref ?? "") !== moreSheetRoute) {
    setMoreSheetRoute(activeHref ?? "");
    if (moreOpen) setMoreOpen(false);
  }

  const handleSearchSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = searchQuery.trim();
      if (trimmed) {
        navigate(`/search?q=${encodeURIComponent(trimmed)}`);
        setSearchQuery("");
      }
    },
    [searchQuery, navigate]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
    []
  );

  const handleSearchClear = useCallback(() => setSearchQuery(""), []);

  const currentWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : sidebarWidth;

  const isActive = useCallback(
    (href: string) => {
      if (!activeHref) return false;
      if (href === "/home") return activeHref === "/home" || activeHref === "/";
      return activeHref === href || activeHref.startsWith(href + "/");
    },
    [activeHref]
  );

  return (
    <div className={cn("min-h-dvh bg-paper text-ink", className)} {...props}>
      <aside
        ref={asideRef}
        className={cn(
          "paper-grain fixed inset-y-0 left-0 z-[var(--z-sticky)] hidden bg-paper-1 p-3 shadow-[1px_0_0_var(--color-edge)] md:flex md:flex-col",
          !isDragging && "transition-[width] duration-200 ease-out"
        )}
        style={{ width: currentWidth }}
      >
        <div className={cn("flex h-14 items-center", collapsed ? "justify-center" : "justify-center px-2")}>
          <Logo compact={collapsed} iconOnly={collapsed} stacked={!collapsed} />
        </div>
        <nav aria-label="Primary" className="mt-5 flex flex-1 flex-col gap-1">
          {visibleItems.map((item) => (
            <ShellNavLink collapsed={collapsed} item={item} active={isActive(item.href)} key={item.href} />
          ))}
        </nav>
        {user ? (
          <PrefetchLink
            to="/profile"
            className={cn(
              "mb-3 flex items-center gap-3 rounded-cut-md p-2 hover:bg-surface-soft",
              focusRing,
              collapsed && "justify-center"
            )}
          >
            <Avatar name={user.name} size="sm" src={user.avatarUrl} />
            {!collapsed ? (
              <div className="min-w-0">
                <span className="block truncate text-body-md font-semibold text-ink">Hi, {(user.name?.trim().split(/\s+/)[0] || "there")}!</span>
                {user.city ? (
                  <span className="block truncate text-caption text-ink-2">{user.city}</span>
                ) : null}
              </div>
            ) : null}
          </PrefetchLink>
        ) : null}
        <Button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          size="icon"
          variant="icon"
          onClick={() => onCollapsedChange?.(!collapsed)}
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden="true" className="h-5 w-5" />
          ) : (
            <PanelLeftClose aria-hidden="true" className="h-5 w-5" />
          )}
        </Button>
        {/* Resize handle */}
        {!collapsed ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            aria-valuenow={sidebarWidth}
            aria-valuemin={SIDEBAR_WIDTH_MIN}
            aria-valuemax={SIDEBAR_WIDTH_MAX}
            tabIndex={0}
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize touch-pan-y hover:bg-accent/20 active:bg-accent/30 focus:bg-accent/25 focus:outline-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onKeyDown={handleKeyDown}
            onDoubleClick={handleDoubleClick}
          />
        ) : null}
      </aside>
      <div
        className={cn("min-h-dvh pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-0 md:pl-[var(--sidebar-w)]", !isDragging && "transition-[padding-left] duration-200 ease-out")}
        style={{ '--sidebar-w': `${currentWidth}px` } as React.CSSProperties}
      >
        <header className="paper-grain sticky top-0 z-[var(--z-raised)] flex min-h-16 items-center gap-3 bg-paper-1 px-5 pt-[env(safe-area-inset-top)] shadow-[0_1px_0_var(--color-edge)] md:px-6">
          {/* Mobile: greeting with avatar. The desktop sidebar already shows
              the greeting on the left, so the topbar only renders the mobile
              variant. Previously a duplicate desktop greeting lived here too,
              which produced "Hi, Saksham! Gurgaon" twice on tablet/desktop. */}
          {user ? (
            <PrefetchLink to="/profile" className={cn("flex items-center gap-3 md:hidden", focusRing)}>
              <Avatar name={user.name} size="sm" src={user.avatarUrl} />
              <div className="min-w-0">
                <p className="truncate text-h3 text-ink">Hi, {(user.name?.trim().split(/\s+/)[0] || "there")}!</p>
                {user.city ? <p className="truncate text-caption text-ink-2">{user.city}</p> : null}
              </div>
            </PrefetchLink>
          ) : (
            <div className="md:hidden">
              <Logo compact />
            </div>
          )}
          {title ? <h1 className="hidden min-w-0 truncate text-h3 text-ink md:block">{title}</h1> : null}
          <form
            onSubmit={handleSearchSubmit}
            className="ml-auto hidden w-full max-w-[16rem] lg:max-w-md md:block"
            role="search"
          >
            <SearchBar
              placeholder="Search listings"
              aria-label="Search listings"
              value={searchQuery}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
            />
          </form>
          {topBarActions}
          <ThemeToggle size="sm" className="max-md:hidden" />
          <PrefetchLink
            to="/search"
            aria-label="Search"
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-cut-md text-ink-2 hover:bg-surface-soft hover:text-ink md:hidden",
              focusRing
            )}
          >
            <Search aria-hidden="true" className="h-5 w-5" />
          </PrefetchLink>
          <PrefetchLink to="/notifications" aria-label="Notifications" className={cn("flex h-11 w-11 items-center justify-center rounded-cut-md text-ink-2 hover:bg-surface-soft hover:text-ink", focusRing)}>
            <span className="relative">
              <Bell aria-hidden="true" className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-clay">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </span>
          </PrefetchLink>
        </header>
        <main id="main" className="min-h-[calc(100dvh-64px)] px-5 py-6 md:px-6">{children}</main>
      </div>
      <nav
        aria-label="Mobile primary"
        className="paper-grain paper-edge-torn-top fixed inset-x-0 bottom-0 z-[var(--z-sticky)] grid h-[calc(80px+env(safe-area-inset-bottom))] grid-cols-5 gap-1 bg-paper-1 px-2 pt-[calc(var(--torn-depth)+4px)] pb-[calc(6px+env(safe-area-inset-bottom))] md:hidden"
      >
        {mobileItems.map((item) => {
          if (item.href === "#more") {
            return (
              <button
                key="more"
                type="button"
                onClick={() => setMoreOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={moreOpen}
                className={cn(
                  "flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-cut-md px-1 py-1 text-ink-2 hover:text-ink",
                  interactiveMotion,
                  focusRing,
                  moreOpen && "bg-surface text-accent shadow-sm"
                )}
              >
                <item.icon aria-hidden="true" className="h-5 w-5" />
                <span className="truncate text-[12px] font-semibold">{item.label}</span>
              </button>
            );
          }
          return (
            <ShellNavLink collapsed={false} mobile item={item} active={isActive(item.href)} key={item.href} />
          );
        })}
      </nav>
      <BottomSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="More"
        width="wide"
      >
        <div className="flex flex-col gap-1">
          {[...visibleItems.filter((i) => !i.sidebarOnly && i.href !== "#more").slice(4), ...sidebarOnlyItems].map((item) => (
            <PrefetchLink
              key={item.href}
              to={item.href}
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex min-h-[44px] items-center gap-3 rounded-cut-md px-3 py-2.5 text-body-md text-ink-2 hover:bg-surface-soft hover:text-ink",
                focusRing,
                isActive(item.href) && "bg-surface font-semibold text-accent shadow-sm"
              )}
            >
              <item.icon aria-hidden="true" className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </PrefetchLink>
          ))}
        </div>
        {/* Appearance control, parity with the public layout drawer. Without
            this, theme is unreachable on mobile in the authenticated shell
            (the top-bar toggle is md:flex only). */}
        <PrefetchLink
          to="/settings/appearance"
          onClick={() => setMoreOpen(false)}
          className={cn("mt-1 flex min-h-[44px] items-center gap-3 rounded-cut-md px-3 py-2.5 text-body-md text-ink-2 hover:bg-surface-soft hover:text-ink", focusRing)}
        >
          <AppearanceIcon aria-hidden="true" className="h-5 w-5" />
          <span className="truncate">Appearance</span>
        </PrefetchLink>
      </BottomSheet>
    </div>
  );
}

function ShellNavLink({
  item,
  active,
  collapsed,
  mobile = false
}: {
  item: NavItemConfig;
  active: boolean;
  collapsed: boolean;
  mobile?: boolean;
}) {
  const Icon = item.icon;

  return (
    <PrefetchLink
      to={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={mobile && item.shortLabel ? item.label : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        // Active tab rises one paper layer (DESIGN.md §8).
        "relative flex items-center gap-3 rounded-cut-md text-ink-2 hover:text-ink",
        interactiveMotion,
        focusRing,
        active ? "bg-surface text-accent shadow-sm" : "hover:bg-surface-soft",
        collapsed
          ? "h-11 justify-center px-0"
          : mobile
            ? "min-h-[44px] flex-col justify-center gap-0.5 px-1 py-1 text-[12px] font-semibold"
            : "h-11 px-3 text-body-md font-semibold"
      )}
    >
      <Icon aria-hidden="true" className={cn(mobile ? "h-5 w-5" : "h-5 w-5")} />
      {!collapsed ? <span className="truncate">{mobile ? (item.shortLabel ?? item.label) : item.label}</span> : null}
      {item.badge ? (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />
      ) : null}
    </PrefetchLink>
  );
}
