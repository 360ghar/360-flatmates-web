import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { cn, focusRing } from "@/components/ui/component-utils";
import { SIDEBAR_WIDTH_MAX, SIDEBAR_WIDTH_MIN } from "@/lib/stores/ui-store";
import { isNavActive, type NavItemConfig } from "./nav-config";
import { PrefetchLink } from "./PrefetchLink";
import { SidebarNavLink } from "./ShellNavLink";
import type { ShellUser } from "./nav-config";
import { useSidebarResize } from "./useSidebarResize";

export function firstName(name?: string) {
  return name?.trim().split(/\s+/)[0] || "there";
}

interface SidebarProps {
  items: NavItemConfig[];
  activeHref?: string;
  user?: ShellUser;
  collapsed: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  sidebarWidth: number;
  onSidebarWidthChange?: (width: number) => void;
}

/**
 * The nav rail on paper-1. Tablets get an icon rail with tooltips; from lg it
 * shows labels unless the user collapsed it, and it can be resized.
 */
export function Sidebar({ items, activeHref, user, collapsed, onCollapsedChange, sidebarWidth, onSidebarWidthChange }: SidebarProps) {
  const resize = useSidebarResize(collapsed, sidebarWidth, onSidebarWidthChange);
  const expanded = !collapsed;

  return (
    <aside
      className="paper-grain fixed inset-y-0 left-0 z-[var(--z-sticky)] hidden w-[72px] flex-col bg-paper-1 px-3 pb-3 pt-[env(safe-area-inset-top)] shadow-[1px_0_0_var(--color-edge)] md:flex lg:w-[var(--sidebar-w)]"
    >
      <PrefetchLink
        to="/home"
        aria-label="360 Flatmates home"
        className={cn("flex h-16 shrink-0 items-center justify-center rounded-cut-md", expanded && "lg:justify-start lg:px-3", focusRing)}
      >
        <Logo iconOnly className={cn(expanded && "lg:hidden")} />
        {expanded ? <Logo compact className="hidden lg:inline-flex" /> : null}
      </PrefetchLink>

      <nav aria-label="Primary" className="mt-3 flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-thin">
        {items.map((item) => (
          <div key={item.href} className={cn(item.groupStart && "mt-4")}>
            <SidebarNavLink item={item} active={isNavActive(item.href, activeHref)} collapsed={collapsed} />
          </div>
        ))}
      </nav>

      {user ? (
        <PrefetchLink
          to="/profile"
          aria-label={`Your profile, ${user.name}`}
          className={cn(
            "mt-3 flex min-h-11 items-center justify-center gap-3 rounded-cut-md p-1.5 hover:bg-surface-soft",
            expanded && "lg:justify-start",
            focusRing
          )}
        >
          <Avatar name={user.name} size="sm" src={user.avatarUrl} />
          <span aria-hidden="true" className={cn("hidden", expanded && "lg:block lg:min-w-0")}>
            <span className="block truncate text-body-md font-semibold text-ink">Hi, {firstName(user.name)}!</span>
            {user.city ? <span className="block truncate text-caption text-ink-2">{user.city}</span> : null}
          </span>
        </PrefetchLink>
      ) : null}

      <Button
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        size="icon"
        variant="icon"
        className={cn("mt-1 hidden text-ink-3 lg:inline-flex", expanded && "lg:self-end")}
        onClick={() => onCollapsedChange?.(!collapsed)}
      >
        {collapsed ? <PanelLeftOpen aria-hidden="true" className="h-5 w-5" /> : <PanelLeftClose aria-hidden="true" className="h-5 w-5" />}
      </Button>

      {expanded ? (
        // A focusable separator is the ARIA window-splitter widget (arrow keys resize).
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          aria-valuenow={sidebarWidth}
          aria-valuemin={SIDEBAR_WIDTH_MIN}
          aria-valuemax={SIDEBAR_WIDTH_MAX}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          className="absolute right-0 top-0 hidden h-full w-1.5 cursor-col-resize touch-pan-y hover:bg-clay/20 focus:bg-clay/25 focus:outline-none active:bg-clay/30 lg:block"
          onPointerDown={resize.handlePointerDown}
          onPointerMove={resize.handlePointerMove}
          onPointerUp={resize.handlePointerUp}
          onPointerCancel={resize.handlePointerCancel}
          onKeyDown={resize.handleKeyDown}
          onDoubleClick={resize.handleDoubleClick}
        />
      ) : null}
    </aside>
  );
}
