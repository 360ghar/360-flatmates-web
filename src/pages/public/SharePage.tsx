import { useParams, Navigate } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";

export function SharePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <SeoHelmet
        title="Shared Listing"
        description="Check out this verified room and flatmate listing on 360 Flatmates. Compatibility scores, society vibe tags, and visit scheduling built in."
        canonicalUrl={`${SITE_URL}/discover/${id}`}
      />
      <Navigate to={`/discover/${id}`} replace />
    </>
  );
}
