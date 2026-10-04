import { toAppError, userMessage } from "@/lib/api/errors";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { SeoHelmet, SITE_URL, DEFAULT_OG_IMAGE, buildArticleSchema } from "@/lib/seo";
import { useBlogPost, useBlogPreview } from "@/features/blog/hooks/useBlog";
import { Button } from "@/components/ui/Button";
import { ArticleLayout, renderArticleText } from "@/features/blog/components/ArticleLayout";
import { BlogPostSkeleton } from "@/features/blog/components/BlogPostSkeleton";
import { formatMonthYear } from "@/lib/utils/format";

interface BlogPostPageProps {
  /**
   * When true, the page reads the post from `/blog/posts/preview/{token}`
   * (public, no auth). The route is `/:token` from the BlogPreview path.
   */
  previewMode?: boolean;
}

export function BlogPostPage({ previewMode = false }: BlogPostPageProps) {
  const params = useParams<{ id?: string; token?: string; slug?: string }>();
  const navigate = useNavigate();
  // Opened from a shared preview link: Back must stay in the app (W22).
  const location = useLocation();

  const identifier = previewMode
    ? params.token
    : (params.id ?? params.slug);

  const postQuery = useBlogPost(identifier ?? 0);
  const previewQuery = useBlogPreview(identifier ?? "");

  const isLoading = previewMode ? previewQuery.isLoading : postQuery.isLoading;
  const isError = previewMode ? previewQuery.isError : postQuery.isError;
  const error = previewMode ? previewQuery.error : postQuery.error;
  const refetch = previewMode ? previewQuery.refetch : postQuery.refetch;

  const post = useMemo(() => {
    if (previewMode) {
      // Preview response is a flat BlogPost-compatible object
      return previewQuery.data;
    }
    return postQuery.data;
  }, [previewMode, previewQuery.data, postQuery.data]);

  if (isLoading) {
    return (
      <div className="page-container py-12">
        <BlogPostSkeleton className="mx-auto max-w-[760px]" />
      </div>
    );
  }

  if (isError || !post) {
    const notFound = !isError || toAppError(error).type === "not_found";
    return (
      <div className="page-container page-fade py-10">
        <div className="paper-grain mx-auto max-w-[640px] rounded-hand bg-surface py-4 shadow-sm">
          {notFound ? (
            <EmptyState
              scene="magnifier"
              title="This guide is not here"
              description="It may have been removed or the link has expired."
              actionLabel="All guides"
              onAction={() => navigate("/blog")}
            />
          ) : (
            <ErrorState title="Could not load this guide" description={userMessage(error)} onRetry={() => void refetch()} />
          )}
        </div>
        {/* Opened from a shared preview link: Back stays in the app (W22). */}
        <div className="mt-4 flex justify-center">
          <Button variant="tertiary" onClick={() => (location.key === "default" ? navigate("/blog") : navigate(-1))}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  const articleLd = buildArticleSchema({
    headline: post.title,
    description: post.excerpt ?? post.meta_description ?? "",
    image: post.cover_image_url ?? post.og_image_url ?? DEFAULT_OG_IMAGE,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.published_at ?? post.created_at ?? new Date().toISOString()
  });

  return (
    <>
      <SeoHelmet
        title={post.meta_title ?? post.title}
        description={post.meta_description ?? post.excerpt ?? ""}
        canonicalUrl={post.canonical_url ?? `${SITE_URL}/blog/${post.slug}`}
        ogImage={post.og_image_url ?? post.cover_image_url}
        jsonLd={articleLd}
        noindex={previewMode}
      />

      <ArticleLayout
        title={post.title}
        excerpt={post.excerpt}
        topic={post.categories?.[0]?.name}
        meta={[post.published_at ? formatMonthYear(post.published_at) : null, post.reading_time_minutes ? `${post.reading_time_minutes} min read` : null].filter(Boolean).join(" · ")}
        image={post.cover_image_url}
        notice={
          previewMode ? (
            <p className="mb-4 inline-flex rounded-cut-md bg-warning-soft px-3 py-1.5 text-label-md text-warning-ink">Preview: not published yet</p>
          ) : null
        }
      >
        {renderArticleText(post.content)}

        {post.sources && post.sources.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-h3 text-ink">Sources</h2>
            <ul className="mt-3 flex flex-col gap-1.5">
              {post.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-body-lg text-clay underline-offset-4 hover:underline">
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {post.tags && post.tags.length > 0 ? (
          <p className="mt-8 text-body-md text-ink-3">Tagged {post.tags.map((tag) => tag.name).join(", ")}</p>
        ) : null}
      </ArticleLayout>
    </>
  );
}
