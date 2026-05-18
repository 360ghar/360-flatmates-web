import { type FormEvent, type HTMLAttributes, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { PrefetchLink } from "../ui/PrefetchLink";
import {
  BarChart3,
  Bell,
  Heart,
  Home,
  Map,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Shuffle,
  User
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
  /* ── Mobile bottom-nav items (first 5 per mode) ── */
  { label: "Home", href: "/home", icon: Home, showFor: ["room_poster", "co_hunter", "open_to_both"] },
  { label: "Post & Manage", href: "/manage", icon: Plus, showFor: ["room_poster"] },
  { label: "Explore", href: "/explore", icon: Map, showFor: ["co_hunter", "open_to_both"] },
  { label: "Swipe", href: "/swipe", icon: Shuffle, showFor: ["room_poster", "co_hunter", "open_to_both"] },
  { label: "Likes & Chat", href: "/likes", icon: Heart, showFor: ["room_poster", "co_hunter", "open_to_both"] },
  { label: "Profile", href: "/profile", icon: User, showFor: ["room_poster", "co_hunter", "open_to_both"] },
  /* ── Sidebar-only items (never in mobile bottom nav) ── */
  { label: "Chats", href: "/chats", icon: MessageCircle, showFor: ["room_poster", "co_hunter", "open_to_both"], sidebarOnly: true },
  { label: "Dashboard", href: "/dashboard", icon: BarChart3, showFor: ["room_poster"], sidebarOnly: true },
];

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
  const visibleItems = useMemo(
    () => navItems.filter((item) => item.showFor.includes(mode)),
    [navItems, mode]
  );
  const mobileItems = useMemo(
    () => visibleItems.filter((item) => !item.sidebarOnly).slice(0, 5),
    [visibleItems]
  );
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const asideRef = useRef<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

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
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = { startX: e.clientX, startWidth: sidebarWidth };
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

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (collapsed) return;
    onSidebarWidthChange?.(SIDEBAR_WIDTH_DEFAULT);
  }, [collapsed, onSidebarWidthChange]);

  useEffect(() => {
    if (!isDragging) return;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
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
    <div className={cn("min-h-screen bg-paper text-ink", className)} {...props}>
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
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-accent/20 active:bg-accent/30"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onDoubleClick={handleDoubleClick}
          />
        ) : null}
      </aside>
      <div
        className={cn("min-h-screen pb-24 md:pb-0 md:pl-[var(--sidebar-w)]", !isDragging && "transition-[padding-left] duration-200 ease-out")}
        style={{ '--sidebar-w': `${currentWidth}px` } as React.CSSProperties}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-paper px-5 md:px-6">
          {/* Mobile: greeting with avatar */}
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
          {/* Desktop: greeting on the left */}
          {user ? (
            <PrefetchLink to="/profile" className={cn("hidden min-w-0 items-center gap-3 md:flex", focusRing)}>
              <Avatar name={user.name} size="sm" src={user.avatarUrl} />
              <div className="min-w-0">
                <p className="truncate text-h3 font-semibold text-ink">Hi, {user.name.split(" ")[0]}!</p>
                {user.city ? <p className="truncate text-caption text-ink-2">{user.city}</p> : null}
              </div>
            </PrefetchLink>
          ) : null}
          {title ? <h1 className="hidden min-w-0 truncate text-h3 font-semibold text-ink md:block">{title}</h1> : null}
          <form
            onSubmit={handleSearchSubmit}
            className="ml-auto hidden w-full max-w-md md:block"
            role="search"
          >
            <SearchBar
              placeholder="Search listings"
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
              {notificationCount ? (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                  {notificationCount}
                </span>
              ) : null}
            </span>
          </PrefetchLink>
        </header>
        <main id="main" className="min-h-[calc(100vh-64px)] px-5 py-6 md:px-6">{children}</main>
      </div>
      <nav
        aria-label="Mobile primary"
        className="fixed inset-x-0 bottom-0 z-30 grid h-[76px] grid-cols-5 border-t border-line bg-paper/88 px-2 py-2 backdrop-blur-[9px] md:hidden"
      >
        {mobileItems.map((item) => (
          <ShellNavLink collapsed={false} mobile item={item} active={isActive(item.href)} key={item.href} />
        ))}
      </nav>
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
        collapsed ? "h-10 justify-center px-0" : mobile ? "flex-col justify-center gap-1 px-1 py-1 text-[11px]" : "h-10 px-3 text-body-md font-semibold"
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
