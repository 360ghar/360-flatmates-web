import { useState } from "react";
import { Link, Outlet } from "react-router";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { buttonClasses } from "@/components/ui/Button";
import { cn, focusRing } from "@/components/ui/component-utils";
import { ScrollProgressBar } from "@/components/ui/ScrollProgressBar";

const NAV_LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/search", label: "Search" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
] as const;

export function PublicLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <ScrollProgressBar />
      <header className="sticky top-0 z-30 border-b border-line-low bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 md:px-12">
          <Link to="/" aria-label="360 Flatmates home" className="shrink-0">
            <Logo compact />
          </Link>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-label-lg text-ink-3 hover:text-accent transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-6">
            <ThemeToggle size="sm" />
            <Link
              to="/login"
              className="text-label-lg text-ink-2 hover:text-accent transition-colors duration-300"
            >
              Sign in
            </Link>
            <Link
              to="/discover"
              className={buttonClasses("primary", "compact") + " px-6 h-10 shadow-cta"}
            >
              Join
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

      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="absolute inset-0 bg-ink/20 backdrop-blur-[4px]"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 right-0 flex w-72 flex-col bg-surface shadow-lg animate-drawer-in">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <span className="text-label-lg text-ink">Menu</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation menu"
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-[9px] text-ink-2 hover:bg-paper-2",
                  focusRing,
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-[9px] px-4 py-3 text-body-md text-ink-2 hover:bg-paper-2 hover:text-accent"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="flex-1"><Outlet /></div>

      <footer className="bg-surface border-t border-line-low py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-24">
            <div className="lg:col-span-2 space-y-6">
              <Logo compact />
              <p className="max-w-md text-body-lg text-ink-3">
                Expanding the horizons of shared living through meticulously matched communities across India&apos;s premier urban landscapes.
              </p>
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
                    Our Philosophy
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
            <div className="flex gap-8">
              <a href="https://www.instagram.com/360ghar" target="_blank" rel="noopener noreferrer" className="text-caption text-ink-4 tracking-widest uppercase hover:text-accent transition-colors">
                Instagram
              </a>
              <a href="https://www.linkedin.com/company/360ghar" target="_blank" rel="noopener noreferrer" className="text-caption text-ink-4 tracking-widest uppercase hover:text-accent transition-colors">
                LinkedIn
              </a>
              <a href="https://twitter.com/360ghar" target="_blank" rel="noopener noreferrer" className="text-caption text-ink-4 tracking-widest uppercase hover:text-accent transition-colors">
                Twitter
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
