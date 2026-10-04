import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, Flag } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/queries/useProfiles";
import { useReportUserMutation } from "@/hooks/queries/useReports";
import { ReportUserModal } from "@/features/chat/components/ReportUserModal";
import type { ChatReportReason } from "@/features/chat/lib/types";
import { useCompatibility } from "@/features/profile/hooks/useCompatibility";
import { useCreateConversation } from "@/features/chat/hooks/useConversations";
import { useRecordProfileView } from "@/features/profile/hooks/useProfileViews";
import { uiStore } from "@/lib/stores/ui-store";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, focusRing } from "@/components/ui/component-utils";
import { Page, PageHeader } from "@/components/ui/Layout";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { PublicProfileSkeleton } from "@/features/profile/components/PublicProfileSkeleton";
import { InlineError } from "@/components/ui/StateViews";
import { FlatmateProfileDetail } from "@/features/profile/components/FlatmateProfileDetail";
import { formatLocation } from "@/lib/utils/format";

const breadcrumb = [{ name: "Profile", item: `${SITE_URL}/profile` }];

/** A return visit to the same profile within this window is treated as the
 *  same view and does not produce a new profile-view event. */
const VIEW_DEDUP_WINDOW_MS = 30 * 60 * 1000;

export function PublicProfilePage() {
  const { id } = useParams();
  const profileId = Number(id);
  const navigate = useNavigate();

  const { data: profile, isLoading, error, refetch } = useProfile(profileId);
  const { data: compatibility } = useCompatibility(profileId);
  const createConversation = useCreateConversation();
  const recordProfileView = useRecordProfileView();
  const { user } = useAuth();
  const reportProfile = useReportUserMutation();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ChatReportReason>("spam");
  const [reportNotes, setReportNotes] = useState("");

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

  const handleOpenReport = useCallback(() => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/profile/${profileId}`)}`);
      return;
    }
    setIsReportOpen(true);
  }, [navigate, profileId, user]);

  const handleSubmitReport = useCallback(() => {
    reportProfile.mutate(
      { reported_user_id: profileId, reason: reportReason, notes: reportNotes.trim() || undefined },
      {
        onSuccess: () => {
          uiStore.getState().pushToast({ type: "success", title: "Report submitted" });
        },
        onError: () => {
          uiStore.getState().pushToast({ type: "error", title: "Could not submit report" });
        }
      }
    );
    setIsReportOpen(false);
    setReportReason("spam");
    setReportNotes("");
  }, [profileId, reportNotes, reportProfile, reportReason]);

  if (isLoading) {
    return (
      <Page width="narrow">
        <PublicProfileSkeleton />
      </Page>
    );
  }

  const matchScore = compatibility?.overall_percentage ?? 0;
  const dimensions = compatibility?.dimensions ?? [];
  const matched = dimensions.filter((d) => d.match).length;
  const subtitle = profile ? [profile.profession, formatLocation(profile.locality, profile.city)].filter(Boolean).join(" · ") : "";

  return (
    <>
      <SeoHelmet
        title={profile ? `${profile.full_name}: Flatmate Profile` : "Flatmate Profile"}
        description={profile ? `View ${profile.full_name}'s flatmate profile on 360 Flatmates. ${profile.profession ? `${profile.profession} looking for flatmates. ` : ""}Compatibility scores and lifestyle preferences.` : "View flatmate profiles on 360 Flatmates."}
        canonicalUrl={url}
        ogType="profile"
        breadcrumb={[...breadcrumb, { name: profile?.full_name ?? "Profile" }]}
      />

      <Page width="narrow">
        {error || !profile ? (
          <>
            <PageHeader title="Profile" />
            <InlineError
              title="Profile not found"
              description="This person may have left, or their profile is private."
              onRetry={() => refetch()}
            />
          </>
        ) : (
          <>
            <PageHeader
              media={<Avatar name={profile.full_name} size="lg" src={profile.profile_image_url} />}
              title={profile.full_name}
              description={
                subtitle || profile.mode ? (
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {subtitle ? <span>{subtitle}</span> : null}
                    {profile.mode ? <Badge mode={profile.mode} variant="mode" /> : null}
                  </span>
                ) : undefined
              }
              actions={
                <div className="flex items-center gap-2">
                  <Button loading={createConversation.isPending} onClick={handleStartConversation}>
                    Message
                  </Button>
                  <Button
                    variant="tertiary"
                    size="compact"
                    leadingIcon={<Flag aria-hidden="true" className="h-4 w-4" />}
                    onClick={handleOpenReport}
                    loading={reportProfile.isPending}
                  >
                    Report
                  </Button>
                </div>
              }
            />

            {matchScore > 0 ? (
              <Link
                to={`/compatibility/${profileId}`}
                className={cn(
                  "paper-grain paper-lift group flex items-center gap-4 rounded-hand bg-paper-3 p-5 shadow-xs",
                  focusRing
                )}
              >
                <ProgressRing size="lg" value={matchScore} label="Compatibility score" />
                <span className="min-w-0 flex-1">
                  <span className="block text-h3 text-ink">{matchScore}% compatible</span>
                  {dimensions.length ? (
                    <span className="mt-0.5 block text-body-md text-ink-2">
                      You match on {matched} of {dimensions.length} parts of daily life. See why.
                    </span>
                  ) : null}
                </span>
                <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-ink-3" />
              </Link>
            ) : null}

            <FlatmateProfileDetail profile={profile} />

            <ReportUserModal
              open={isReportOpen}
              participantName={profile.full_name}
              reportReason={reportReason}
              onReportReasonChange={setReportReason}
              reportNotes={reportNotes}
              onReportNotesChange={setReportNotes}
              onClose={() => setIsReportOpen(false)}
              onSubmit={handleSubmitReport}
            />
          </>
        )}
      </Page>
    </>
  );
}
