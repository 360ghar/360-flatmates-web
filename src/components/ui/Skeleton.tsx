import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./component-utils";

export type SkeletonVariant =
  | "block"
  | "listingCard"
  | "searchBar"
  | "filterChips"
  | "listingDetail"
  | "form"
  | "moderationRow";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  count?: number;
  /** For "listingCard": match ListingCard layout prop */
  layout?: "vertical" | "horizontal";
  /** For "form": number of field rows */
  fields?: number;
}

/**
 * Shared shimmer class using the `.shimmer` CSS utility from globals.css
 * (background-size + sweep). Reduced motion disables the animation.
 */
export const shimmer = "shimmer motion-reduce:animate-none";

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

export function ListingCardSkeleton({ layout = "vertical" }: { layout?: "vertical" | "horizontal" }) {
  const isHorizontal = layout === "horizontal";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-hand bg-surface shadow-sm",
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

function SearchBarSkeleton() {
  return (
    <div className="flex h-12 items-center gap-2 rounded-cut-md border border-line bg-surface px-3">
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

function ListingDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,480px)_1fr]">
      <div className="flex flex-col gap-3">
        <div className={cn("aspect-[4/5] rounded-cut-lg", shimmer)} />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={cn("aspect-[4/3] rounded-cut-md", shimmer)} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <div className={cn("h-8 w-3/5 rounded-sm", shimmer)} />
        <div className={cn("h-7 w-1/4 rounded-cut-sm", shimmer)} />
        <div className="flex items-center gap-1.5">
          <div className={cn("h-4 w-4 rounded-sm", shimmer)} />
          <div className={cn("h-4 w-2/5 rounded-sm", shimmer)} />
        </div>
        <div className="flex gap-2">
          <div className={cn("h-7 w-14 rounded-full", shimmer)} />
          <div className={cn("h-7 w-14 rounded-full", shimmer)} />
          <div className={cn("h-7 w-16 rounded-full", shimmer)} />
        </div>
        <div className="rounded-hand bg-surface p-5 shadow-sm">
          <div className={cn("h-5 w-20 rounded-sm", shimmer)} />
          <div className="mt-3 flex flex-col gap-2">
            <div className={cn("h-4 w-full rounded-sm", shimmer)} />
            <div className={cn("h-4 w-3/5 rounded-sm", shimmer)} />
          </div>
        </div>
        <div className="rounded-hand bg-surface p-5 shadow-sm">
          <div className={cn("h-5 w-32 rounded-sm", shimmer)} />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={cn("h-12 rounded-cut-md", shimmer)} />
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <div className={cn("h-10 flex-1 rounded-cut-md", shimmer)} />
          <div className={cn("h-10 flex-1 rounded-cut-md", shimmer)} />
        </div>
      </div>
    </div>
  );
}

function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-cut-md", shimmer)} />
        <div className={cn("h-8 w-40 rounded-sm", shimmer)} />
      </div>
      <div className="flex flex-col gap-4 rounded-hand bg-surface p-5 shadow-sm">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className={cn("h-3 w-20 rounded-sm", shimmer)} />
            <div className={cn("h-12 w-full rounded-cut-md", shimmer)} />
          </div>
        ))}
      </div>
      <div className={cn("h-[52px] w-full rounded-cut-md", shimmer)} />
      <div className={cn("h-[52px] w-full rounded-cut-md", shimmer)} />
    </div>
  );
}

function ModerationRowSkeleton() {
  return (
    <div className="flex gap-3 rounded-hand bg-surface p-4 shadow-sm">
      <div className={cn("h-16 w-16 shrink-0 rounded-cut-md", shimmer)} />
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
          <div className={cn("h-8 w-18 rounded-cut-md", shimmer)} />
          <div className={cn("h-8 w-16 rounded-cut-md", shimmer)} />
          <div className={cn("h-8 w-16 rounded-cut-md", shimmer)} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonRoot({
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

  if (variant === "filterChips") {
    return (
      <SkeletonRoot className={className} {...props}>
        <FilterChipsSkeleton count={count} />
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

  if (variant === "form") {
    return (
      <SkeletonRoot className={className} {...props}>
        <FormSkeleton fields={fields} />
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
          case "listingCard":
            return <ListingCardSkeleton key={item} layout={layout} />;
          case "searchBar":
            return <SearchBarSkeleton key={item} />;
          case "moderationRow":
            return <ModerationRowSkeleton key={item} />;
          default:
            return <BlockSkeleton key={item} />;
        }
      })}
    </SkeletonRoot>
  );
}
