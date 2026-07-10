import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { Instagram, Linkedin, Menu, Twitter } from "lucide-react";

import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { buttonClasses } from "@/components/ui/Button";
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
  const [offline, setOffline] = useState(false);
  const { pathname } = useLocation();

  // Close drawer on route change so navigation isn't blocked.
  // Adjusting state during render (vs. setState-in-effect) is React's
  // recommended pattern for resetting state in response to a changed value.
  const [drawerRoute, setDrawerRoute] = useState(pathname);
  if (pathname !== drawerRoute) {
    setDrawerRoute(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  // Online/offline detection — surface a banner when the connection drops.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <div className={cn("flex min-h-screen flex-col bg-paper text-ink", offline && "pt-10")}>
      <ScrollProgressBar />
      <OfflineBanner visible={offline} />
      <header
        className={cn(
          "sticky z-[var(--z-sticky)] border-b border-line-low bg-surface/92 pt-[env(safe-area-inset-top)] backdrop-blur-xl",
          offline ? "top-10" : "top-0",
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
            <ThemeToggle size="sm" className="hidden sm:block" />
            <Link
              to="/login"
              className="hidden text-body-md font-semibold text-ink-2 hover:text-ink transition-colors duration-200 sm:block"
            >
              Sign in
            </Link>
            <Link
              to="/discover"
              className={buttonClasses("primary", "compact") + " hidden h-10 rounded-full px-5 sm:inline-flex"}
            >
              Start matching
            </Link>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-2 hover:bg-paper md:hidden",
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
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <span className="text-label-lg text-ink">Menu</span>
        </div>
        <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setDrawerOpen(false)}
              className="rounded-[8px] px-4 py-3 text-body-md text-ink-2 hover:bg-paper-2 hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-3 border-t border-line pt-4">
            <Link
              to="/login"
              onClick={() => setDrawerOpen(false)}
              className="rounded-[8px] px-4 py-3 text-body-md text-ink-2 hover:bg-paper-2 hover:text-accent"
            >
              Sign in
            </Link>
            <Link
              to="/discover"
              onClick={() => setDrawerOpen(false)}
              className={buttonClasses("primary", "compact") + " h-10 text-center"}
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

      <footer className="bg-paper border-t border-line-low py-20 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-7xl px-5 md:px-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-24">
            <div className="lg:col-span-2 space-y-6">
              <Logo compact />
              <p className="max-w-md text-body-lg text-ink-3">
                Compatibility-first flatmate search for verified rooms, better chats, and visits that stay organized.
              </p>
              <div className="flex flex-col gap-2">
                <p className="text-label-md text-ink-3">Get the app</p>
                <AppStoreBadges variant="light" />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-eyebrow text-ink">Explore</h3>
              <ul className="flex flex-col gap-4">
                <li>
                  <Link to="/discover" className="text-body-md text-ink-3 hover:text-accent transition-colors">
                    Browse Listings
                  </Link>
                </li>
                <li>
                  <Link to="/search" className="text-body-md text-ink-3 hover:text-accent transition-colors">
                    Search Flatmates
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-body-md text-ink-3 hover:text-accent transition-colors">
                    Guides & Tips
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-body-md text-ink-3 hover:text-accent transition-colors">
                    About
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="text-eyebrow text-ink">Company</h3>
              <ul className="flex flex-col gap-4">
                <li>
                  <Link to="/terms" className="text-body-md text-ink-3 hover:text-accent transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-body-md text-ink-3 hover:text-accent transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/#faq-heading" className="text-body-md text-ink-3 hover:text-accent transition-colors">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-20 pt-10 border-t border-line-low flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-caption text-ink-4 tracking-widest uppercase" suppressHydrationWarning>
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
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-paper-2 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
