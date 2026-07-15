import type { HTMLAttributes, ReactNode } from "react";
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
  | "publicProfile"
  | "blogCard"
  | "blogPost"
  | "homeFeed"
  | "mapExplore"
  | "chatThread"
  | "profilePage"
  | "form"
  | "savedSearchCard"
  | "alertCard"
  | "paymentMethodRow"
  | "compatibility"
  | "dashboardPanel"
  | "moderationRow";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  count?: number;
  /** For "chatMessage" variant: which side the bubble is on */
  side?: "left" | "right";
  /** For "listingCard": match ListingCard layout prop */
  layout?: "vertical" | "horizontal";
  /** For "form": number of field rows */
  fields?: number;
}

/**
 * Shared shimmer class using the `.shimmer` CSS utility from globals.css
 * (background-size + sweep). Reduced motion disables the animation.
 */
const shimmer = "shimmer motion-reduce:animate-none";

const rootA11y = {
  role: "status" as const,
  "aria-busy": true as const,
  "aria-label": "Loading",
};

/* ─── Primitive building blocks ─── */

function BlockSkeleton({ className }: { className?: string }) {
  // cn() does not twMerge — avoid default h-4 when caller supplies an h-* class.
  const hasHeight = Boolean(className && /\bh-\[|\bh-\d|\bh-full|\bh-auto|\bh-px|\bh-screen/.test(className));
  return (
    <div
      aria-hidden="true"
      className={cn(!hasHeight && "h-4", "rounded-full", shimmer, className)}
    />
  );
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
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className={cn("aspect-[20/19] w-full", shimmer)} />
      <div className="flex flex-col gap-2 p-3.5">
        <BlockSkeleton className="h-4 w-1/4" />
        <BlockSkeleton className="h-4 w-4/5" />
        <BlockSkeleton className="h-3 w-3/5" />
        <div className="flex gap-1.5">
          <div className={cn("h-5 w-14 rounded-full", shimmer)} />
          <div className={cn("h-5 w-14 rounded-full", shimmer)} />
          <div className={cn("h-5 w-16 rounded-full", shimmer)} />
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

/* ─── Design-accurate molecule variants ─── */

/** Matches ListingCard — full-bleed media card, vertical or horizontal */
function ListingCardSkeleton({ layout = "vertical" }: { layout?: "vertical" | "horizontal" }) {
  const isHorizontal = layout === "horizontal";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-surface shadow-sm",
        isHorizontal ? "grid gap-0 lg:grid-cols-[200px_minmax(0,1fr)]" : "flex flex-col"
      )}
    >
      <div
        className={cn(
          "bg-surface-soft",
          isHorizontal
            ? "aspect-[4/3] lg:aspect-auto lg:min-h-[160px]"
            : "aspect-[20/19] w-full",
          shimmer
        )}
      />
      <div className={cn("flex min-w-0 flex-1 flex-col gap-2 bg-surface", isHorizontal ? "p-3.5" : "p-3.5 pt-3")}>
        <div className={cn("h-4 w-1/4 rounded-sm", shimmer)} />
        <div className={cn("h-4 w-4/5 rounded-sm", shimmer)} />
        <div className="flex items-center gap-1">
          <div className={cn("h-3.5 w-3.5 shrink-0 rounded-sm", shimmer)} />
          <div className={cn("h-3 w-2/5 rounded-sm", shimmer)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <div className={cn("h-5 w-14 rounded-full", shimmer)} />
          <div className={cn("h-5 w-14 rounded-full", shimmer)} />
          <div className={cn("h-5 w-16 rounded-full", shimmer)} />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="flex min-w-0 items-center gap-2">
            <div className={cn("h-8 w-8 shrink-0 rounded-full", shimmer)} />
            <div className={cn("h-3 w-16 rounded-sm", shimmer)} />
          </div>
          <div className={cn("h-8 w-20 shrink-0 rounded-full", shimmer)} />
        </div>
      </div>
    </div>
  );
}

