import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { Menu } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { buttonClasses, cn, focusRing } from "@/components/ui/component-utils";
import { ScrollProgressBar } from "@/components/ui/ScrollProgressBar";
import { Drawer } from "@/components/ui/Modal";
import { OfflineBanner } from "@/components/ui/Layout";
import { PWAInstallBanner } from "@/features/pwa/components/PWAInstallBanner";
import { SiteFooter } from "./SiteFooter";

const NAV_LINKS = [
  { href: "/discover", label: "Browse rooms" },
  { href: "/search", label: "Search" },
  { href: "/blog", label: "Guides" },
  { href: "/about", label: "About" }
] as const;

/**
 * Marketing and browse chrome. The header rests on the sky at the top of the
 * page and becomes a paper strip with a torn edge once the page scrolls.
 */
export function PublicLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));

  // Close the drawer on route change (state adjusted during render).
  const [drawerRoute, setDrawerRoute] = useState(pathname);
  if (pathname !== drawerRoute) {
    setDrawerRoute(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <ScrollProgressBar />
      <OfflineBanner />
      <header
        className={cn(
          "sticky top-0 z-[var(--z-sticky)] pt-[env(safe-area-inset-top)] transition-[background-color,box-shadow] duration-[var(--duration-normal)]",
          scrolled ? "paper-grain bg-paper-1 shadow-[0_1px_0_var(--color-edge)]" : "bg-transparent"
        )}
      >
        <div className="page-container flex h-[var(--public-header-h)] items-center justify-between gap-3">
          <Link to="/" aria-label="360 Flatmates home" className={cn("shrink-0 rounded-cut-sm", focusRing)}>
            <Logo compact />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  cn(
                    "inline-flex min-h-11 items-center rounded-cut-md px-3 text-body-md font-semibold transition-colors",
                    focusRing,
                    isActive ? "text-clay" : "text-ink-2 hover:text-ink"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle size="sm" />
            <Link
              to="/login"
              className={cn(
                "hidden min-h-11 items-center whitespace-nowrap rounded-cut-md px-3 text-body-md font-semibold text-ink-2 hover:text-ink sm:inline-flex",
                focusRing
              )}
            >
              Sign in
            </Link>
            <Link to="/discover" className={cn(buttonClasses("primary", "compact"), "max-[359px]:hidden")}>
              Start matching
            </Link>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              className={cn("inline-flex h-11 w-11 items-center justify-center rounded-cut-md text-ink-2 hover:bg-surface-soft lg:hidden", focusRing)}
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>
        {/* The torn lip that hangs below the strip once it is paper. */}
        <div
          aria-hidden="true"
          className={cn(
            "paper-edge-torn-bottom paper-grain pointer-events-none absolute inset-x-0 top-full h-[calc(var(--torn-depth)+2px)] bg-paper-1 transition-opacity duration-[var(--duration-normal)]",
            scrolled ? "opacity-100" : "opacity-0"
          )}
        />
      </header>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Menu" side="right" width="standard" className="lg:hidden">
        <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                cn(
                  "flex min-h-12 items-center rounded-cut-md px-3 text-body-lg",
                  focusRing,
                  isActive ? "bg-surface font-semibold text-clay shadow-sm" : "text-ink-2 hover:bg-surface-soft hover:text-ink"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link to="/login" className={cn("mt-4 flex min-h-12 items-center rounded-cut-md px-3 text-body-lg text-ink-2 hover:bg-surface-soft hover:text-ink", focusRing)}>
            Sign in
          </Link>
          <Link to="/discover" className={cn(buttonClasses("primary", "default", true), "mt-2")}>
            Start matching
          </Link>
        </nav>
      </Drawer>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <SiteFooter />

      <PWAInstallBanner
        className="fixed inset-x-0 bottom-4 z-[var(--z-overlay)] mx-auto max-w-3xl px-4 md:inset-x-auto md:bottom-5 md:right-5 md:max-w-md"
        pageviewLimit={3}
        variant="compact"
      />
    </div>
  );
}
