import { ArrowLeft, Copy, Eye } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { useBlogPosts, useCreateBlogPreviewToken } from "@/hooks/queries";
import { uiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { BlogPost, BlogPostStatus } from "@/lib/api/types";

const STATUS_LABELS: Record<BlogPostStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
  scheduled: "Scheduled"
};

function statusPill(status: BlogPostStatus): string {
  switch (status) {
    case "published":
      return "bg-green-100 text-green-800";
    case "draft":
      return "bg-gray-100 text-gray-700";
    case "scheduled":
      return "bg-amber-100 text-amber-800";
    case "archived":
      return "bg-zinc-100 text-zinc-700";
  }
}

export function BlogAdminPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<BlogPostStatus | "all">("all");
  const { data: posts, isLoading, error, refetch } = useBlogPosts({
    status: status === "all" ? undefined : status,
    limit: 50
  });
  const createToken = useCreateBlogPreviewToken();

  const handleGenerateToken = async (post: BlogPost) => {
    createToken.mutate(
      { id: post.id, payload: { ttl_hours: 72 } },
      {
        onSuccess: (response) => {
          navigator.clipboard
            ?.writeText(response.url)
            .catch(() => undefined);
          uiStore.getState().pushToast({
            type: "success",
            title: "Preview link generated",
            description: response.url
          });
        },
        onError: () =>
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not generate preview link"
          })
      }
    );
  };

  return (
    <div className="flex flex-col gap-5 page-fade">
      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          size="icon"
          aria-label="Back to profile"
          onClick={() => navigate("/profile")}
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h1 className="text-h1">Blog admin</h1>
      </div>

      <p className="text-body-md text-ink-2 max-w-2xl">
        Manage blog posts and generate time-limited preview links for draft
        and scheduled content.
      </p>

      <div className="flex flex-wrap gap-2">
        {(["all", "published", "draft", "scheduled", "archived"] as const).map(
          (option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              className={`px-3 py-1.5 rounded-full text-label-md border transition-colors ${
                status === option
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line-low bg-surface text-ink-2 hover:border-accent hover:text-accent"
              }`}
            >
              {option === "all" ? "All" : STATUS_LABELS[option]}
            </button>
          )
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <p className="text-h3 text-ink-2 font-semibold">Could not load posts</p>
          <Button className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : !posts || posts.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-h3 text-ink-2 font-semibold">No posts found</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm"
            >
              <div className="flex flex-col min-w-0">
                <span className="truncate text-body-md text-ink font-semibold">
                  {post.title}
                </span>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-eyebrow text-ink-3 uppercase">
                  <span
                    className={`rounded-full px-2 py-0.5 ${statusPill(post.status)}`}
                  >
                    {STATUS_LABELS[post.status]}
                  </span>
                  {post.published_at ? (
                    <span>{new Date(post.published_at).toLocaleDateString()}</span>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="secondary"
                  size="compact"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(`${window.location.origin}/blog/${post.slug}`)
                      .catch(() => undefined);
                    uiStore.getState().pushToast({
                      type: "success",
                      title: "Public URL copied"
                    });
                  }}
                >
                  <Copy aria-hidden="true" className="h-4 w-4 mr-1" />
                  Copy URL
                </Button>
                <Button
                  variant="secondary"
                  size="compact"
                  onClick={() => handleGenerateToken(post)}
                >
                  <Eye aria-hidden="true" className="h-4 w-4 mr-1" />
                  Preview link
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
