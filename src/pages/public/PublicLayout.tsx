import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { Instagram, Linkedin, Menu, Twitter } from "lucide-react";

import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { buttonClasses } from "@/components/ui/component-utils";
import { cn, focusRing } from "@/components/ui/component-utils";
import { ScrollProgressBar } from "@/components/ui/ScrollProgressBar";
import { Drawer } from "@/components/ui/Modal";
import { OfflineBanner } from "@/components/ui/Layout";
import { PWAInstallBanner } from "@/components/molecules/PWAInstallBanner";
import { AppStoreBadges } from "@/components/landing/AppStoreBadges";

const SOCIAL_LINKS = [
  { href: "https://www.instagram.com/360ghar", label: "Instagram", Icon: Instagram },
  { href: "https://www.linkedin.com/company/360ghar", label: "LinkedIn", Icon: Linkedin },
  { href: "https://twitter.com/360ghar", label: "Twitter", Icon: Twitter },
] as const;

const NAV_LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/search", label: "Search" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
] as const;

export function PublicLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();

  // Close drawer on route change so navigation isn't blocked.
  // Adjusting state during render (vs. setState-in-effect) is React's
  // recommended pattern for resetting state in response to a changed value.
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
          "paper-grain sticky z-[var(--z-sticky)] bg-paper-1 pt-[env(safe-area-inset-top)] shadow-[0_1px_0_var(--color-edge)]",
          "top-0",
        )}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-5 md:px-12">
          <Link to="/" aria-label="360 Flatmates home" className="shrink-0">
            <Logo compact />
          </Link>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-body-md font-semibold text-ink-2 hover:text-ink transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
            <ThemeToggle size="sm" className="max-lg:hidden" />
            <Link
              to="/login"
              className="hidden whitespace-nowrap text-body-md font-semibold text-ink-2 hover:text-ink transition-colors duration-200 sm:block"
            >
              Sign in
            </Link>
            <Link
              to="/discover"
              className={buttonClasses("primary", "compact") + " px-5 max-sm:hidden"}
            >
              Start matching
            </Link>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-cut-md text-ink-2 hover:bg-surface-soft md:hidden",
                focusRing,
              )}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        side="right"
        width="standard"
        className="md:hidden"
        aria-label="Navigation menu"
      >
        <div className="flex h-16 items-center justify-between px-5">
          <span className="text-h3 text-ink">Menu</span>
        </div>
        <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setDrawerOpen(false)}
              className="flex min-h-11 items-center rounded-cut-md px-4 text-body-md text-ink-2 hover:bg-surface-soft hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-3 pt-4">
            <Link
              to="/login"
              onClick={() => setDrawerOpen(false)}
              className="flex min-h-11 items-center rounded-cut-md px-4 text-body-md text-ink-2 hover:bg-surface-soft hover:text-accent"
            >
              Sign in
            </Link>
            <Link
              to="/discover"
              onClick={() => setDrawerOpen(false)}
              className={buttonClasses("primary", "compact") + " text-center"}
            >
              Start matching
            </Link>
            <div className="flex items-center gap-2 px-4 py-2">
              <ThemeToggle size="sm" />
              <span className="text-body-md text-ink-2">Dark mode</span>
            </div>
          </div>
        </nav>
      </Drawer>

      <div className="flex-1">
        <Outlet />
      </div>

      <footer className="paper-edge-torn-top paper-grain bg-paper-1 pb-[calc(24px+env(safe-area-inset-bottom))] pt-20">
        <div className="mx-auto max-w-7xl px-5 md:px-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-24">
            <div className="lg:col-span-2 space-y-6">
              <Logo compact />
              <p className="max-w-md text-body-lg text-ink-2">
                Compatibility-first flatmate search for verified rooms, better chats, and visits that stay organized.
              </p>
              <div className="flex flex-col gap-2">
                <p className="text-label-md text-ink-2">Get the app</p>
                <AppStoreBadges variant="light" />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-h3 text-ink">Explore</h3>
              <ul className="flex flex-col gap-4">
                <li>
                  <Link to="/discover" className="text-body-md text-ink-2 hover:text-accent transition-colors">
                    Browse Listings
                  </Link>
                </li>
                <li>
                  <Link to="/search" className="text-body-md text-ink-2 hover:text-accent transition-colors">
                    Search Flatmates
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-body-md text-ink-2 hover:text-accent transition-colors">
                    Guides & Tips
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-body-md text-ink-2 hover:text-accent transition-colors">
                    About
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="text-h3 text-ink">Company</h3>
              <ul className="flex flex-col gap-4">
                <li>
                  <Link to="/terms" className="text-body-md text-ink-2 hover:text-accent transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-body-md text-ink-2 hover:text-accent transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/#faq-heading" className="text-body-md text-ink-2 hover:text-accent transition-colors">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-6 md:flex-row">
            <p className="text-caption text-ink-3" suppressHydrationWarning>
              &copy; {new Date().getFullYear()} 360 Flatmates. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${label} (opens in a new tab)`}
                  className="flex h-11 w-11 items-center justify-center rounded-cut-md text-ink-2 transition-colors hover:bg-surface-soft hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <PWAInstallBanner
        className="fixed inset-x-0 bottom-4 z-[var(--z-overlay)] mx-auto max-w-3xl px-5 shadow-lg md:inset-x-auto md:right-5 md:bottom-5 md:max-w-md"
        pageviewLimit={3}
        variant="compact"
      />
    </div>
  );
}
