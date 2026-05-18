import { useParams, Navigate } from "react-router";
import { Helmet } from "react-helmet-async";
import { BASE_URL } from "@/lib/config";

export function SharePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <Helmet>
        <title>Shared Listing — 360 Flatmates</title>
        <meta name="description" content="Check out this verified room and flatmate listing on 360 Flatmates. Compatibility scores, society vibe tags, and visit scheduling built in." />
        <link rel="canonical" href={`${BASE_URL}/discover/${id}`} />
        <meta property="og:title" content="Shared Listing — 360 Flatmates" />
        <meta property="og:description" content="Check out this verified room and flatmate listing on 360 Flatmates." />
        <meta property="og:url" content={`${BASE_URL}/share/${id}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="360 Flatmates" />
      </Helmet>
      <Navigate to={`/discover/${id}`} replace />
    </>
  );
}
