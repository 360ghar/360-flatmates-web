import { useMemo, useState } from "react";
import { SeoHelmet, SITE_URL, buildCollectionPageSchema } from "@/lib/seo";
import { useBlogCategories, useBlogPosts, useInfiniteBlogPosts } from "@/features/blog/hooks/useBlog";
import { BlogPostCard } from "@/features/blog/components/BlogPostCard";
import { PaperMiniScene } from "@/components/paper/PaperScene";
import { Button } from "@/components/ui/Button";
import { ChoiceChips } from "@/components/ui/ChoiceChips";
import { PageBand } from "@/components/ui/Layout";
import { BlogCardSkeleton } from "@/features/blog/components/BlogCardSkeleton";
import { EmptyState, InlineError } from "@/components/ui/StateViews";

const breadcrumb = [{ name: "Blog", item: `${SITE_URL}/blog` }];

/** Public guides. Readers only ever see published posts; drafts live in admin. */
export function BlogPage() {
  const [category, setCategory] = useState("all");
  const { data: categories } = useBlogCategories();
  const filters = useMemo(
    () => ({ status: "published" as const, category_id: category === "all" ? undefined : Number(category) }),
    [category]
  );
  const { data: firstPage, isLoading, isError, refetch } = useBlogPosts({ ...filters, limit: 12 });
  const { data: infiniteData, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteBlogPosts(filters);

  const collectionLd = buildCollectionPageSchema({
    name: "Flatmate Living Guides & Tips",
    description:
      "Expert guides on finding compatible flatmates, navigating rental markets, and building harmonious shared living spaces across India.",
    url: `${SITE_URL}/blog`,
    breadcrumb
  });

  // Prefer the infinite-query flat view; fall back to the first-page response.
  const posts = (infiniteData ? infiniteData.pages.flatMap((page) => page?.items ?? []) : Array.isArray(firstPage) ? firstPage : []).filter(Boolean);
  // A malformed response must not take the page down; topics are optional.
  const topics = Array.isArray(categories) ? categories : [];
  const categoryOptions = [{ value: "all", label: "All guides" }, ...topics.map((c) => ({ value: String(c.id), label: c.name }))];

  return (
    <>
      <SeoHelmet
        title="Flatmate Living Guides & Tips"
        description="Expert guides on finding compatible flatmates, navigating rental markets, and building harmonious shared living spaces across India."
        canonicalUrl={`${SITE_URL}/blog`}
        breadcrumb={breadcrumb}
        jsonLd={collectionLd}
      />

      <PageBand
        title="Guides for shared living"
        description="How to pick a flatmate, read a rent agreement and split the bills without a fight."
        aside={<PaperMiniScene prop="chat" />}
      />

      <div className="page-container page-fade flex flex-col gap-8 py-10 md:py-14">
        {topics.length > 0 ? (
          <ChoiceChips label="Guide topics" options={categoryOptions} value={category} onValueChange={setCategory} />
        ) : null}

        {isLoading ? (
          <BlogCardSkeleton count={6} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" />
        ) : isError ? (
          <InlineError title="Could not load the guides" description="Check your connection and try again." onRetry={() => refetch()} />
        ) : posts.length === 0 ? (
          <div className="paper-grain rounded-hand bg-surface py-6 shadow-xs">
            <EmptyState scene="chat" title="No guides here yet" description="New guides go up every week. Try another topic." />
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <BlogPostCard key={post.id} post={post} index={index} />
              ))}
            </div>
            {hasNextPage ? (
              <div className="flex justify-center">
                <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
                  More guides
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