/** Matches ProfileGridCard compact default — 3:4 photo + match ring + CTA */
function ProfileGridCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="relative">
        <div className={cn("aspect-[3/4] w-full", shimmer)} />
        <div className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface/95 p-0.5 shadow-xs" />
      </div>
      <div className="bg-surface p-2.5">
        <div className={cn("h-[15px] w-3/5 rounded-sm", shimmer)} />
        <div className={cn("mt-0.5 h-3 w-2/5 rounded-sm", shimmer)} />
        <div className={cn("mt-0.5 h-3 w-1/3 rounded-sm", shimmer)} />
        <div className={cn("mt-2 h-9 w-full rounded-full", shimmer)} />
      </div>
    </div>
  );
}

/** Matches MenuItemRow — icon container + label + chevron */
function MenuItemRowSkeleton() {
  return (
    <div className="flex h-14 items-center gap-3 border-b border-line px-2 py-2 last:border-b-0">
      <div className={cn("h-10 w-10 shrink-0 rounded-xl", shimmer)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className={cn("h-[15px] w-2/5 rounded-sm", shimmer)} />
      </div>
      <div className={cn("h-5 w-5 shrink-0 rounded-sm", shimmer)} />
    </div>
  );
}

/** Matches NotificationCard */
function NotificationCardSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className={cn("h-12 w-12 shrink-0 rounded-full", shimmer)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
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

/** Matches ConversationRow */
function ConversationRowSkeleton() {
  return (
    <div className="flex min-h-[72px] items-center gap-3 rounded-[8px] px-3 py-2">
      <div className={cn("h-[52px] w-[52px] shrink-0 rounded-xl", shimmer)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
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

/** Matches VisitCard */
function VisitCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex gap-3">
        <div className={cn("h-14 w-14 shrink-0 rounded-xl", shimmer)} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
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

/** Matches StatCard */
function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className={cn("h-12 w-12 shrink-0 rounded-xl", shimmer)} />
        <div className="flex min-w-0 flex-col gap-2">
          <div className={cn("h-3 w-16 rounded-sm", shimmer)} />
          <div className={cn("h-8 w-20 rounded-md", shimmer)} />
          <div className={cn("h-3 w-24 rounded-sm", shimmer)} />
        </div>
      </div>
    </div>
  );
}

/** Matches ChatMessageBubble — left or right */
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
 * Matches SwipeDeck card — mobile portrait stack, md+ side-by-side, + action bar
 */
function SwipeCardSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 md:max-w-3xl lg:max-w-4xl">
      <div className="relative h-[calc(100dvh-328px)] md:h-[calc(100dvh-268px)]">
        <div className="md:hidden">
          <div className="absolute inset-x-4 top-4 h-full translate-y-3 scale-90 rounded-2xl border border-line bg-surface opacity-30 shadow-sm" />
          <div className="absolute inset-x-2 top-2 h-full translate-y-[6px] scale-[0.95] rounded-2xl border border-line bg-surface opacity-50 shadow-sm" />
          <div className="absolute inset-0 overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
            <div className={cn("absolute inset-0", shimmer)} />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-ink/80 to-transparent p-5 pt-20">
              <div className={cn("h-8 w-3/5 rounded-md", shimmer)} />
              <div className="mt-1 flex items-center gap-1.5">
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

        <div className="absolute inset-0 hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-lg md:flex">
          <div className={cn("relative h-full w-[40%] shrink-0 lg:w-[45%]", shimmer)}>
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-ink/80 to-transparent p-4 pt-20">
              <div className={cn("h-7 w-3/5 rounded-md", shimmer)} />
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded-sm bg-white/20" />
                <div className={cn("h-4 w-1/2 rounded-sm", shimmer)} />
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col space-y-6 px-5 py-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 border-b border-line/45 pb-5">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className={cn("h-3 w-1/2 rounded-sm", shimmer)} />
                  <div className={cn("h-4 w-3/4 rounded-sm", shimmer)} />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className={cn("h-5 w-24 rounded-md", shimmer)} />
              <div className={cn("h-4 w-full rounded-sm", shimmer)} />
              <div className={cn("h-4 w-11/12 rounded-sm", shimmer)} />
              <div className={cn("h-4 w-4/5 rounded-sm", shimmer)} />
            </div>
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

      <div className="flex items-center justify-center gap-5">
        <div className={cn("h-[60px] w-[60px] rounded-full border-2 border-error/20 bg-error/10", shimmer)} />
        <div className={cn("h-[50px] w-[50px] rounded-full border-2 border-warning/20 bg-warning/10", shimmer)} />
        <div className={cn("h-[60px] w-[60px] rounded-full border-2 border-success/20 bg-success/10", shimmer)} />
      </div>
    </div>
  );
}

function SearchBarSkeleton() {
  return (
    <div className="flex h-12 items-center gap-2 rounded-[8px] border border-line bg-surface px-3">
      <div className={cn("h-5 w-5 rounded-sm", shimmer)} />
      <div className={cn("h-3.5 flex-1 rounded-sm", shimmer)} />
    </div>
  );
}

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

function SearchResultsSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden flex-col gap-5 rounded-2xl border border-line bg-surface p-4 lg:flex">
        {Array.from({ length: 3 }, (_, s) => (
          <div key={s} className="flex flex-col gap-2">
            <div className={cn("h-4 w-20 rounded-sm", shimmer)} />
            {Array.from({ length: 4 }, (_, c) => (
              <div key={c} className={cn("h-4 w-3/5 rounded-sm", shimmer)} />
            ))}
          </div>
        ))}
      </aside>
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

function ListingDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,480px)_1fr]">
      <div className="flex flex-col gap-3">
        <div className={cn("aspect-[4/5] rounded-2xl", shimmer)} />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={cn("aspect-[4/3] rounded-xl", shimmer)} />
          ))}
        </div>
      </div>
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
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className={cn("h-5 w-20 rounded-sm", shimmer)} />
          <div className="mt-3 flex flex-col gap-2">
            <div className={cn("h-4 w-full rounded-sm", shimmer)} />
            <div className={cn("h-4 w-3/5 rounded-sm", shimmer)} />
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className={cn("h-5 w-32 rounded-sm", shimmer)} />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={cn("h-12 rounded-xl", shimmer)} />
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <div className={cn("h-10 flex-1 rounded-[8px]", shimmer)} />
          <div className={cn("h-10 flex-1 rounded-[8px]", shimmer)} />
        </div>
      </div>
    </div>
  );
}

function PublicProfileSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface p-6 text-center shadow-sm">
        <div className={cn("h-[120px] w-[120px] rounded-xl", shimmer)} />
        <div className={cn("h-7 w-24 rounded-sm", shimmer)} />
        <div className={cn("h-4 w-32 rounded-sm", shimmer)} />
        <div className="flex gap-2">
          <div className={cn("h-5 w-16 rounded-full", shimmer)} />
          <div className={cn("h-5 w-16 rounded-full", shimmer)} />
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-sm">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className={cn("h-4 w-1/4 rounded-sm", shimmer)} />
            <div className={cn("h-4 w-1/5 rounded-sm", shimmer)} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className={cn("h-5 w-40 rounded-sm", shimmer)} />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className={cn("h-4 w-1/3 rounded-sm", shimmer)} />
            <div className={cn("h-3 w-8 rounded-sm", shimmer)} />
          </div>
        ))}
      </div>
      <div className={cn("h-[52px] w-full rounded-[8px]", shimmer)} />
    </div>
  );
}

/* ─── New page-level variants ─── */

/** Matches BlogPostCard */
function BlogCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line-low bg-surface shadow-sm">
      <div className={cn("h-56 w-full", shimmer)} />
      <div className="flex flex-1 flex-col p-6">
        <div className={cn("h-6 w-4/5 rounded-sm", shimmer)} />
        <div className={cn("mt-1 h-6 w-3/5 rounded-sm", shimmer)} />
        <div className="mt-3 flex flex-col gap-2">
          <div className={cn("h-4 w-full rounded-sm", shimmer)} />
          <div className={cn("h-4 w-11/12 rounded-sm", shimmer)} />
          <div className={cn("h-4 w-2/3 rounded-sm", shimmer)} />
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-line-low pt-4">
          <div className="flex gap-4">
            <div className={cn("h-3.5 w-20 rounded-sm", shimmer)} />
            <div className={cn("h-3.5 w-16 rounded-sm", shimmer)} />
          </div>
          <div className={cn("h-3.5 w-12 rounded-sm", shimmer)} />
        </div>
      </div>
    </div>
  );
}

