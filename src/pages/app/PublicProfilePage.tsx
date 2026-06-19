import { useCallback, useEffect, useRef } from "react";
import { Check, Minus } from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";
import {
  useProfile,
  useCompatibility,
  useCreateConversation,
  useRecordProfileView,
} from "@/hooks/queries";
import { uiStore } from "@/lib/stores/ui-store";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { FlatmateProfileDetail } from "@/components/molecules/FlatmateProfileDetail";
import { humanizeSnakeCase } from "@/lib/utils";

const breadcrumb = [{ name: "Profile", item: `${SITE_URL}/profile` }];

/** A return visit to the same profile within this window is treated as the
 *  same view and does not produce a new profile-view event. */
const VIEW_DEDUP_WINDOW_MS = 30 * 60 * 1000;

/** Match-score tone, paired with the numeric value (never color alone). */
function matchToneClasses(score: number): string {
  if (score >= 70) return "bg-success-soft text-success";
  if (score >= 40) return "bg-warning-soft text-warning";
  return "bg-error-soft text-error";
}

export function PublicProfilePage() {
  const { id } = useParams();
  const profileId = Number(id);
  const navigate = useNavigate();

  const { data: profile, isLoading, error, refetch } = useProfile(profileId);
  const { data: compatibility } = useCompatibility(profileId);
  const createConversation = useCreateConversation();
  const recordProfileView = useRecordProfileView();

  // Record one profile-view event per (profile) view, with dwell time measured
  // on unmount / navigation. A ref-guard keeps it from firing on every render.
  // The cap is time-based: a return visit after 30 minutes counts as a new
  // view (otherwise revisits within the same session were silently dropped).
  const recordView = recordProfileView.mutate;
  const viewedRef = useRef<{ profileId: number; ts: number } | null>(null);
  useEffect(() => {
    if (!Number.isFinite(profileId) || profileId <= 0) return;
    const last = viewedRef.current;
    if (last && last.profileId === profileId && Date.now() - last.ts < VIEW_DEDUP_WINDOW_MS) {
      return;
    }
    viewedRef.current = { profileId, ts: Date.now() };
    const startedAt = Date.now();
    return () => {
      const durationSeconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
      recordView({
        target_user_id: profileId,
        duration_seconds: durationSeconds,
        source: "profile_page",
      });
    };
  }, [profileId, recordView]);

  const url = `${SITE_URL}/profile/${id ?? ""}`;

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
      <div className="flex flex-col gap-5 p-4 md:p-6 max-w-lg mx-auto">
        <Skeleton variant="publicProfile" />
      </div>
    );
  }

  const matchScore = compatibility?.overall_percentage ?? 0;

  return (
    <>
      <SeoHelmet
        title={profile ? `${profile.full_name}: Flatmate Profile` : "Flatmate Profile"}
        description={profile ? `View ${profile.full_name}'s flatmate profile on 360 Flatmates. ${profile.profession ? `${profile.profession} looking for flatmates. ` : ""}Compatibility scores, lifestyle preferences, and verified user information.` : "View flatmate profiles on 360 Flatmates."}
        canonicalUrl={url}
        ogType="profile"
        breadcrumb={[...breadcrumb, { name: profile?.full_name ?? "Profile" }]}
      />

      <div className="flex flex-col gap-5 p-4 md:p-6 max-w-lg mx-auto">
        {error || !profile ? (
          <Card className="flex items-center justify-center p-8">
            <ErrorState
              title="Profile not found"
              description="This user may not exist or their profile is private."
              onRetry={() => refetch()}
            />
          </Card>
        ) : (
        <>
        <Card className="flex flex-col items-center gap-4 p-6 text-center">
          <div className="relative">
            <Avatar
              name={profile.full_name}
              size="xl"
              src={profile.profile_image_url}
            />
            {matchScore > 0 && (
              <div className="absolute -right-2 -top-2">
                <ProgressRing size="sm" value={matchScore} label="Compatibility score" />
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
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-body-md font-semibold ${matchToneClasses(matchScore)}`}
            >
              {matchScore}% match
            </div>
          )}
        </Card>

        <FlatmateProfileDetail profile={profile} />

        {compatibility && compatibility.dimensions.length > 0 && (
          <Card
            as="button"
            interactive
            className="flex flex-col gap-3 p-5 text-left"
            onClick={() => navigate(`/compatibility/${profileId}`)}
          >
            <h2 className="text-h3">Compatibility Breakdown</h2>
            {compatibility.dimensions.map((dim) => (
              <div key={dim.name} className="flex items-center justify-between gap-3">
                <span className="text-body-md text-ink-2">
                  {humanizeSnakeCase(dim.name)}
                </span>
                <span className="flex items-center gap-1.5 text-body-md text-ink">
                  {dim.match ? (
                    <Check aria-hidden="true" className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Minus aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
                  )}
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
        </>
        )}
      </div>
    </>
  );
}
