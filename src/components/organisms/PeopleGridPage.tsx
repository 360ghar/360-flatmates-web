import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProfileGridCard } from "@/components/molecules/ProfileGridCard";

import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView, EmptyState } from "@/components/ui/StateViews";

export interface PeopleGridPageProps<T> {
  title: string;
  subtitle: string;
  /** Standard non-paginated query OR an infinite query returning cursor pages. */
  query: {
    data: T[] | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  } | {
    data: { pages: Array<{ items: T[] }> } | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
    fetchNextPage?: () => void;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
  };
  emptyTitle: string;
  emptyDescription: string;
  ctaLabel: string;
  getPeerId: (item: T) => string;
  getProfileProps: (item: T) => React.ComponentProps<typeof ProfileGridCard>["profile"];
  /** Primary CTA (e.g. "Match" / "Chat"). Receives the source item. */
  onCta?: (item: T) => void;
  /** Optional secondary action (e.g. "Unmatch"). Receives the source item. */
  onUnmatch?: (item: T) => void;
}

type InfiniteQuery<T> = {
  data: { pages: Array<{ items: T[] }> } | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
};

function isInfiniteQuery<T>(q: PeopleGridPageProps<T>["query"]): q is InfiniteQuery<T> {
  return (q as InfiniteQuery<T>).fetchNextPage !== undefined;
}

export function PeopleGridPage<T>({
  title,
  subtitle,
  query,
  emptyTitle,
  emptyDescription,
  ctaLabel,
  getPeerId,
  getProfileProps,
  onCta,
  onUnmatch,
}: PeopleGridPageProps<T>) {
  const navigate = useNavigate();

  const flatItems: T[] = useMemo(() => {
    if (isInfiniteQuery<T>(query)) {
      return query.data?.pages.flatMap((page) => page.items) ?? [];
    }
    return query.data ?? [];
  }, [query]);

  const fetchNextPage = isInfiniteQuery<T>(query) ? query.fetchNextPage : undefined;
  const hasNextPage = isInfiniteQuery<T>(query) ? query.hasNextPage : undefined;
  const isFetchingNextPage = isInfiniteQuery<T>(query) ? query.isFetchingNextPage : undefined;

  // IntersectionObserver sentinel for auto-loading the next page.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = sentinelRef.current;
    if (!element || !fetchNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="flex flex-col gap-5 page-fade">
      <div className="flex items-center gap-3">
        <Button variant="icon" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h1 className="text-h1">{title}</h1>
      </div>

      <p className="text-body-md text-ink-2">{subtitle}</p>

      <AsyncView
        data={flatItems}
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={(data) => data.length === 0}
        loading={<Skeleton variant="profileGridCard" count={6} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" />}
        empty={
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
          />
        }
        onRetry={() => query.refetch()}
      >
        {(data) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((item, i) => {
                const peerId = getPeerId(item);
                const profile = getProfileProps(item);
                return (
                  <div
                    key={peerId}
                    className="card-appear"
                    style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}
                  >
                    <ProfileGridCard
                      profile={profile}
                      ctaLabel={ctaLabel}
                      onOpen={(id) => navigate(`/profile/${id}`)}
                      onMatch={onCta ? () => onCta(item) : undefined}
                    />
                    {onUnmatch ? (
                      <button
                        type="button"
                        onClick={() => onUnmatch(item)}
                        className="mt-2 w-full text-caption text-ink-3 hover:text-accent transition-colors"
                      >
                        Unmatch
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {fetchNextPage ? (
              <div
                ref={sentinelRef}
                className="mt-6 flex justify-center"
                aria-live="polite"
                aria-busy={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2 text-ink-3">
                    <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" />
                    <span className="text-body-sm">Loading more…</span>
                  </div>
                ) : hasNextPage ? (
                  <Button
                    variant="secondary"
                    size="compact"
                    onClick={() => fetchNextPage()}
                  >
                    Load more
                  </Button>
                ) : data.length > 0 ? (
                  <span className="text-body-sm text-ink-3">You&apos;ve reached the end.</span>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </AsyncView>
    </div>
  );
}
