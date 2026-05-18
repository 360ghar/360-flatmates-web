import { Link } from "react-router";
import { SeoHelmet, SITE_URL, buildBreadcrumbJsonLd, homeBreadcrumb } from "@/lib/seo";
import { Card } from "@/components/ui/Card";
import { ArrowRight, Calendar, Clock } from "lucide-react";

const BLOG_POSTS = [
  {
    slug: "how-to-find-compatible-flatmates",
    title: "How to Find Compatible Flatmates: A Complete Guide",
    excerpt: "Learn the 6 key dimensions that determine flatmate compatibility and how to evaluate potential matches before moving in.",
    category: "Guide",
    readTime: "8 min read",
    date: "May 2025",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80",
  },
  {
    slug: "flatmate-agreement-essentials",
    title: "The Essential Flatmate Agreement Checklist",
    excerpt: "Everything you need to cover in a flatmate agreement — from rent splitting to guest policies to cleaning schedules.",
    category: "Guide",
    readTime: "6 min read",
    date: "April 2025",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop&q=80",
  },
  {
    slug: "bangalore-rental-market-guide",
    title: "Bangalore Rental Market Guide 2025",
    excerpt: "Average rents, best neighborhoods, and what to look for when renting in India's tech capital.",
    category: "Market Insights",
    readTime: "10 min read",
    date: "March 2025",
    image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&auto=format&fit=crop&q=80",
  },
  {
    slug: "moving-in-with-strangers",
    title: "Moving in with Strangers: Tips from Real Flatmates",
    excerpt: "Real stories and practical advice from people who successfully found flatmates through 360 Flatmates.",
    category: "Community",
    readTime: "5 min read",
    date: "February 2025",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80",
  },
  {
    slug: "room-inspection-checklist",
    title: "Room Inspection Checklist: What to Look For",
    excerpt: "A comprehensive checklist for inspecting rooms before committing — from water pressure to mobile network coverage.",
    category: "Guide",
    readTime: "7 min read",
    date: "January 2025",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80",
  },
  {
    slug: "flatmate-conflict-resolution",
    title: "How to Handle Flatmate Conflicts Gracefully",
    excerpt: "Practical strategies for resolving common flatmate disagreements without damaging the relationship.",
    category: "Community",
    readTime: "6 min read",
    date: "December 2024",
    image: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800&auto=format&fit=crop&q=80",
  },
];

const CATEGORIES = ["All", "Guide", "Market Insights", "Community"];

export function BlogPage() {
  const breadcrumbLd = buildBreadcrumbJsonLd([
    homeBreadcrumb(),
    { name: "Blog", item: `${SITE_URL}/blog` },
  ]);

  return (
    <>
      <SeoHelmet
        title="Flatmate Living Guides & Tips"
        description="Expert guides on finding compatible flatmates, navigating rental markets, and building harmonious shared living spaces across India."
        canonicalUrl={`${SITE_URL}/blog`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      </SeoHelmet>

      <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-12 md:px-6">
        <div className="text-center">
          <p className="text-eyebrow text-accent">Resources</p>
          <h1 className="mt-3 text-h1">Flatmate Living Guides</h1>
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-ink-2">
            Expert advice, market insights, and real stories to help you find the perfect flatmate and make shared living work.
          </p>
        </div>

        <div className="mt-10 flex justify-center gap-3 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className="px-4 py-2 rounded-full text-label-md border border-line-low text-ink-2 hover:border-accent hover:text-accent transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {BLOG_POSTS.map((post) => (
            <Card key={post.slug} className="overflow-hidden group cursor-pointer hover:border-accent/30 transition-colors">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  width={800}
                  height={400}
                  loading="lazy"
                  decoding="async"
                />
                <span className="absolute top-3 left-3 bg-surface/90 backdrop-blur-sm px-3 py-1 rounded-full text-label-md text-ink">
                  {post.category}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-h3 text-ink group-hover:text-accent transition-colors">{post.title}</h3>
                <p className="text-body-md text-ink-2 mt-2 line-clamp-2">{post.excerpt}</p>
                <div className="mt-4 flex items-center gap-4 text-label-md text-ink-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readTime}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-label-md text-accent">
                  Read more <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