/** Blog article loading layout */
function BlogPostSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className={cn("h-8 w-24 rounded-[8px]", shimmer)} />
      <div className={cn("h-10 w-3/4 rounded-sm", shimmer)} />
      <div className={cn("h-5 w-1/2 rounded-sm", shimmer)} />
      <div className={cn("mt-2 h-72 w-full rounded-2xl", shimmer)} />
      <div className="mt-2 flex flex-col gap-3">
        <div className={cn("h-4 w-full rounded-sm", shimmer)} />
        <div className={cn("h-4 w-full rounded-sm", shimmer)} />
        <div className={cn("h-4 w-5/6 rounded-sm", shimmer)} />
        <div className={cn("h-4 w-2/3 rounded-sm", shimmer)} />
        <div className={cn("mt-2 h-4 w-full rounded-sm", shimmer)} />
        <div className={cn("h-4 w-4/5 rounded-sm", shimmer)} />
      </div>
    </div>
  );
}

const HOME_FEED_SKELETON_SECTIONS: Array<{ key: string; card: "profile" | "listing" }> = [
  { key: "recommended", card: "profile" },
  { key: "listings", card: "listing" },
  { key: "nearby", card: "profile" },
];

/**
 * Home feed sections only (hero + real SearchBar/chips stay outside).
 * Fixed-width carousel cards match loaded Home sections.
 */
function HomeFeedSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {HOME_FEED_SKELETON_SECTIONS.map((section) => (
        <section key={section.key} className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className={cn("h-4 w-32 rounded-full", shimmer)} />
            <div className={cn("h-3 w-14 rounded-full", shimmer)} />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="w-[180px] shrink-0 sm:w-[200px] md:w-[220px] lg:w-auto"
              >
                {section.card === "listing" ? <ListingCardSkeleton /> : <ProfileGridCardSkeleton />}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Full-bleed map placeholder with FABs */
function MapExploreSkeleton() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-surface-soft">
      <div className="map-grid-bg absolute inset-0 opacity-60" />
      <div className={cn("absolute inset-0 opacity-40", shimmer)} />
      {/* Soft pin dots */}
      <div className="absolute left-[28%] top-[38%] h-3 w-3 rounded-full bg-accent/30" />
      <div className="absolute left-[55%] top-[48%] h-3 w-3 rounded-full bg-accent/25" />
      <div className="absolute left-[42%] top-[62%] h-3 w-3 rounded-full bg-accent/20" />
      <div className="absolute bottom-6 right-6 flex flex-col gap-3">
        <div className={cn("h-12 w-12 rounded-full border border-line bg-surface shadow-sm", shimmer)} />
        <div className={cn("h-12 w-12 rounded-full border border-line bg-surface shadow-sm", shimmer)} />
      </div>
    </div>
  );
}

/** Chat detail: header + messages + composer */
function ChatThreadSkeleton() {
  return (
    <div className="flex h-full min-h-[50vh] flex-col">
      <div className="flex items-center gap-3 border-b border-line px-3 py-3">
        <div className={cn("h-[52px] w-[52px] shrink-0 rounded-xl", shimmer)} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className={cn("h-4 w-28 rounded-sm", shimmer)} />
          <div className={cn("h-3 w-20 rounded-sm", shimmer)} />
        </div>
        <div className="flex gap-2">
          <div className={cn("h-9 w-9 rounded-[8px]", shimmer)} />
          <div className={cn("h-9 w-9 rounded-[8px]", shimmer)} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ChatMessageSkeleton side="left" />
        <ChatMessageSkeleton side="right" />
        <ChatMessageSkeleton side="left" />
        <ChatMessageSkeleton side="right" />
      </div>
      <div className="flex items-center gap-2 border-t border-line px-3 py-3">
        <div className={cn("h-5 w-5 rounded-sm", shimmer)} />
        <div className={cn("h-10 flex-1 rounded-[8px]", shimmer)} />
        <div className={cn("h-8 w-8 rounded-[8px]", shimmer)} />
      </div>
    </div>
  );
}

/** Profile settings page */
function ProfilePageSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-6 text-center shadow-sm">
        <div className={cn("h-[120px] w-[120px] rounded-xl", shimmer)} />
        <div className={cn("h-7 w-24 rounded-sm", shimmer)} />
        <div className={cn("h-4 w-32 rounded-sm", shimmer)} />
        <div className="flex gap-2">
          <div className={cn("h-5 w-16 rounded-full", shimmer)} />
          <div className={cn("h-5 w-16 rounded-full", shimmer)} />
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <MenuItemRowSkeleton />
      </div>
      <div className={cn("h-3 w-14 rounded-sm", shimmer)} />
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <MenuItemRowSkeleton />
        <MenuItemRowSkeleton />
      </div>
      <div className={cn("h-3 w-20 rounded-sm", shimmer)} />
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <MenuItemRowSkeleton />
      </div>
      <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <div className={cn("h-5 w-16 rounded-sm", shimmer)} />
          <div className={cn("h-3 w-32 rounded-sm", shimmer)} />
        </div>
        <div className={cn("h-8 w-14 rounded-full", shimmer)} />
      </div>
      <div className={cn("h-3 w-24 rounded-sm", shimmer)} />
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <MenuItemRowSkeleton />
        <MenuItemRowSkeleton />
      </div>
      <div className={cn("h-3 w-16 rounded-sm", shimmer)} />
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <MenuItemRowSkeleton />
        <MenuItemRowSkeleton />
      </div>
    </div>
  );
}

/** Generic form page: optional header bones + field rows + CTAs */
function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-[8px]", shimmer)} />
        <div className={cn("h-8 w-40 rounded-sm", shimmer)} />
      </div>
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className={cn("h-3 w-20 rounded-sm", shimmer)} />
            <div className={cn("h-12 w-full rounded-[8px]", shimmer)} />
          </div>
        ))}
      </div>
      <div className={cn("h-[52px] w-full rounded-[8px]", shimmer)} />
      <div className={cn("h-[52px] w-full rounded-[8px]", shimmer)} />
    </div>
  );
}

/** Saved search list card (title, filter chips, actions) */
function SavedSearchCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className={cn("h-4 w-28 rounded-sm", shimmer)} />
            <div className={cn("h-5 w-16 rounded-full", shimmer)} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <div className={cn("h-6 w-14 rounded-full", shimmer)} />
            <div className={cn("h-6 w-16 rounded-full", shimmer)} />
            <div className={cn("h-6 w-12 rounded-full", shimmer)} />
          </div>
          <div className={cn("h-3 w-24 rounded-sm", shimmer)} />
        </div>
        <div className="flex shrink-0 gap-2">
          <div className={cn("h-9 w-9 rounded-[8px]", shimmer)} />
          <div className={cn("h-9 w-9 rounded-[8px]", shimmer)} />
        </div>
      </div>
    </div>
  );
}

/** Alert list card (name, meta lines, actions — no filter chips) */
function AlertCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className={cn("h-4 w-28 rounded-sm", shimmer)} />
            <div className={cn("h-5 w-14 rounded-full", shimmer)} />
          </div>
          <div className={cn("h-3 w-24 rounded-sm", shimmer)} />
          <div className={cn("h-3 w-20 rounded-sm", shimmer)} />
        </div>
        <div className="flex shrink-0 gap-2">
          <div className={cn("h-9 w-9 rounded-[8px]", shimmer)} />
          <div className={cn("h-9 w-9 rounded-[8px]", shimmer)} />
        </div>
      </div>
    </div>
  );
}

