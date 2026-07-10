import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";
import { useProperty } from "@/hooks/queries/useProperties";
import { EmptyState } from "@/components/ui/StateViews";
import { Skeleton } from "@/components/ui/Skeleton";

export function SharePage() {
  const { id } = useParams<{ id: string }>();
  const propertyId = Number(id);
  const navigate = useNavigate();
  const { data: property } = useProperty(propertyId);

  useEffect(() => {
    if (!Number.isNaN(propertyId) && propertyId > 0) {
      const timer = setTimeout(
        () => navigate(`/discover/${propertyId}`, { replace: true }),
        100
      );
      return () => clearTimeout(timer);
    }
  }, [navigate, propertyId]);

  if (!id || Number.isNaN(propertyId) || propertyId <= 0) {
    return (
      <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-8 md:px-6">
        <EmptyState
          title="Listing not found"
          description="This listing may have been removed or the URL is incorrect."
        />
      </main>
    );
  }

  const title = property ? `${property.title} · 360 Flatmates` : "View listing · 360 Flatmates";
  const description = property
    ? `View ${property.title} on 360 Flatmates.`
    : "View this verified listing on 360 Flatmates.";
  const canonicalUrl = `${SITE_URL}/discover/${id}`;
  const ogImage = property?.main_image_url ?? `${SITE_URL}/og-image.webp`;

  return (
    <>
      <SeoHelmet
        title={title}
        description={description}
        canonicalUrl={canonicalUrl}
        ogImage={ogImage}
      />
      <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-8 md:px-6">
        <Skeleton className="h-8 w-64 rounded-full" />
        <p className="mt-4 text-body-md text-ink-2">Redirecting to the listing...</p>
      </main>
    </>
  );
}
