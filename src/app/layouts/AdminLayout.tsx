import type { ReactNode } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { ArrowLeft, FileText, Flag, Shield } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { PageChromeContext } from "@/components/ui/Layout";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn, focusRing, interactiveMotion } from "@/components/ui/component-utils";

interface AdminNavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const ADMIN_NAV: AdminNavItem[] = [
  { label: "Listing queue", href: "/admin/moderation", icon: <Shield aria-hidden="true" className="h-5 w-5" /> },
  { label: "Reports", href: "/admin/moderation/reports", icon: <Flag aria-hidden="true" className="h-5 w-5" /> },
  { label: "Blog", href: "/admin/blog", icon: <FileText aria-hidden="true" className="h-5 w-5" /> }
];

/** Reports is its own tab; every other /admin/moderation page belongs to the queue. */
function isActive(pathname: string, href: string) {
  if (href === "/admin/moderation") return pathname.startsWith("/admin/moderation") && !pathname.startsWith("/admin/moderation/reports");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function toHref(href: string) {
  return href === "/admin/moderation" ? "/admin/moderation/listings" : href;
}

const navLink = (active: boolean) =>
  cn(
    "flex min-h-11 items-center gap-3 rounded-cut-md px-3 text-body-md font-semibold text-ink-2 hover:text-ink",
    interactiveMotion,
    focusRing,
    active ? "bg-surface text-clay shadow-sm" : "hover:bg-surface-soft"
  );

/** Moderation chrome in the app's paper language. The route guard owns access. */
export function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <aside className="paper-grain fixed inset-y-0 left-0 z-[var(--z-sticky)] hidden w-60 flex-col bg-paper-1 p-3 shadow-[1px_0_0_var(--color-edge)] lg:flex">
        <div className="flex h-16 items-center gap-2 px-3">
          <Logo compact />
          <span className="text-label-md text-ink-3">Admin</span>
        </div>
        <nav aria-label="Admin navigation" className="mt-3 flex flex-1 flex-col gap-1">
          {ADMIN_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link key={item.href} to={toHref(item.href)} aria-current={active ? "page" : undefined} className={navLink(active)}>
                {item.icon}
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-between gap-2">
          <Link to="/home" className={navLink(false)}>
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
            Back to app
          </Link>
          <ThemeToggle size="sm" />
        </div>
      </aside>

      <div className="min-h-dvh lg:pl-60">
        <header className="paper-grain sticky top-0 z-[var(--z-raised)] bg-paper-1 pt-[env(safe-area-inset-top)] shadow-[0_1px_0_var(--color-edge)] lg:hidden">
          <div className="flex h-16 items-center gap-2 px-[var(--gutter)]">
            <Link to="/home" aria-label="Back to app" className={cn("grid h-11 w-11 place-items-center rounded-cut-md text-ink-2 hover:bg-surface-soft", focusRing)}>
              <ArrowLeft aria-hidden="true" className="h-5 w-5" />
            </Link>
            <Logo compact />
            <span className="text-label-md text-ink-3">Admin</span>
            <ThemeToggle size="sm" className="ml-auto" />
          </div>
          <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto scrollbar-none px-[var(--gutter)] pb-2">
            {ADMIN_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link key={item.href} to={toHref(item.href)} aria-current={active ? "page" : undefined} className={cn(navLink(active), "shrink-0")}>
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main id="main" className="scroll-mt-[calc(128px+env(safe-area-inset-top))] px-[var(--gutter)] py-6 md:py-8">
          <PageChromeContext.Provider value={{}}>
            <Outlet />
          </PageChromeContext.Provider>
        </main>
      </div>
    </div>
  );
}
