import { useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Helmet } from "react-helmet-async";
import { useProfile, useCompatibility, useCreateConversation } from "@/hooks/queries";
import { uiStore } from "@/lib/stores/ui-store";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { ProfileDetailsCard } from "@/components/molecules/ProfileDetailsCard";
import { humanizeSnakeCase } from "@/lib/utils";
import { buildBreadcrumbJsonLd, homeBreadcrumb } from "@/lib/utils/seo";
import { BASE_URL } from "@/lib/config";

const breadcrumbLd = buildBreadcrumbJsonLd([
  homeBreadcrumb(),
  { name: "Profile" },
]);

export function PublicProfilePage() {
  const { id } = useParams();
  const profileId = Number(id);
  const navigate = useNavigate();

  const { data: profile, isLoading, error, refetch } = useProfile(profileId);
  const { data: compatibility } = useCompatibility(profileId);
  const createConversation = useCreateConversation();

  const url = `${BASE_URL}/profile/${id ?? ""}`;

  const handleStartConversation = useCallback(() => {
    createConversation.mutate(
      { peer_user_id: profileId },
      {
        onSuccess: (conversation) => {
          navigate(`/chats/${conversation.id}`);
        },
        onError: () => {
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not start conversation",
            description: "Something went wrong. Please try again."
          });
        }
      }
    );
  }, [createConversation, profileId, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 p-4 md:p-6">
        <Skeleton variant="profile" />
        <Skeleton variant="block" count={3} className="w-full max-w-md" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <ErrorState
          title="Profile not found"
          description="This user may not exist or their profile is private."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const matchScore = compatibility?.overall_percentage ?? 0;

  return (
    <>
      <Helmet>
        <title>Flatmate Profile — 360 Flatmates</title>
        <meta name="description" content="View this flatmate profile on 360 Flatmates. Compatibility scores, lifestyle preferences, and verified user information." />
        <link rel="canonical" href={url} />
        <meta property="og:title" content="Flatmate Profile — 360 Flatmates" />
        <meta property="og:description" content="View this flatmate profile on 360 Flatmates. Compatibility scores and lifestyle preferences." />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="profile" />
        <meta property="og:site_name" content="360 Flatmates" />
      </Helmet>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbLd),
        }}
      />

      <div className="flex flex-col gap-5 p-4 md:p-6 max-w-lg mx-auto">
        <Card className="flex flex-col items-center gap-4 p-6 text-center">
          <div className="relative">
            <Avatar
              name={profile.full_name}
              size="xl"
              src={profile.profile_image_url}
            />
            {matchScore > 0 && (
              <div className="absolute -right-2 -top-2">
                <ProgressRing size="sm" value={matchScore} />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-h1">{profile.full_name}</h1>
            {profile.profession && (
              <p className="text-body-md text-ink-2 mt-1">{profile.profession}</p>
            )}
            <div className="flex items-center justify-center gap-2 mt-2">
              {profile.mode && <Badge mode={profile.mode} variant="mode" />}
              <TrustBadge variant="verified" />
            </div>
          </div>

          {matchScore > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-success-soft px-3 py-1.5 text-body-md font-semibold text-success">
              {matchScore}% match
            </div>
          )}
        </Card>

        <ProfileDetailsCard profile={profile} />

        {compatibility && compatibility.dimensions.length > 0 && (
          <Card
            as="button"
            interactive
            className="flex flex-col gap-3 p-5 text-left"
            onClick={() => navigate(`/compatibility/${profileId}`)}
          >
            <h2 className="text-h3">Compatibility Breakdown</h2>
            {compatibility.dimensions.map((dim) => (
              <div key={dim.name} className="flex items-center justify-between">
                <span className="text-body-md text-ink-2">
                  {humanizeSnakeCase(dim.name)}
                </span>
                <span className="text-body-md text-ink">
                  {dim.score}%
                </span>
              </div>
            ))}
            <p className="text-label-md text-ink-3 mt-1">Tap for full breakdown</p>
          </Card>
        )}

        <div className="flex flex-col gap-2">
          <Button
            fullWidth
            loading={createConversation.isPending}
            disabled={createConversation.isPending}
            onClick={handleStartConversation}
          >
            Start Conversation
          </Button>
        </div>
      </div>
    </>
  );
}
