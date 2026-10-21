import { Tooltip } from "radix-ui";
import { cn, focusRing, interactiveMotion } from "@/components/ui/component-utils";
import type { NavItemConfig } from "./nav-config";
import { PrefetchLink } from "./PrefetchLink";

export function CountBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-[18px] min-w-[18px] place-items-center rounded-full bg-clay px-1 text-micro leading-none tabular-nums text-on-clay",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function accessibleLabel(item: NavItemConfig) {
  return item.badge ? `${item.label}, ${item.badge} unread` : item.label;
}

/** Sidebar row. Icon-only rail on tablets; the label shows from lg unless collapsed. */
export function SidebarNavLink({ item, active, collapsed }: { item: NavItemConfig; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  const link = (
    <PrefetchLink
      to={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={accessibleLabel(item)}
      className={cn(
        // The active item rises one paper layer (DESIGN.md §8).
        "relative flex h-11 items-center justify-center gap-3 rounded-cut-md text-body-md font-semibold text-ink-2 hover:text-ink",
        !collapsed && "lg:justify-start lg:px-3",
        interactiveMotion,
        focusRing,
        active ? "bg-surface text-clay shadow-sm" : "hover:bg-surface-soft"
      )}
    >
      <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
      {/* Visual label only; the link's aria-label is its name in every width. */}
      <span aria-hidden="true" className={cn("hidden", !collapsed && "lg:block lg:min-w-0 lg:flex-1 lg:truncate")}>{item.label}</span>
      {item.badge ? (
        <CountBadge
          count={item.badge}
          className={cn("absolute right-1.5 top-1", !collapsed && "lg:static")}
        />
      ) : null}
    </PrefetchLink>
  );

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="right"
          sideOffset={10}
          className={cn(
            "z-[var(--z-toast)] rounded-cut-sm bg-ink px-2.5 py-1.5 text-label-md text-sky shadow-xs",
            !collapsed && "lg:hidden"
          )}
        >
          {item.label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/** Phone tab. The active tab rises one paper layer with a clay icon and label. */
export function TabBarLink({ item, active }: { item: NavItemConfig; active: boolean }) {
  const Icon = item.icon;
  return (
    <PrefetchLink
      to={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={accessibleLabel(item)}
      className={cn(
        "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-cut-md px-1 py-1 text-micro font-semibold leading-tight text-ink-2",
        interactiveMotion,
        focusRing,
        active ? "bg-surface text-clay shadow-sm" : "hover:text-ink"
      )}
    >
      <span className="relative">
        <Icon aria-hidden="true" className="h-5 w-5" />
        {item.badge ? <CountBadge count={item.badge} className="absolute -right-3 -top-2" /> : null}
      </span>
      <span className="max-w-full truncate">{item.shortLabel ?? item.label}</span>
    </PrefetchLink>
  );
}
