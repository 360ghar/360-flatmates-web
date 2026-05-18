import { useParams, Link } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";

const BLOG_CONTENT: Record<string, { title: string; excerpt: string; date: string; readTime: string; category: string; image: string; content: string }> = {
  "how-to-find-compatible-flatmates": {
    title: "How to Find Compatible Flatmates: A Complete Guide",
    excerpt: "Learn the 6 key dimensions that determine flatmate compatibility and how to evaluate potential matches before moving in.",
    date: "May 2025",
    readTime: "8 min read",
    category: "Guide",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=80",
    content: `
Finding the right flatmate is one of the most important decisions you'll make when moving to a new city. A compatible flatmate can make your living experience enjoyable, while an incompatible one can turn your home into a source of daily stress.

## The 6 Dimensions of Flatmate Compatibility

Our research with thousands of successful flatmate pairings has identified six key dimensions that determine compatibility:

### 1. Sleep Schedule
Early risers and night owls can coexist, but only if both parties understand and respect each other's schedules. The key questions: What time do you typically go to bed? What time do you wake up? Are you a light or heavy sleeper?

### 2. Cleanliness Standards
This is the #1 source of flatmate conflict. Some people need a spotless kitchen after every meal, while others are comfortable with dishes sitting overnight. Neither approach is wrong — but mismatched expectations cause problems.

### 3. Food Habits
Vegetarian and non-vegetarian flatmates can absolutely live together, but it requires clear communication about shared kitchen use, storage, and cooking schedules.

### 4. Guest Policy
How often do you have friends over? Do you host overnight guests? What about significant others? These are crucial conversations to have before moving in.

### 5. Work Style
Working from home has changed the flatmate dynamic. If both of you work from home, you need to discuss noise levels, meeting schedules, and shared workspace usage.

### 6. Lifestyle Preferences
Social vs. introverted, party weekends vs. quiet nights, AC temperature preferences — these daily habits add up to determine your overall living experience.

## How to Evaluate Potential Flatmates

1. **Use a structured questionnaire** — Don't rely on vibes alone. Ask specific questions about each dimension.
2. **Schedule a visit** — Meet in person at the property to see the actual living conditions.
3. **Check references** — If possible, talk to their previous flatmates.
4. **Start with a trial period** — A month-to-month arrangement lets you test compatibility before committing long-term.

## Red Flags to Watch For

- Unwillingness to discuss expectations upfront
- Vague answers about cleanliness or guest policies
- Pushing you to decide immediately without a visit
- Inconsistent information about the property

## The 360 Flatmates Advantage

Our platform addresses these challenges with:
- **6-dimension compatibility scoring** based on your actual preferences
- **Verified listings** so you know the property is real
- **In-app chat** to start conversations with context
- **Visit scheduling** to coordinate property tours easily

Finding the right flatmate takes effort, but getting it right is worth it. Start by understanding your own preferences, then use those as a filter when evaluating potential matches.
    `,
  },
};

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOG_CONTENT[slug || ""];

  if (!post) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-20 text-center">
        <h1 className="text-h1">Post not found</h1>
        <Link to="/blog" className="text-accent hover:underline">← Back to blog</Link>
      </div>
    );
  }

  const url = `${SITE_URL}/blog/${slug}`;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: "360 Flatmates",
    },
    publisher: {
      "@type": "Organization",
      name: "360 Flatmates",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/favicon.svg`,
      },
    },
  };

  const renderContent = (content: string) => {
    return content.split("\n").filter(Boolean).map((line, i) => {
      if (line.startsWith("## ")) {
        return <h2 key={i} className="text-h2 mt-10 mb-4">{line.replace("## ", "")}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={i} className="text-h3 mt-8 mb-3">{line.replace("### ", "")}</h3>;
      }
      if (line.startsWith("- **")) {
        const match = line.match(/- \*\*(.+?)\*\* — (.+)/);
        if (match) {
          return (
            <li key={i} className="flex gap-3 text-body-lg text-ink-2 mb-2">
              <span className="text-accent mt-1.5">•</span>
              <span><strong className="text-ink">{match[1]}</strong> — {match[2]}</span>
            </li>
          );
        }
      }
      if (line.startsWith("- ")) {
        return <li key={i} className="flex gap-3 text-body-lg text-ink-2 mb-2"><span className="text-accent mt-1.5">•</span><span>{line.replace("- ", "")}</span></li>;
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} className="text-body-lg font-semibold text-ink mt-6 mb-2">{line.replace(/\*\*/g, "")}</p>;
      }
      if (line.trim()) {
        return <p key={i} className="text-body-lg text-ink-2 leading-relaxed mb-4">{line}</p>;
      }
      return null;
    });
  };

  return (
    <>
      <SeoHelmet
        title={post.title}
        description={post.excerpt}
        canonicalUrl={url}
        ogImage={post.image}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
        />
      </SeoHelmet>

      <main id="main" className="page-fade">
        <article className="mx-auto max-w-3xl px-5 py-12 md:px-6">
          <div className="text-center mb-10">
            <span className="text-eyebrow text-accent">{post.category}</span>
            <h1 className="mt-3 text-display text-4xl md:text-5xl">{post.title}</h1>
            <div className="mt-4 flex justify-center gap-4 text-label-md text-ink-3">
              <span>{post.date}</span>
              <span>·</span>
              <span>{post.readTime}</span>
            </div>
          </div>

          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-10">
            <img
              src={post.image}
              alt={post.title}
              className="h-full w-full object-cover"
              width={1200}
              height={630}
              loading="eager"
              decoding="async"
            />
          </div>

          <div className="prose">
            {renderContent(post.content)}
          </div>

          <div className="mt-16 pt-10 border-t border-line-low text-center">
            <h2 className="text-h2">Find Your Compatible Flatmate</h2>
            <p className="mt-3 text-body-lg text-ink-2">
              Use our 6-dimension matching to find flatmates who share your lifestyle.
            </p>
            <Link
              to="/signup"
              className="inline-flex h-12 items-center justify-center rounded-[10px] bg-accent px-6 text-label-lg text-white shadow-cta hover:shadow-hover mt-6"
            >
              Get Started Free
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
