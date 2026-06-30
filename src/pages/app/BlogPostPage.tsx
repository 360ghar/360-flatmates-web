import { useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { SeoHelmet, SITE_URL, DEFAULT_OG_IMAGE, buildArticleSchema } from "@/lib/seo";
import { useBlogPost, useBlogPreview } from "@/hooks/queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { Skeleton } from "@/components/ui/Skeleton";

interface BlogPostPageProps {
  /**
   * When true, the page reads the post from `/blog/posts/preview/{token}`
   * (public, no auth). The route is `/:token` from the BlogPreview path.
   */
  previewMode?: boolean;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric"
    });
  } catch {
    return "";
  }
}

export function BlogPostPage({ previewMode = false }: BlogPostPageProps) {
  const params = useParams<{ id?: string; token?: string; slug?: string }>();
  const navigate = useNavigate();

  const identifier = previewMode
    ? params.token
    : (params.id ?? params.slug);

  const postQuery = useBlogPost(identifier ?? 0);
  const previewQuery = useBlogPreview(identifier ?? "");

  const isLoading = previewMode ? previewQuery.isLoading : postQuery.isLoading;
  const isError = previewMode ? previewQuery.isError : postQuery.isError;
  const error = previewMode ? previewQuery.error : postQuery.error;

  const post = useMemo(() => {
    if (previewMode) {
      // Preview response is a flat BlogPost-compatible object
      return previewQuery.data;
    }
    return postQuery.data;
  }, [previewMode, previewQuery.data, postQuery.data]);

  if (isLoading) {
    return (
      <div className="page-fade mx-auto max-w-3xl px-5 py-12">
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Skeleton className="h-72 w-full mb-6 rounded-2xl" />
        <Skeleton className="h-4 w-full mb-3" />
        <Skeleton className="h-4 w-5/6 mb-3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="page-fade mx-auto max-w-3xl px-5 py-12">
        <Button
          variant="icon"
          size="compact"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4 mr-1" /> Back
        </Button>
        <Card className="p-8 text-center">
          <p className="text-h3 text-ink-2 font-semibold">Post not found</p>
          <p className="mt-2 text-body-md text-ink-3">
            {error instanceof Error ? error.message : "The post may have been removed."}
          </p>
          <Button className="mt-4" onClick={() => navigate("/blog")}>
            Back to blog
          </Button>
        </Card>
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

      <main id="main" className="page-fade mx-auto max-w-3xl px-5 py-12">
        <Button
          variant="icon"
          size="compact"
          onClick={() => navigate("/blog")}
          className="mb-6"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4 mr-1" /> Back to blog
        </Button>

        {previewMode ? (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-label-md text-amber-900">
            Preview mode
          </div>
        ) : null}

        <h1 className="text-h1 text-ink font-serif font-normal">{post.title}</h1>

        {post.excerpt ? (
          <p className="mt-4 text-body-lg text-ink-2 leading-relaxed">
            {post.excerpt}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-4 text-label-md text-ink-3">
          {post.published_at ? (
            <span className="flex items-center gap-1.5">
              <Calendar aria-hidden="true" className="h-3.5 w-3.5" />
              {formatDate(post.published_at)}
            </span>
          ) : null}
          {post.reading_time_minutes ? (
            <span className="flex items-center gap-1.5">
              <Clock aria-hidden="true" className="h-3.5 w-3.5" />
              {post.reading_time_minutes} min read
            </span>
          ) : null}
        </div>

        {post.cover_image_url ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-line-low">
            <NetworkImage
              src={post.cover_image_url}
              alt={post.title}
              className="h-auto w-full object-cover"
              width={1200}
              height={600}
              loading="eager"
              decoding="async"
            />
          </div>
        ) : null}

        <article className="prose prose-neutral mt-10 max-w-none text-ink-2">
          {post.content
            .split("\n\n")
            .filter((paragraph) => paragraph.trim().length > 0)
            .map((paragraph, index) => (
              <p key={index} className="text-body-md leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
        </article>

        {post.sources && post.sources.length > 0 ? (
          <section className="mt-12 border-t border-line pt-6">
            <h2 className="text-h3 text-ink font-serif">Sources</h2>
            <ul className="mt-3 flex flex-col gap-1.5 text-body-md">
              {post.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {post.tags && post.tags.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/blog?tag=${tag.slug}`}
                className="rounded-full border border-line-low bg-surface px-3 py-1 text-label-md text-ink-2 hover:border-accent hover:text-accent"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        ) : null}
      </main>
    </>
  );
}
