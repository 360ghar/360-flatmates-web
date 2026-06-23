import type { HTMLAttributes } from "react";
import { cn } from "./component-utils";

export type SkeletonVariant =
  | "block"
  | "card"
  | "listItem"
  | "feed"
  | "profile"
  | "listingCard"
  | "profileGridCard"
  | "menuItemRow"
  | "notificationCard"
  | "conversationRow"
  | "visitCard"
  | "statCard"
  | "chatMessage"
  | "swipeCard"
  | "searchBar"
  | "filterChips"
  | "searchResults"
  | "listingDetail"
  | "publicProfile";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  count?: number;
  /** For "chatMessage" variant: which side the bubble is on */
  side?: "left" | "right";
}

/**
 * Shared shimmer class using the `.shimmer` CSS utility from globals.css
 * which properly sets `background-size: 220% 100%` for the sweep animation.
 * Falls back to Tailwind gradient + animate-shimmer when .shimmer is unavailable.
 */
const shimmer = "shimmer animate-shimmer motion-reduce:animate-none";

/* ─── Primitive building blocks ─── */

function BlockSkeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("h-4 rounded-full", shimmer, className)} />;
}

/* ─── Legacy variants (kept for backward compatibility) ─── */

function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("h-10 w-10 rounded-xl", shimmer)} />
      <div className="flex flex-1 flex-col gap-2">
        <BlockSkeleton className="w-3/5" />
        <BlockSkeleton className="h-3 w-2/5" />
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className={cn("aspect-[5/6] rounded-2xl", shimmer)} />
      <div className="mt-3 flex flex-col gap-2">
        <BlockSkeleton className="h-6 w-1/4" />
        <BlockSkeleton className="h-4 w-4/5" />
        <BlockSkeleton className="w-3/5" />
        <div className="flex gap-2">
          <div className={cn("h-6 w-14 rounded-full", shimmer)} />
          <div className={cn("h-6 w-14 rounded-full", shimmer)} />
          <div className={cn("h-6 w-16 rounded-full", shimmer)} />
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className={cn("h-20 w-20 rounded-xl", shimmer)} />
      <BlockSkeleton className="h-5 w-1/2" />
      <BlockSkeleton className="w-1/3" />
    </div>
  );
}

/* ─── New design-accurate variants ─── */

/** Matches ListingCard molecule — desktop horizontal, mobile vertical */
function ListingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[148px_minmax(0,1fr)]">
        {/* Image area */}
        <div className="relative">
          <div className={cn("aspect-[5/6] w-full rounded-2xl lg:aspect-[0.82]", shimmer)} />
        </div>
        {/* Content */}
        <div className="flex flex-col gap-2">
          {/* Price */}
          <div className={cn("h-6 w-1/4 rounded-md", shimmer)} />
          {/* Title */}
          <div className={cn("h-4 w-4/5 rounded-md", shimmer)} />
          {/* Location row */}
          <div className="flex items-center gap-1.5">
            <div className={cn("h-4 w-4 rounded-sm", shimmer)} />
            <div className={cn("h-3 w-1/3 rounded-md", shimmer)} />
          </div>
          {/* Info pills */}
          <div className="flex gap-2">
            <div className={cn("h-6 w-14 rounded-full", shimmer)} />
            <div className={cn("h-6 w-14 rounded-full", shimmer)} />
            <div className={cn("h-6 w-16 rounded-full", shimmer)} />
          </div>
          {/* Feature pills */}
          <div className="flex gap-2">
            <div className={cn("h-6 w-16 rounded-full", shimmer)} />
            <div className={cn("h-6 w-12 rounded-full", shimmer)} />
          </div>
          {/* Owner row */}
          <div className="flex items-center gap-2 pt-1">
            <div className={cn("h-[34px] w-[34px] rounded-xl", shimmer)} />
            <div className={cn("h-3 w-20 rounded-md", shimmer)} />
          </div>
          {/* CTA button */}
          <div className={cn("mt-2 h-[42px] w-full rounded-[10px]", shimmer)} />
        </div>
      </div>
    </div>
  );
}

