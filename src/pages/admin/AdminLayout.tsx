import { useEffect } from "react";
import { Outlet } from "react-router";
import { Link, useLocation, useNavigate } from "react-router";
import type { ReactNode } from "react";
import {
  BarChart3,
  Eye,
  Flag,
  Shield
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn, focusRing } from "@/components/ui/component-utils";
import { useAuth } from "@/hooks/useAuth";
import { uiStore } from "@/lib/stores/ui-store";

interface AdminNavItem {
  label: string;
  href: string;
  icon: ReactNode;
  /** Match only the exact href (used to keep the Listings tab from also highlighting on Prescreen detail). */
  exact?: boolean;
}

const adminNavItems: AdminNavItem[] = [
  {
    label: "Stats",
    href: "/admin/stats",
    icon: <BarChart3 aria-hidden="true" className="h-5 w-5" />
  },
  {
    label: "Listing Queue",
    href: "/admin/moderation/listings",
    icon: <Shield aria-hidden="true" className="h-5 w-5" />,
    exact: true
  },
  {
    label: "Reports",
    href: "/admin/moderation/reports",
    icon: <Flag aria-hidden="true" className="h-5 w-5" />
  },
  {
    label: "Prescreen",
    href: "/admin/moderation/prescreen",
    icon: <Eye aria-hidden="true" className="h-5 w-5" />
  }
];

function isNavActive(
  pathname: string,
  href: string,
  exact: boolean | undefined
): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Defensive double-check: AdminGuard already enforces the role at the route
  // boundary, but the role can be revoked server-side while the user is still
  // mounted. Surface a toast and bounce to /home instead of silently rendering
  // admin-only data.
  useEffect(() => {
    if (loading) return;
    if (!user || user.app_metadata?.role !== "admin") {
      uiStore.getState().pushToast({
        type: "error",
        title: "Access denied",
        description: "You don't have permission to view the admin area."
      });
      navigate("/home", { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <aside className="fixed inset-y-0 left-0 z-[var(--z-sticky)] hidden w-60 flex-col border-r border-line bg-surface p-3 xl:flex">
        <div className="flex h-14 items-center justify-center px-2">
          <Logo compact />
        </div>
        <span className="mx-2 mt-2 rounded-full border border-line-low bg-paper px-3 py-1 text-center text-label-md text-ink-3">
          Admin
        </span>
        <nav aria-label="Admin navigation" className="mt-5 flex flex-1 flex-col gap-1">
          {adminNavItems.map((item) => (
            <AdminNavLink
              key={item.href}
              item={item}
              active={isNavActive(location.pathname, item.href, item.exact)}
            />
          ))}
        </nav>
      </aside>

      <div className="min-h-screen xl:pl-60">
        <header className="sticky top-0 z-[var(--z-raised)] flex min-h-16 items-center gap-3 border-b border-line bg-surface/92 px-5 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:px-6">
          <div className="flex min-w-0 items-center gap-2 xl:hidden">
            <Logo compact />
            <span className="text-label-lg text-ink-3">Admin</span>
          </div>
          <nav
            aria-label="Mobile admin navigation"
            className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto xl:hidden"
          >
            {adminNavItems.map((item) => {
              const active = isNavActive(location.pathname, item.href, item.exact);
              return (
              <Link
                key={item.href}
                to={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-[9px] px-3 py-2 text-label-md text-ink-3 hover:bg-paper-3 hover:text-ink",
                  active && "bg-accent-soft text-accent",
                  focusRing
                )}
              >
                {item.icon}
                <span className="hidden md:inline">{item.label}</span>
              </Link>
              );
            })}
          </nav>
          <ThemeToggle size="sm" className="ml-auto hidden xl:flex" />
        </header>
        <main id="main" className="min-h-[calc(100dvh-64px)] px-5 py-6 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminNavLink({ item, active }: { item: AdminNavItem; active: boolean }) {
  return (
    <Link
      to={item.href}
      title={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-body-md font-semibold hover:bg-paper-3 hover:text-ink",
        active ? "bg-accent-soft text-accent" : "text-ink-3",
        focusRing
      )}
    >
      {item.icon}
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
