import { Link } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";
import { TriangleAlert } from "lucide-react";

export function ErrorPage() {
  return (
    <>
      <SeoHelmet
        title="Something Went Wrong"
        description="An unexpected error occurred on 360 Flatmates. Please try again or return to the homepage."
        canonicalUrl={`${SITE_URL}/error`}
        noindex
      />
      <main id="main" className="flex min-h-screen flex-col items-center justify-center bg-surface text-ink px-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-soft">
          <TriangleAlert className="h-8 w-8 text-error" />
        </div>
        <h1 className="mt-6 text-h1">Something went wrong</h1>
        <p className="mt-3 max-w-md text-center text-body-lg text-ink-2">
          An unexpected error occurred. Please try refreshing the page or return to the homepage.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            to="/"
            className="inline-flex h-12 items-center justify-center rounded-[10px] bg-accent px-6 text-label-lg text-white shadow-cta hover:shadow-hover"
          >
            Return Home
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex h-12 items-center justify-center rounded-[10px] border border-line-low px-6 text-label-lg text-ink-2 hover:border-accent hover:text-accent transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </main>
    </>
  );
}