/** Matches ProfileGridCard molecule — 4:5 photo + match ring + CTA */
function ProfileGridCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3 shadow-sm">
      <div className="relative">
        <div className={cn("aspect-[4/5] w-full rounded-2xl", shimmer)} />
        {/* Match ring */}
        <div className="absolute right-2 top-2 flex h-[44px] w-[44px] items-center justify-center rounded-full border-2 border-line bg-surface p-1 shadow-xs" />
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        <div className={cn("h-[15px] w-3/5 rounded-sm", shimmer)} />
        <div className={cn("h-3 w-2/5 rounded-sm", shimmer)} />
        <div className={cn("h-3 w-1/4 rounded-sm", shimmer)} />
        <div className={cn("mt-2 h-[42px] w-full rounded-[10px]", shimmer)} />
      </div>
    </div>
  );
}

/** Matches MenuItemRow molecule — icon container + label + chevron */
function MenuItemRowSkeleton() {
  return (
    <div className="flex h-14 items-center gap-3 border-b border-line px-2 py-2">
      <div className={cn("h-10 w-10 shrink-0 rounded-xl", shimmer)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className={cn("h-[15px] w-2/5 rounded-sm", shimmer)} />
      </div>
      <div className={cn("h-5 w-5 shrink-0 rounded-sm", shimmer)} />
    </div>
  );
}

/** Matches NotificationCard molecule — icon + title + description + timestamp + unread dot */
function NotificationCardSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className={cn("h-12 w-12 shrink-0 rounded-full", shimmer)} />
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <div className={cn("h-[15px] w-3/5 rounded-sm", shimmer)} />
        <div className={cn("h-3 w-full rounded-sm", shimmer)} />
        <div className={cn("h-3 w-4/5 rounded-sm", shimmer)} />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <div className={cn("h-3 w-10 rounded-sm", shimmer)} />
        <div className={cn("h-2.5 w-2.5 rounded-full", shimmer)} />
      </div>
    </div>
  );
}

/** Matches ConversationRow molecule — avatar + name/badge + preview + timestamp */
function ConversationRowSkeleton() {
  return (
    <div className="flex min-h-[72px] items-center gap-3 rounded-[9px] px-3 py-2">
      <div className={cn("h-[52px] w-[52px] shrink-0 rounded-xl", shimmer)} />
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <div className={cn("h-4 w-24 rounded-sm", shimmer)} />
          <div className={cn("h-4 w-10 rounded-full", shimmer)} />
        </div>
        <div className={cn("h-3 w-3/4 rounded-sm", shimmer)} />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className={cn("h-3 w-10 rounded-sm", shimmer)} />
      </div>
    </div>
  );
}

/** Matches VisitCard molecule — thumbnail + title/badge + date + actions */
function VisitCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex gap-3">
        <div className={cn("h-14 w-14 shrink-0 rounded-xl", shimmer)} />
        <div className="flex flex-1 flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2">
            <div className={cn("h-4 w-28 rounded-sm", shimmer)} />
            <div className={cn("h-5 w-16 rounded-full", shimmer)} />
          </div>
          <div className={cn("h-3 w-2/5 rounded-sm", shimmer)} />
          <div className="flex gap-2 pt-1">
            <div className={cn("h-6 w-14 rounded-full", shimmer)} />
            <div className={cn("h-6 w-16 rounded-full", shimmer)} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Matches StatCard molecule — icon + label + value + description */
function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className={cn("h-12 w-12 shrink-0 rounded-xl", shimmer)} />
        <div className="flex flex-col gap-2 min-w-0">
          <div className={cn("h-3 w-16 rounded-sm", shimmer)} />
          <div className={cn("h-8 w-20 rounded-md", shimmer)} />
          <div className={cn("h-3 w-24 rounded-sm", shimmer)} />
        </div>
      </div>
    </div>
  );
}

