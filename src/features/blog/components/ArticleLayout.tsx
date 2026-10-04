import type { ReactNode } from "react";
import DOMPurify from "dompurify";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { NetworkImage } from "@/components/ui/NetworkImage";

/** One layout for every guide: a readable 68-character column on a paper sheet. */
export function ArticleLayout({
  title,
  excerpt,
  topic,
  meta,
  image,
  notice,
  children
}: {
  title: string;
  excerpt?: string | null;
  topic?: string | null;
  meta?: string;
  image?: string | null;
  /** A line above the title, for example the preview notice. */
  notice?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="page-container page-fade py-8 md:py-12">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Guides", to: "/blog" }, { label: title }]} className="mx-auto max-w-[760px]" />
      <article className="mx-auto mt-4 max-w-[760px]">
        <header>
          {notice}
          {topic ? <p className="text-label-lg text-clay">{topic}</p> : null}
          <h1 className="mt-2 text-h1 text-ink md:text-display">{title}</h1>
          {excerpt ? <p className="excerpt mt-4 text-body-lg text-ink-2">{excerpt}</p> : null}
          {meta ? <p className="mt-4 text-body-md tabular-nums text-ink-3">{meta}</p> : null}
        </header>
        {image ? (
          <div className="mt-8 aspect-[16/9] w-full overflow-hidden rounded-hand bg-surface-soft shadow-sm">
            <NetworkImage src={image} alt="" className="h-full w-full object-cover" width={1200} height={675} loading="eager" decoding="async" />
          </div>
        ) : null}
        <div className="paper-grain mt-8 rounded-hand bg-surface px-5 py-8 shadow-sm md:px-12 md:py-12">
          <div className="mx-auto max-w-[68ch]">{children}</div>
        </div>
      </article>
    </div>
  );
}

/**
 * Tags the CMS may ship inside `post.content` (DynamicBlogPostPage). Anything
 * outside this allowlist — scripts, event handlers, iframes, forms, styles —
 * is stripped by DOMPurify before it reaches the DOM.
 */
const ARTICLE_ALLOWED_TAGS = [
  "h2", "h3", "p", "ul", "ol", "li",
  "strong", "b", "em", "i", "a", "blockquote",
  "br", "hr", "code", "pre", "img"
];
const ARTICLE_ALLOWED_ATTR = ["href", "title", "alt", "src", "width", "height", "loading"];

/** Matches an HTML tag open (`<p>`, `<h2 class=…>`). Plain-text `<` uses never match. */
const HTML_TAG_RE = /<[a-zA-Z][^>]*>/;

function sanitizeArticleHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ARTICLE_ALLOWED_TAGS,
    ALLOWED_ATTR: ARTICLE_ALLOWED_ATTR
  });
}

/**
 * The small markdown subset the guides use: ## and ### headings, "- " list
 * items (with an optional **Lead:** in bold), a **bold** line, paragraphs.
 * Consecutive list items become one <ul>.
 *
 * CMS posts (`post.content` via DynamicBlogPostPage) may instead ship HTML:
 * that path is allowlist-sanitized above and rendered as one `article-body`
 * block (styled in `src/styles/globals.css` to match the markdown classes).
 */
export function renderArticleText(content: string): ReactNode[] {
  if (HTML_TAG_RE.test(content)) {
    return [
      <div key="cms-html" className="article-body" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(content) }} />
    ];
  }
  const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);
  const blocks: ReactNode[] = [];
  let list: ReactNode[] = [];
  const flush = () => {
    if (list.length === 0) return;
    blocks.push(<ul key={`ul-${blocks.length}`} className="mb-6 flex list-disc flex-col gap-2 pl-5 marker:text-clay">{list}</ul>);
    list = [];
  };
  lines.forEach((line, index) => {
    const key = `${index}-${line.slice(0, 24)}`;
    if (line.startsWith("- ")) {
      const lead = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)$/);
      list.push(
        <li key={key} className="text-body-lg text-ink-2">
          {lead ? (
            <>
              <strong className="font-semibold text-ink">{lead[1]}</strong>
              {lead[2] ? `: ${lead[2]}` : null}
            </>
          ) : (
            line.slice(2)
          )}
        </li>
      );
      return;
    }
    flush();
    if (line.startsWith("### ")) blocks.push(<h3 key={key} className="mb-3 mt-8 text-h3 text-ink">{line.slice(4)}</h3>);
    else if (line.startsWith("## ")) blocks.push(<h2 key={key} className="mb-4 mt-10 text-h2 text-ink first:mt-0">{line.slice(3)}</h2>);
    else if (/^\*\*.+\*\*$/.test(line)) blocks.push(<p key={key} className="mb-2 mt-6 text-body-lg font-semibold text-ink">{line.replace(/\*\*/g, "")}</p>);
    else blocks.push(<p key={key} className="mb-5 text-body-lg text-ink-2">{line}</p>);
  });
  flush();
  return blocks;
}
