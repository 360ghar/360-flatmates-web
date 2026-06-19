import { type FormEvent, type HTMLAttributes, type KeyboardEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { PrefetchLink } from "../ui/PrefetchLink";
import {
  BarChart3,
  Bell,
  Bookmark,
  Calendar,
  Heart,
  Home,
  LayoutGrid,
  Map,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Shuffle,
  Sparkles,
  User,
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
import { cn, focusRing } from "../ui/component-utils";
import { useNotifications } from "@/hooks/queries";
import { BottomSheet } from "../ui/Modal";

export interface ShellUser {
  name: string;
  avatarUrl?: string | null;
  mode?: UserMode;
  city?: string;
}

export interface NavItemConfig {
  label: string;
  href: string;
  icon: LucideIcon;
  showFor: UserMode[];
  badge?: number;
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
  { label: "Home", href: "/home", icon: Home, showFor: ["room_poster", "co_hunter", "open_to_both"] },
  { label: "Explore", href: "/explore", icon: Map, showFor: ["co_hunter", "open_to_both"] },
  { label: "Swipe", href: "/swipe", icon: Shuffle, showFor: ["room_poster", "co_hunter", "open_to_both"] },
  { label: "Saved Searches", href: "/saved-searches", icon: Bookmark, showFor: ["room_poster", "co_hunter", "open_to_both"], sidebarOnly: true },
  /* ── Social ── */
  { label: "Likes & Matches", href: "/likes", icon: Heart, showFor: ["room_poster", "co_hunter", "open_to_both"] },
  { label: "Chats", href: "/chats", icon: MessageCircle, showFor: ["room_poster", "co_hunter", "open_to_both"], sidebarOnly: true },
  /* ── Management ── */
  { label: "Post & Manage", href: "/manage", icon: Plus, showFor: ["room_poster", "open_to_both"] },
  { label: "Dashboard", href: "/dashboard", icon: BarChart3, showFor: ["room_poster", "open_to_both"], sidebarOnly: true },
  { label: "Visits", href: "/visits", icon: Calendar, showFor: ["room_poster", "co_hunter", "open_to_both"], sidebarOnly: true },
  /* ── Alerts & Profile ── */
  { label: "Alerts", href: "/alerts", icon: Sparkles, showFor: ["room_poster", "co_hunter", "open_to_both"], sidebarOnly: true },
  { label: "Profile", href: "/profile", icon: User, showFor: ["room_poster", "co_hunter", "open_to_both"] },
];

const MORE_NAV_ITEM: NavItemConfig = {
  label: "More",
  href: "#more",
  icon: LayoutGrid,
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
    () => notificationCount ?? (notifications?.filter((n) => !n.is_read).length ?? 0),
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
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number; pointerId: number } | null>(null);
  const asideRef = useRef<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Close the "More" sheet on route change so the next page isn't covered.
  useEffect(() => {
    if (moreOpen) setMoreOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHref ?? ""]);

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

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (collapsed) return;
      e.preventDefault();
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      dragRef.current = { startX: e.clientX, startWidth: sidebarWidth, pointerId: e.pointerId };
      setIsDragging(true);
    },
    [collapsed, sidebarWidth]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const delta = e.clientX - dragRef.current.startX;
      const next = Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, dragRef.current.startWidth + delta));
      onSidebarWidthChange?.(next);
    },
    [onSidebarWidthChange]
  );

  const handlePointerUp = useCallback(
    (e?: React.PointerEvent) => {
      const drag = dragRef.current;
      if (drag && e && (e.currentTarget as HTMLElement).hasPointerCapture?.(drag.pointerId)) {
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(drag.pointerId);
        } catch {
          // capture may already be released on cancel; ignore
        }
      }
      dragRef.current = null;
      setIsDragging(false);
    },
    []
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => handlePointerUp(e),
    [handlePointerUp]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (collapsed) return;
      const step = e.shiftKey ? 32 : 8;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onSidebarWidthChange?.(Math.min(SIDEBAR_WIDTH_MAX, sidebarWidth + step));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onSidebarWidthChange?.(Math.max(SIDEBAR_WIDTH_MIN, sidebarWidth - step));
      } else if (e.key === "Home") {
        e.preventDefault();
        onSidebarWidthChange?.(SIDEBAR_WIDTH_MIN);
      } else if (e.key === "End") {
        e.preventDefault();
        onSidebarWidthChange?.(SIDEBAR_WIDTH_MAX);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSidebarWidthChange?.(SIDEBAR_WIDTH_DEFAULT);
      }
    },
    [collapsed, onSidebarWidthChange, sidebarWidth]
  );

  const handleDoubleClick = useCallback(() => {
    if (collapsed) return;
    onSidebarWidthChange?.(SIDEBAR_WIDTH_DEFAULT);
  }, [collapsed, onSidebarWidthChange]);

  useEffect(() => {
    if (!isDragging) return;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const cancelDrag = () => {
      dragRef.current = null;
      setIsDragging(false);
    };
    const handleVisibilityChange = () => {
      if (document.hidden) cancelDrag();
    };
    window.addEventListener("blur", cancelDrag);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("blur", cancelDrag);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isDragging]);

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
          "fixed inset-y-0 left-0 z-30 hidden border-r border-line bg-paper-2 p-3 md:flex md:flex-col",
          !isDragging && "transition-[width] duration-200 ease-out"
        )}
        style={{ width: currentWidth }}
      >
        <div className={cn("flex h-14 items-center", collapsed ? "justify-center" : "justify-center px-2")}>
          <Logo compact={collapsed} stacked={!collapsed} />
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
              "mb-3 flex items-center gap-3 rounded-[9px] p-2 hover:bg-paper-3",
              focusRing,
              collapsed && "justify-center"
            )}
          >
            <Avatar name={user.name} size="sm" src={user.avatarUrl} />
            {!collapsed ? (
              <div className="min-w-0">
                <span className="block truncate text-body-md font-semibold text-ink">Hi, {user.name.split(" ")[0]}!</span>
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
        className={cn("min-h-dvh pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0 md:pl-[var(--sidebar-w)]", !isDragging && "transition-[padding-left] duration-200 ease-out")}
        style={{ '--sidebar-w': `${currentWidth}px` } as React.CSSProperties}
      >
        <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-line bg-paper px-5 pt-[env(safe-area-inset-top)] md:px-6">
          {/* Mobile: greeting with avatar. The desktop sidebar already shows
              the greeting on the left, so the topbar only renders the mobile
              variant. Previously a duplicate desktop greeting lived here too,
              which produced "Hi, Saksham! Gurgaon" twice on tablet/desktop. */}
          {user ? (
            <PrefetchLink to="/profile" className={cn("flex items-center gap-3 md:hidden", focusRing)}>
              <Avatar name={user.name} size="sm" src={user.avatarUrl} />
              <div className="min-w-0">
                <p className="truncate text-h3 font-semibold text-ink">Hi, {user.name.split(" ")[0]}!</p>
                {user.city ? <p className="truncate text-caption text-ink-2">{user.city}</p> : null}
              </div>
            </PrefetchLink>
          ) : (
            <div className="md:hidden">
              <Logo compact />
            </div>
          )}
          {title ? <h1 className="hidden min-w-0 truncate text-h3 font-semibold text-ink md:block">{title}</h1> : null}
          <form
            onSubmit={handleSearchSubmit}
            className="ml-auto hidden w-full max-w-md md:block"
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
          <ThemeToggle size="sm" className="hidden md:flex" />
          <PrefetchLink
            to="/search"
            aria-label="Search"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-[9px] text-ink-3 hover:bg-paper-3 hover:text-ink md:hidden",
              focusRing
            )}
          >
            <Search aria-hidden="true" className="h-5 w-5" />
          </PrefetchLink>
          <PrefetchLink to="/notifications" aria-label="Notifications" className={cn("flex h-10 w-10 items-center justify-center rounded-[9px] text-ink-3 hover:bg-paper-3 hover:text-ink", focusRing)}>
            <span className="relative">
              <Bell aria-hidden="true" className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
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
        className="fixed inset-x-0 bottom-0 z-30 grid h-[calc(76px+env(safe-area-inset-bottom))] grid-cols-5 border-t border-line bg-paper/88 px-2 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] backdrop-blur-[9px] md:hidden"
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
                  "flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-[9px] px-1 py-1 text-ink-3 hover:bg-paper-3 hover:text-ink",
                  focusRing,
                  moreOpen && "bg-accent-soft text-accent"
                )}
              >
                <item.icon aria-hidden="true" className="h-5 w-5" />
                <span className="truncate text-[12px]">{item.label}</span>
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
                "flex min-h-[44px] items-center gap-3 rounded-[9px] px-3 py-2.5 text-body-md text-ink-2 hover:bg-paper-2 hover:text-ink",
                focusRing,
                isActive(item.href) && "bg-accent-soft text-accent"
              )}
            >
              <item.icon aria-hidden="true" className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </PrefetchLink>
          ))}
        </div>
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
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-[9px] text-ink-3 hover:bg-paper-3 hover:text-ink",
        focusRing,
        active && "bg-accent-soft text-accent",
        collapsed
          ? "h-10 justify-center px-0"
          : mobile
            ? "min-h-[44px] flex-col justify-center gap-1 px-1 py-1 text-[12px]"
            : "h-10 px-3 text-body-md font-semibold"
      )}
    >
      <Icon aria-hidden="true" className={cn(mobile ? "h-5 w-5" : "h-5 w-5")} />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
      {item.badge ? (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />
      ) : null}
    </PrefetchLink>
  );
}
