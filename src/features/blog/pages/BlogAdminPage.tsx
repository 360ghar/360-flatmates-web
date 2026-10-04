import { Copy, Eye } from "lucide-react";
import { useState } from "react";
import { useBlogPosts, useCreateBlogPreviewToken } from "@/features/blog/hooks/useBlog";
import { uiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { ChoiceChips } from "@/components/ui/ChoiceChips";
import { Page, PageHeader } from "@/components/ui/Layout";
import { EmptyState, InlineError } from "@/components/ui/StateViews";
import { cn } from "@/components/ui/component-utils";
import { formatDate } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/Skeleton";
import type { BlogPost, BlogPostStatus } from "@/lib/api/types";

const STATUS_LABELS: Record<BlogPostStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
  scheduled: "Scheduled"
};

/* Status as tonal text: live posts read pine, work in progress reads marigold ink. */
const STATUS_TONE: Record<BlogPostStatus, string> = {
  published: "text-pine",
  scheduled: "text-warning",
  draft: "text-ink-2",
  archived: "text-ink-3"
};

const STATUS_FILTERS: ReadonlyArray<{ value: BlogPostStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived", label: "Archived" }
];

/** Resolves true only when the text reached the clipboard (W20). */
function copyText(text: string): Promise<boolean> {
  if (!navigator.clipboard) return Promise.resolve(false);
  return navigator.clipboard.writeText(text).then(
    () => true,
    () => false
  );
}

export function BlogAdminPage() {
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
          void copyText(response.url).then((copied) => {
            uiStore.getState().pushToast({
              type: "success",
              title: copied ? "Preview link generated and copied" : "Preview link generated",
              description: response.url
            });
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
    <Page width="default">
      <PageHeader
        title="Blog"
        description="Every post, and time-limited preview links for drafts and scheduled posts."
      />

      <ChoiceChips label="Post status" options={STATUS_FILTERS} value={status} onValueChange={setStatus} />

      {isLoading ? (
        <Skeleton variant="moderationRow" count={4} />
      ) : error ? (
        <InlineError title="Could not load posts" onRetry={() => refetch()} />
      ) : !posts || posts.length === 0 ? (
        <EmptyState
          scene="magnifier"
          title={status === "all" ? "No posts yet" : `No ${STATUS_FILTERS.find((f) => f.value === status)?.label.toLowerCase()} posts`}
          description={status === "all" ? "New posts show up here." : "Try another status."}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {posts.map((post) => (
            <div
              key={post.id}
              className="paper-grain flex flex-wrap items-center justify-between gap-3 rounded-hand bg-surface p-4 shadow-sm"
            >
              <div className="flex flex-col min-w-0">
                <span className="truncate text-body-md text-ink font-semibold">
                  {post.title}
                </span>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-caption text-ink-3">
                  <span className={cn("text-label-md", STATUS_TONE[post.status])}>{STATUS_LABELS[post.status]}</span>
                  {post.published_at ? <span>· {formatDate(post.published_at)}</span> : null}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="tertiary"
                  size="compact"
                  leadingIcon={<Copy aria-hidden="true" className="h-4 w-4" />}
                  onClick={() => {
                    const url = `${window.location.origin}/blog/${post.slug}`;
                    void copyText(url).then((copied) => {
                      uiStore.getState().pushToast(
                        copied
                          ? { type: "success", title: "Public URL copied" }
                          : { type: "warning", title: "Could not copy", description: url }
                      );
                    });
                  }}
                >
                  Copy link
                </Button>
                <Button
                  variant="secondary"
                  size="compact"
                  leadingIcon={<Eye aria-hidden="true" className="h-4 w-4" />}
                  onClick={() => handleGenerateToken(post)}
                >
                  Preview link
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
