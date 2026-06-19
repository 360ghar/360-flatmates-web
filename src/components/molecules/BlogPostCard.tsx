import { Link } from "react-router";
import { Card } from "../ui/Card";
import { NetworkImage } from "../ui/NetworkImage";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import type { BlogPost } from "@/lib/api/types";

export interface BlogPostCardProps {
  post: BlogPost;
  /** Routing target. Defaults to `/blog/${post.slug}`. */
  href?: string;
  index?: number;
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

export function BlogPostCard({ post, href, index = 0 }: BlogPostCardProps) {
  const link = href ?? `/blog/${post.slug}`;
  return (
    <Link
      to={link}
      className="block group card-appear"
      style={{ animationDelay: `${Math.min(index, 5) * 50}ms` }}
    >
      <Card
        className="overflow-hidden h-full flex flex-col border border-line-low hover:border-accent/20 hover:shadow-md transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
        style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        <div className="relative h-56 overflow-hidden bg-paper">
          <NetworkImage
            src={post.cover_image_url ?? post.og_image_url}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
            width={800}
            height={400}
            loading="lazy"
            decoding="async"
          />
          {post.categories && post.categories.length > 0 ? (
            <span className="absolute top-3 left-3 bg-surface/90 backdrop-blur-sm px-3.5 py-1 rounded-full text-label-md text-accent font-semibold">
              {post.categories[0]?.name}
            </span>
          ) : null}
        </div>
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-h3 text-ink group-hover:text-accent transition-colors line-clamp-2">
            {post.title}
          </h3>
          {post.excerpt ? (
            <p className="text-body-md text-ink-2 mt-3 line-clamp-3 leading-relaxed flex-1">
              {post.excerpt}
            </p>
          ) : null}

          <div className="mt-6 pt-4 border-t border-line-low flex items-center justify-between">
            <div className="flex items-center gap-4 text-label-md text-ink-3">
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
            <span className="flex items-center gap-1 text-label-md text-accent font-semibold group-hover:translate-x-1 transition-transform duration-200">
              Read <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
