import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Bell, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { SearchBar } from "@/components/ui/SearchBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useBack } from "@/components/ui/Layout";
import { cn, focusRing } from "@/components/ui/component-utils";
import type { ShellUser } from "./nav-config";
import { PrefetchLink } from "./PrefetchLink";
import { CountBadge } from "./ShellNavLink";
import { firstName } from "./Sidebar";

interface TopBarProps {
  user?: ShellUser;
  title?: string;
  /** Set on secondary pages: phones show Back and the title here. */
  back?: string;
  unreadCount: number;
}

const iconLink = cn("relative grid h-11 w-11 place-items-center rounded-cut-md text-ink-2 hover:bg-surface-soft hover:text-ink", focusRing);

export function TopBar({ user, title, back, unreadCount }: TopBarProps) {
  const navigate = useNavigate();
  const goBack = useBack(back);
  const [query, setQuery] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    setQuery("");
  }

  return (
    <header className="paper-grain sticky top-0 z-[var(--z-raised)] bg-paper-1 pt-[env(safe-area-inset-top)] shadow-[0_1px_0_var(--color-edge)]">
      <div className="flex h-[var(--topbar-h)] items-center gap-2 px-[var(--gutter)] max-md:pl-2">
        {/* Phones: Back and the page title on secondary pages, a greeting on tabs. */}
        {back ? (
          <div className="flex min-w-0 flex-1 items-center gap-1 md:hidden">
            <Button aria-label="Back" size="icon" variant="icon" onClick={goBack}>
              <ArrowLeft aria-hidden="true" className="h-5 w-5" />
            </Button>
            {title ? <p className="min-w-0 truncate text-h3 text-ink">{title}</p> : null}
          </div>
        ) : user ? (
          <PrefetchLink to="/profile" className={cn("flex min-w-0 flex-1 items-center gap-3 rounded-cut-md py-1 pl-2 md:hidden", focusRing)}>
            <Avatar name={user.name} size="sm" src={user.avatarUrl} />
            <span className="min-w-0">
              <span className="block truncate text-h3 leading-tight text-ink">Hi, {firstName(user.name)}!</span>
              {user.city ? <span className="block truncate text-caption text-ink-2">{user.city}</span> : null}
            </span>
          </PrefetchLink>
        ) : (
          <div className="flex-1 pl-2 md:hidden">
            <Logo compact />
          </div>
        )}

        <form onSubmit={submit} className="hidden w-full max-w-md md:block" role="search" aria-label="Global search">
          <SearchBar
            placeholder="Search rooms, areas or societies"
            aria-label="Search listings"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery("")}
          />
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <PrefetchLink to="/search" aria-label="Search" className={cn(iconLink, "md:hidden", back && "max-md:hidden")}>
            <Search aria-hidden="true" className="h-5 w-5" />
          </PrefetchLink>
          <ThemeToggle size="sm" className="max-md:hidden" />
          <PrefetchLink
            to="/notifications"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
            className={iconLink}
          >
            <Bell aria-hidden="true" className="h-5 w-5" />
            {unreadCount > 0 ? (
              <CountBadge className="absolute right-1 top-1" count={unreadCount} />
            ) : null}
          </PrefetchLink>
        </div>
      </div>
    </header>
  );
}