/** Matches ChatMessageBubble — aligned left or right */
function ChatMessageSkeleton({ side = "left" }: { side?: "left" | "right" }) {
  const isRight = side === "right";
  return (
    <div className={cn("flex flex-col gap-1", isRight ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl p-3",
          isRight ? "rounded-br-sm bg-accent/20" : "rounded-bl-sm bg-paper-3"
        )}
        style={{ width: "60%" }}
      >
        <div className={cn("h-4 w-3/4 rounded-sm", shimmer)} />
        <div className={cn("mt-1.5 h-3 w-1/2 rounded-sm", shimmer)} />
      </div>
      <div className={cn("h-2.5 w-12 rounded-sm", shimmer)} />
    </div>
  );
}

/**
 * Matches SwipeDeck card — responsive to mirror the real deck:
 *  - mobile (< md): collapsed full-bleed portrait card (with stacked background cards)
 *  - md+: expanded side-by-side card (photo pane + details pane), like SwipeDeck's
 *    expanded view which is the default on viewports ≥768px.
 * Followed by the SwipeActionBar row in both cases.
 */
function SwipeCardSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 md:max-w-3xl lg:max-w-4xl">
      <div className="relative h-[calc(100dvh-328px)] md:h-[calc(100dvh-268px)]">
        {/* ── Mobile: collapsed full-bleed portrait card ── */}
        <div className="md:hidden">
          {/* Background card 2 (furthest back) */}
          <div className="absolute inset-x-4 top-4 h-full scale-90 opacity-30 rounded-2xl border border-line bg-surface shadow-sm translate-y-3" />

          {/* Background card 1 (middle) */}
          <div className="absolute inset-x-2 top-2 h-full scale-[0.95] opacity-50 rounded-2xl border border-line bg-surface shadow-sm translate-y-[6px]" />

          {/* Top Card */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
            {/* Full-bleed image area */}
            <div className={cn("absolute inset-0", shimmer)} />

            {/* Bottom overlay with gradient */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-ink/80 to-transparent p-5 pt-20">
              <div className={cn("h-8 w-3/5 rounded-md", shimmer)} />
              <div className="flex items-center gap-1.5 mt-1">
                <div className="h-4 w-4 rounded-sm bg-white/20" />
                <div className={cn("h-4 w-1/3 rounded-sm", shimmer)} />
              </div>
              <div className="flex gap-2 pt-2">
                <div className={cn("h-6 w-16 rounded-full bg-white/20", shimmer)} />
                <div className={cn("h-6 w-14 rounded-full bg-white/20", shimmer)} />
                <div className={cn("h-6 w-20 rounded-full bg-white/20", shimmer)} />
              </div>
            </div>
          </div>
        </div>

        {/* ── md+: expanded side-by-side card ── */}
        <div className="absolute inset-0 hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-lg md:flex">
          {/* Left: photo pane */}
          <div className={cn("relative h-full w-[40%] shrink-0 lg:w-[45%]", shimmer)}>
            {/* Title block over photo */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-ink/80 to-transparent p-4 pt-20">
              <div className={cn("h-7 w-3/5 rounded-md", shimmer)} />
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded-sm bg-white/20" />
                <div className={cn("h-4 w-1/2 rounded-sm", shimmer)} />
              </div>
            </div>
          </div>

          {/* Right: details pane */}
          <div className="flex flex-1 flex-col px-5 py-4 space-y-6">
            {/* Specs grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 border-b border-line/45 pb-5">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className={cn("h-3 w-1/2 rounded-sm", shimmer)} />
                  <div className={cn("h-4 w-3/4 rounded-sm", shimmer)} />
                </div>
              ))}
            </div>

            {/* About section */}
            <div className="space-y-2">
              <div className={cn("h-5 w-24 rounded-md", shimmer)} />
              <div className={cn("h-4 w-full rounded-sm", shimmer)} />
              <div className={cn("h-4 w-11/12 rounded-sm", shimmer)} />
              <div className={cn("h-4 w-4/5 rounded-sm", shimmer)} />
            </div>

            {/* Chip rows */}
            <div className="space-y-2">
              <div className={cn("h-5 w-20 rounded-md", shimmer)} />
              <div className="flex flex-wrap gap-2">
                <div className={cn("h-7 w-24 rounded-full", shimmer)} />
                <div className={cn("h-7 w-20 rounded-full", shimmer)} />
                <div className={cn("h-7 w-28 rounded-full", shimmer)} />
                <div className={cn("h-7 w-16 rounded-full", shimmer)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-5">
        <div className={cn("h-[60px] w-[60px] rounded-full bg-error/10 border-2 border-error/20", shimmer)} />
        <div className={cn("h-[50px] w-[50px] rounded-full bg-warning/10 border-2 border-warning/20", shimmer)} />
        <div className={cn("h-[60px] w-[60px] rounded-full bg-success/10 border-2 border-success/20", shimmer)} />
      </div>
    </div>
  );
}

/** SearchBar placeholder */
function SearchBarSkeleton() {
  return (
    <div className="flex h-12 items-center gap-2 rounded-[9px] border border-line bg-surface px-3">
      <div className={cn("h-5 w-5 rounded-sm", shimmer)} />
      <div className={cn("h-3.5 flex-1 rounded-sm", shimmer)} />
    </div>
  );
}

/** Horizontal row of filter chips */
function FilterChipsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-8 shrink-0 rounded-full",
            i === 0 ? "w-16" : i === 1 ? "w-20" : i === 2 ? "w-14" : i === 3 ? "w-18" : "w-20",
            shimmer
          )}
        />
      ))}
    </div>
  );
}

