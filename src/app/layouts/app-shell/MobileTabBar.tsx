import { useState } from "react";
import { useLocation } from "react-router";
import { HelpCircle } from "lucide-react";
import { AppearanceIcon, MoreIcon } from "@/components/paper/NavIcons";
import { BottomSheet } from "@/components/ui/Modal";
import { cn, focusRing, interactiveMotion } from "@/components/ui/component-utils";
import type { UserMode } from "@/components/ui/Badge";
import { isNavActive, MOBILE_TABS, type NavItemConfig } from "./nav-config";
import { PrefetchLink } from "./PrefetchLink";
import { TabBarLink } from "./ShellNavLink";

const EXTRA_LINKS = [
  { label: "Appearance", href: "/settings/appearance", icon: AppearanceIcon },
  { label: "Help", href: "/help", icon: HelpCircle }
];

/** Phone tab strip on paper-1 with a torn top edge; four tabs and More. */
export function MobileTabBar({ items, mode, activeHref }: { items: NavItemConfig[]; mode: UserMode; activeHref?: string }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const [openedAt, setOpenedAt] = useState(pathname);
  // Close the sheet when the route changes (state adjusted during render).
  // Track the raw pathname: activeHref pins detail routes to their nav tab
  // (/chats/:id → /chats), so it misses in-tab navigation.
  if (openedAt !== pathname) {
    setOpenedAt(pathname);
    if (moreOpen) setMoreOpen(false);
  }

  const tabHrefs = MOBILE_TABS[mode];
  const tabs = tabHrefs.map((href) => items.find((item) => item.href === href)).filter((item): item is NavItemConfig => Boolean(item));
  const moreItems = items.filter((item) => !tabHrefs.includes(item.href));
  const moreActive = moreOpen || moreItems.some((item) => isNavActive(item.href, activeHref)) || EXTRA_LINKS.some((l) => isNavActive(l.href, activeHref));
  const moreBadge = moreItems.reduce((sum, item) => sum + (item.badge ?? 0), 0);

  return (
    <>
      <nav
        aria-label="Mobile primary"
        className="paper-grain paper-edge-torn-top fixed inset-x-0 bottom-0 z-[var(--z-sticky)] grid h-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] grid-cols-5 gap-1 bg-paper-1 px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-[calc(var(--torn-depth)+6px)] md:hidden"
      >
        {tabs.map((item) => (
          <TabBarLink key={item.href} item={item} active={!moreOpen && isNavActive(item.href, activeHref)} />
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          aria-label={moreBadge ? `More, ${moreBadge} unread` : "More"}
          className={cn(
            "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-cut-md px-1 py-1 text-micro font-semibold leading-tight text-ink-2",
            interactiveMotion,
            focusRing,
            moreActive ? "bg-surface text-clay shadow-sm" : "hover:text-ink"
          )}
        >
          <MoreIcon aria-hidden="true" className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>

      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <ul className="flex flex-col gap-1">
          {[...moreItems, ...EXTRA_LINKS].map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.href, activeHref);
            const badge = "badge" in item ? item.badge : undefined;
            return (
              <li key={item.href}>
                <PrefetchLink
                  to={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-cut-md px-3 text-body-lg text-ink-2 hover:bg-surface-soft hover:text-ink",
                    focusRing,
                    active && "bg-surface font-semibold text-clay shadow-sm"
                  )}
                >
                  <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {badge ? <span className="text-label-md tabular-nums text-clay">{badge} new</span> : null}
                </PrefetchLink>
              </li>
            );
          })}
        </ul>
      </BottomSheet>
    </>
  );
}