/** Payment method / blocked user list row */
function PaymentMethodRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className={cn("h-9 w-9 shrink-0 rounded-full", shimmer)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className={cn("h-4 w-32 rounded-sm", shimmer)} />
        <div className={cn("h-3 w-20 rounded-sm", shimmer)} />
      </div>
      <div className={cn("h-8 w-20 shrink-0 rounded-full", shimmer)} />
    </div>
  );
}

/** Compatibility breakdown */
function CompatibilitySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface p-6 text-center shadow-sm">
        <div className={cn("h-28 w-28 rounded-full", shimmer)} />
        <div className={cn("h-5 w-24 rounded-full", shimmer)} />
        <div className={cn("h-4 w-48 rounded-full", shimmer)} />
      </div>
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className={cn("h-5 w-24 rounded-full", shimmer)} />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className={cn("h-4 w-32 rounded-full", shimmer)} />
            <div className={cn("h-2 w-full rounded-full", shimmer)} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className={cn("h-5 w-20 rounded-full", shimmer)} />
        <div className={cn("h-4 w-full rounded-full", shimmer)} />
        <div className={cn("h-4 w-4/5 rounded-full", shimmer)} />
      </div>
    </div>
  );
}

/** Dashboard / analytics: stats + table */
function DashboardPanelSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className={cn("mb-4 h-5 w-32 rounded-sm", shimmer)} />
        <div className="mb-3 flex gap-4 border-b border-line pb-2">
          <div className={cn("h-3 w-20 rounded-sm", shimmer)} />
          <div className={cn("h-3 w-10 rounded-sm", shimmer)} />
          <div className={cn("h-3 w-10 rounded-sm", shimmer)} />
          <div className={cn("h-3 w-10 rounded-sm", shimmer)} />
        </div>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line py-3 last:border-b-0">
            <div className={cn("h-4 w-24 rounded-sm", shimmer)} />
            <div className={cn("ml-auto h-4 w-8 rounded-sm", shimmer)} />
            <div className={cn("h-4 w-8 rounded-sm", shimmer)} />
            <div className={cn("h-4 w-12 rounded-sm", shimmer)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Admin moderation list row */
function ModerationRowSkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className={cn("h-16 w-16 shrink-0 rounded-xl", shimmer)} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className={cn("h-5 w-3/5 rounded-sm", shimmer)} />
            <div className={cn("h-3 w-2/5 rounded-sm", shimmer)} />
          </div>
          <div className={cn("h-5 w-16 shrink-0 rounded-full", shimmer)} />
        </div>
        <div className={cn("h-4 w-1/5 rounded-sm", shimmer)} />
        <div className="flex gap-2 pt-1">
          <div className={cn("h-8 w-18 rounded-[8px]", shimmer)} />
          <div className={cn("h-8 w-16 rounded-[8px]", shimmer)} />
          <div className={cn("h-8 w-16 rounded-[8px]", shimmer)} />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Skeleton dispatcher ─── */

function SkeletonRoot({
  className,
  children,
  announce = true,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; announce?: boolean }) {
  if (!announce) {
    return (
      <div aria-hidden="true" className={className} {...props}>
        {children}
      </div>
    );
  }
  // Spread props first so a11y loading contract cannot be overridden accidentally.
  return (
    <div className={className} {...props} {...rootA11y}>
      {children}
    </div>
  );
}

/** Variants that are leaf bones — size comes from className on the shimmer itself */
const LEAF_VARIANTS = new Set<SkeletonVariant>(["block"]);

export function Skeleton({
  variant = "block",
  count = 1,
  className,
  side,
  layout = "vertical",
  fields = 4,
  ...props
}: SkeletonProps) {
  const items = Array.from({ length: count }, (_, index) => index);

  // Leaf bone: className sizes the shimmer element directly (e.g. h-8 w-28)
  if (LEAF_VARIANTS.has(variant)) {
    if (count === 1) {
      return <BlockSkeleton className={className} {...props} />;
    }
    return (
      <div aria-hidden="true" className={cn("flex flex-col gap-2", className)} {...props}>
        {items.map((item) => (
          <BlockSkeleton key={item} />
        ))}
      </div>
    );
  }

  if (variant === "feed") {
    return (
      <SkeletonRoot className={cn("flex flex-col gap-3", className)} {...props}>
        {items.map((item) => (
          <ListingCardSkeleton key={item} />
        ))}
      </SkeletonRoot>
    );
  }

  if (variant === "homeFeed") {
    return (
      <SkeletonRoot className={className} {...props}>
        <HomeFeedSkeleton />
      </SkeletonRoot>
    );
  }

  if (variant === "filterChips") {
    return (
      <SkeletonRoot className={className} {...props}>
        <FilterChipsSkeleton count={count} />
      </SkeletonRoot>
    );
  }

  if (variant === "searchResults") {
    return (
      <SkeletonRoot className={className} {...props}>
        <SearchResultsSkeleton />
      </SkeletonRoot>
    );
  }

  if (variant === "listingDetail") {
    return (
      <SkeletonRoot className={className} {...props}>
        <ListingDetailSkeleton />
      </SkeletonRoot>
    );
  }

  if (variant === "mapExplore") {
    return (
      <SkeletonRoot className={cn("h-full w-full", className)} {...props}>
        <MapExploreSkeleton />
      </SkeletonRoot>
    );
  }

  if (variant === "chatThread") {
    return (
      <SkeletonRoot className={className} {...props}>
        <ChatThreadSkeleton />
      </SkeletonRoot>
    );
  }

  if (variant === "profilePage") {
    return (
      <SkeletonRoot className={className} {...props}>
        <ProfilePageSkeleton />
      </SkeletonRoot>
    );
  }

  if (variant === "form") {
    return (
      <SkeletonRoot className={className} {...props}>
        <FormSkeleton fields={fields} />
      </SkeletonRoot>
    );
  }

  if (variant === "blogPost") {
    return (
      <SkeletonRoot className={className} {...props}>
        <BlogPostSkeleton />
      </SkeletonRoot>
    );
  }

  if (variant === "compatibility") {
    return (
      <SkeletonRoot className={className} {...props}>
        <CompatibilitySkeleton />
      </SkeletonRoot>
    );
  }

  if (variant === "dashboardPanel") {
    return (
      <SkeletonRoot className={className} {...props}>
        <DashboardPanelSkeleton />
      </SkeletonRoot>
    );
  }

  if (variant === "publicProfile") {
    return (
      <SkeletonRoot className={className} {...props}>
        <PublicProfileSkeleton />
      </SkeletonRoot>
    );
  }

  // Multi-item lists: caller className owns layout (grid / flex / gap).
  // Default stack with gap only when no className is provided.
  const multiClass =
    count > 1 && !className
      ? "flex flex-col gap-3"
      : className;

  return (
    <SkeletonRoot className={multiClass} {...props}>
      {items.map((item) => {
        switch (variant) {
          case "card":
            return <CardSkeleton key={item} />;
          case "listItem":
            return <ListItemSkeleton key={item} />;
          case "profile":
            return <ProfileSkeleton key={item} />;
          case "listingCard":
            return <ListingCardSkeleton key={item} layout={layout} />;
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
          case "blogCard":
            return <BlogCardSkeleton key={item} />;
          case "savedSearchCard":
            return <SavedSearchCardSkeleton key={item} />;
          case "alertCard":
            return <AlertCardSkeleton key={item} />;
          case "paymentMethodRow":
            return <PaymentMethodRowSkeleton key={item} />;
          case "moderationRow":
            return <ModerationRowSkeleton key={item} />;
          default:
            return <BlockSkeleton key={item} />;
        }
      })}
    </SkeletonRoot>
  );
}
