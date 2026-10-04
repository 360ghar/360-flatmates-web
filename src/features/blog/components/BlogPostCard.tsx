import { Link } from "react-router";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { cn, focusRing } from "@/components/ui/component-utils";
import type { BlogPost } from "@/lib/api/types";
import { formatMonthYear } from "@/lib/utils/format";

export interface BlogPostCardProps {
  post: BlogPost;
  /** Routing target. Defaults to `/blog/${post.slug}`. */
  href?: string;
  /** Kept for call-site compatibility. */
  index?: number;
}

/** A guide on a paper card: cover, topic, title, the first lines and when it was written. */
export function BlogPostCard({ post, href }: BlogPostCardProps) {
  const link = href ?? `/blog/${post.slug}`;
  const topic = post.categories?.[0]?.name;
  const meta = [post.published_at ? formatMonthYear(post.published_at) : null, post.reading_time_minutes ? `${post.reading_time_minutes} min read` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      to={link}
      className={cn(
        "paper-grain paper-lift group flex h-full flex-col overflow-hidden rounded-hand bg-surface shadow-sm transition-[transform,box-shadow] duration-200 ease-[var(--ease-paper-out)]",
        focusRing
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-soft">
        <NetworkImage
          src={post.cover_image_url ?? post.og_image_url}
          alt=""
          className="h-full w-full object-cover"
          width={800}
          height={450}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="flex flex-1 flex-col p-5 md:p-6">
        {topic ? <p className="text-label-md text-clay">{topic}</p> : null}
        <h3 className="mt-1 line-clamp-2 text-h3 text-ink group-hover:text-clay">{post.title}</h3>
        {post.excerpt ? <p className="mt-2 line-clamp-3 flex-1 text-body-md text-ink-2">{post.excerpt}</p> : <span className="flex-1" />}
        {meta ? <p className="mt-5 text-caption tabular-nums text-ink-3">{meta}</p> : null}
      </div>
    </Link>
  );
}
