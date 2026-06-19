import { useMemo, useState } from "react";
import { SeoHelmet, SITE_URL, buildCollectionPageSchema } from "@/lib/seo";
import { useBlogCategories, useBlogPosts, useInfiniteBlogPosts } from "@/hooks/queries";
import { BlogPostCard } from "@/components/molecules/BlogPostCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import type { BlogPostStatus } from "@/lib/api/types";

const breadcrumb = [{ name: "Blog", item: `${SITE_URL}/blog` }];

const STATUS_OPTIONS: Array<{ value: BlogPostStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived", label: "Archived" }
];

export function BlogPage() {
  const [status, setStatus] = useState<BlogPostStatus | "all">("published");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  const { data: categories } = useBlogCategories();
  const filters = useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      category_id: categoryId
    }),
    [status, categoryId]
  );
  const {
    data: firstPage,
    isLoading,
    isError,
    error,
    refetch
  } = useBlogPosts({ ...filters, limit: 12 });
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteBlogPosts(filters);

  const collectionLd = buildCollectionPageSchema({
    name: "Flatmate Living Guides & Tips",
    description:
      "Expert guides on finding compatible flatmates, navigating rental markets, and building harmonious shared living spaces across India.",
    url: `${SITE_URL}/blog`,
    breadcrumb
  });

  // Prefer the infinite-query flat view; fall back to the first-page response.
  const posts = infiniteData
    ? infiniteData.pages.flatMap((page) => page.items)
    : firstPage ?? [];

  return (
    <>
      <SeoHelmet
        title="Flatmate Living Guides & Tips"
        description="Expert guides on finding compatible flatmates, navigating rental markets, and building harmonious shared living spaces across India."
        canonicalUrl={`${SITE_URL}/blog`}
        breadcrumb={breadcrumb}
        jsonLd={collectionLd}
      />

      <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-16 md:px-12">
        <div className="text-center mb-16">
          <p className="text-eyebrow text-accent uppercase tracking-widest">Resources</p>
          <h1 className="mt-4 text-display text-4xl md:text-6xl text-ink font-normal leading-tight tracking-tight max-w-3xl mx-auto">
            Flatmate Living <span className="text-serif-italic text-accent italic font-normal text-5xl md:text-7xl">guides & tips</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-body-lg text-ink-2">
            Expert advice, market insights, and real stories to help you find the perfect flatmate and make shared living work.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {STATUS_OPTIONS.map((option) => {
            const isActive = option.value === status;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                className={`px-4 py-2 rounded-full text-label-md transition-all duration-300 hover:scale-[1.04] active:scale-95 cursor-pointer ${
                  isActive
                    ? "border border-accent bg-accent-soft text-accent shadow-xs"
                    : "border border-line-low bg-paper text-ink-2 hover:border-accent hover:text-accent hover:bg-surface"
                }`}
                style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {categories && categories.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setCategoryId(undefined)}
              className={`px-3 py-1 rounded-full text-label-md border ${
                categoryId === undefined
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line-low bg-surface text-ink-2 hover:border-accent hover:text-accent"
              }`}
            >
              All categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryId(category.id)}
                className={`px-3 py-1 rounded-full text-label-md border ${
                  categoryId === category.id
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line-low bg-surface text-ink-2 hover:border-accent hover:text-accent"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} variant="listingCard" />
            ))}
          </div>
        ) : isError ? (
          <div className="mt-16 text-center">
            <p className="text-h3 text-ink-2 font-semibold">
              Could not load blog posts
            </p>
            <p className="mt-2 text-body-md text-ink-3">
              {error instanceof Error ? error.message : "Try again in a moment."}
            </p>
            <Button className="mt-4" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : posts.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-h3 text-ink-2 font-semibold">No posts yet</p>
            <p className="mt-2 text-body-md text-ink-3">
              Check back soon — new guides land every week.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <BlogPostCard key={post.id} post={post} index={index} />
              ))}
            </div>
            {hasNextPage ? (
              <div className="mt-8 flex items-center justify-center">
                <Button
                  variant="secondary"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Loading…" : "Load more posts"}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </main>
    </>
  );
}