/** SearchResults two-column layout — filter sidebar + listing grid */
function SearchResultsSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Filter sidebar (desktop only) */}
      <aside className="hidden lg:flex flex-col gap-5 rounded-2xl border border-line bg-surface p-4">
        {Array.from({ length: 3 }, (_, s) => (
          <div key={s} className="flex flex-col gap-2">
            <div className={cn("h-4 w-20 rounded-sm", shimmer)} />
            {Array.from({ length: 4 }, (_, c) => (
              <div key={c} className={cn("h-4 w-3/5 rounded-sm", shimmer)} />
            ))}
          </div>
        ))}
      </aside>
      {/* Results area */}
      <div className="flex flex-col gap-4">
        <div className={cn("h-3 w-24 rounded-sm", shimmer)} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** ListingDetail two-column layout — hero image + thumbnails | details + cards + action bar */
function ListingDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,480px)_1fr]">
      {/* Left: images */}
      <div className="flex flex-col gap-3">
        <div className={cn("aspect-[4/5] rounded-2xl", shimmer)} />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={cn("aspect-[4/3] rounded-xl", shimmer)} />
          ))}
        </div>
      </div>
      {/* Right: details */}
      <div className="flex flex-col gap-5">
        <div className={cn("h-8 w-3/5 rounded-sm", shimmer)} />
        <div className={cn("h-7 w-1/4 rounded-md", shimmer)} />
        <div className="flex items-center gap-1.5">
          <div className={cn("h-4 w-4 rounded-sm", shimmer)} />
          <div className={cn("h-4 w-2/5 rounded-sm", shimmer)} />
        </div>
        <div className="flex gap-2">
          <div className={cn("h-7 w-14 rounded-full", shimmer)} />
          <div className={cn("h-7 w-14 rounded-full", shimmer)} />
          <div className={cn("h-7 w-16 rounded-full", shimmer)} />
        </div>
        {/* About card */}
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className={cn("h-5 w-20 rounded-sm", shimmer)} />
          <div className="mt-3 flex flex-col gap-2">
            <div className={cn("h-4 w-full rounded-sm", shimmer)} />
            <div className={cn("h-4 w-3/5 rounded-sm", shimmer)} />
          </div>
        </div>
        {/* Cost breakdown card */}
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className={cn("h-5 w-32 rounded-sm", shimmer)} />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={cn("h-12 rounded-xl", shimmer)} />
            ))}
          </div>
        </div>
        {/* Action bar */}
        <div className="flex gap-3">
          <div className={cn("h-10 flex-1 rounded-[10px]", shimmer)} />
          <div className={cn("h-10 flex-1 rounded-[10px]", shimmer)} />
        </div>
      </div>
    </div>
  );
}

/** PublicProfile centered layout — avatar xl + details + compatibility + CTA */
function PublicProfileSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {/* Profile header card */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface p-6 shadow-sm text-center">
        <div className={cn("h-[120px] w-[120px] rounded-xl", shimmer)} />
        <div className={cn("h-7 w-24 rounded-sm", shimmer)} />
        <div className={cn("h-4 w-32 rounded-sm", shimmer)} />
        <div className="flex gap-2">
          <div className={cn("h-5 w-16 rounded-full", shimmer)} />
          <div className={cn("h-5 w-16 rounded-full", shimmer)} />
        </div>
      </div>
      {/* Details card */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className={cn("h-4 w-1/4 rounded-sm", shimmer)} />
            <div className={cn("h-4 w-1/5 rounded-sm", shimmer)} />
          </div>
        ))}
      </div>
      {/* Compatibility card */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm flex flex-col gap-3">
        <div className={cn("h-5 w-40 rounded-sm", shimmer)} />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className={cn("h-4 w-1/3 rounded-sm", shimmer)} />
            <div className={cn("h-3 w-8 rounded-sm", shimmer)} />
          </div>
        ))}
      </div>
      {/* CTA button */}
      <div className={cn("h-[52px] w-full rounded-[10px]", shimmer)} />
    </div>
  );
}

/* ─── Main Skeleton dispatcher ─── */

export function Skeleton({ variant = "block", count = 1, className, side, ...props }: SkeletonProps) {
  const items = Array.from({ length: count }, (_, index) => index);

  if (variant === "feed") {
    return (
      <div aria-hidden="true" className={cn("flex flex-col gap-3", className)} {...props}>
        {items.map((item) => (
          <ListingCardSkeleton key={item} />
        ))}
      </div>
    );
  }

  if (variant === "filterChips") {
    return (
      <div aria-hidden="true" className={className} {...props}>
        <FilterChipsSkeleton count={count} />
      </div>
    );
  }

  if (variant === "searchResults") {
    return (
      <div aria-hidden="true" className={className} {...props}>
        <SearchResultsSkeleton />
      </div>
    );
  }

  if (variant === "listingDetail") {
    return (
      <div aria-hidden="true" className={className} {...props}>
        <ListingDetailSkeleton />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={className} {...props}>
      {items.map((item) => {
        switch (variant) {
          case "card":
            return <CardSkeleton key={item} />;
          case "listItem":
            return <ListItemSkeleton key={item} />;
          case "profile":
            return <ProfileSkeleton key={item} />;
          case "listingCard":
            return <ListingCardSkeleton key={item} />;
          case "profileGridCard":
            return <ProfileGridCardSkeleton key={item} />;
          case "menuItemRow":
            return <MenuItemRowSkeleton key={item} />;
          case "notificationCard":
            return <NotificationCardSkeleton key={item} />;
          case "conversationRow":
            return <ConversationRowSkeleton key={item} />;
          case "visitCard":
            return <VisitCardSkeleton key={item} />;
          case "statCard":
            return <StatCardSkeleton key={item} />;
          case "chatMessage":
            return <ChatMessageSkeleton key={item} side={side} />;
          case "swipeCard":
            return <SwipeCardSkeleton key={item} />;
          case "searchBar":
            return <SearchBarSkeleton key={item} />;
          case "publicProfile":
            return <PublicProfileSkeleton key={item} />;
          default:
            return <BlockSkeleton key={item} />;
        }
      })}
    </div>
  );
}
