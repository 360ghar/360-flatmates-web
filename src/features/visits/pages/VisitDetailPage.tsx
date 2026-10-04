import { userMessage } from "@/lib/api/errors";
import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useVisit, useCancelVisit, useUpdateVisit } from "@/features/visits/hooks/useVisits";
import { visitToVisitCardProps, visitStatusToCardStatus } from "@/features/visits/lib/adapters";
import { uiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Page, PageHeader } from "@/components/ui/Layout";
import { Skeleton } from "@/components/ui/Skeleton";
import { VisitCardSkeleton } from "@/features/visits/components/VisitCardSkeleton";
import { InlineError } from "@/components/ui/StateViews";
import { VisitCard } from "@/features/visits/components/VisitCard";
import { RescheduleVisitModal } from "@/features/visits/components/RescheduleVisitModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { VisitFeedbackSection } from "@/features/visits/components/VisitFeedbackSection";

/** Today as a YYYY-MM-DD string in the user's local timezone (for date-input min). */
function todayLocalISODate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * TODO: The VisitUpdate schema has no `rating` field, so a 1-5 star input
 * collapses to a 3-bucket `interest_level` here. This is data loss — a 4 and
 * a 5 both become "high". The fix is a backend contract change (add a
 * `rating?: 1|2|3|4|5` field to VisitUpdate). Until that lands, this
 * conversion is the best we can do without throwing away the rating.
 */
function ratingToInterestLevel(rating: number): "high" | "medium" | "low" {
  if (rating >= 4) return "high";
  if (rating >= 3) return "medium";
  return "low";
}

/**
 * NOTE: A-25 (per `.todo/wire-protocol-divergences.md`) flags that the
 * `min` attribute on `<input type="date">` is a *string* compare, so a
 * local-today string and the value compare correctly for ISO-formatted
 * dates (YYYY-MM-DD), but this is fragile. The audit recommends
 * comparing Date objects at submit time. Decision is pending per-item
 * review; keeping the current behaviour for now.
 */

/* ---------- Visit Detail Page ---------- */

export function VisitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const visitId = Number(id);
  const navigate = useNavigate();

  const { data: visit, isLoading, error, refetch } = useVisit(visitId);
  const cancelVisit = useCancelVisit(visitId);
  const updateVisit = useUpdateVisit(visitId);

  // Reschedule state
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState("");
  const minDate = todayLocalISODate();
  const rescheduleInvalid = newDate !== "" && newDate < minDate;

  // Cancel-confirmation state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Feedback state — the "submitted" flag is *derived* from the server data
  // (visitor_feedback / interest_level) so a page refresh doesn't re-show
  // the form. The local hook state only holds the in-progress input.
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");

  const isMutating = cancelVisit.isPending || updateVisit.isPending;
  const feedbackSubmitted =
    Boolean(visit?.visitor_feedback) || Boolean(visit?.interest_level);

  if (isLoading) {
    return (
      <Page width="narrow">
        <Skeleton className="h-9 w-40" />
        <VisitCardSkeleton />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-[52px] flex-1 rounded-cut-md" />
          <Skeleton className="h-[52px] flex-1 rounded-cut-md" />
        </div>
      </Page>
    );
  }

  function handleCancel() {
    if (cancelVisit.isPending) return;
    cancelVisit.mutate(undefined, {
      onSuccess: () => {
        setShowCancelConfirm(false);
        uiStore.getState().pushToast({
          type: "success",
          title: "Visit cancelled",
          description: "We let the other party know.",
        });
        navigate("/visits");
      },
      onError: (error) => {
        uiStore.getState().pushToast({
          type: "error",
          title: "Couldn't cancel visit",
          description: userMessage(error, "Something went wrong. Please try again."),
        });
      },
    });
  }

  function handleConfirm() {
    if (updateVisit.isPending) return;
    updateVisit.mutate(
      { status: "confirmed" },
      {
        onSuccess: () =>
          uiStore.getState().pushToast({
            type: "success",
            title: "Visit confirmed",
          }),
        onError: (error) =>
          uiStore.getState().pushToast({
            type: "error",
            title: "Couldn't confirm visit",
            description: userMessage(error, "Something went wrong. Please try again."),
          }),
      }
    );
  }

  function handleReschedule() {
    if (!newDate || rescheduleInvalid || isMutating) return;
    updateVisit.mutate(
      { scheduled_date: newDate },
      {
        onSuccess: () => {
          setShowReschedule(false);
          setNewDate("");
          uiStore.getState().pushToast({
            type: "success",
            title: "Visit rescheduled",
          });
        },
        onError: (error) =>
          uiStore.getState().pushToast({
            type: "error",
            title: "Couldn't reschedule visit",
            description: userMessage(error, "Something went wrong. Please try again."),
          }),
      }
    );
  }

  function handleFeedbackSubmit() {
    if (feedbackRating === 0 || updateVisit.isPending) return;
    updateVisit.mutate(
      {
        visitor_feedback: feedbackComment,
        interest_level: ratingToInterestLevel(feedbackRating),
      },
      {
        onSuccess: () => {
          uiStore.getState().pushToast({
            type: "success",
            title: "Feedback submitted",
            description: "Thanks for sharing your experience.",
          });
        },
        onError: (error) =>
          uiStore.getState().pushToast({
            type: "error",
            title: "Couldn't submit feedback",
            description: userMessage(error, "Something went wrong. Please try again."),
          }),
      }
    );
  }

  const isUpcoming = visit
    ? visit.status === "requested" ||
      visit.status === "confirmed" ||
      visit.status === "reschedule_suggested"
    : false;

  const notes = visit
    ? ([
        ["What they asked for", visit.special_requirements],
        ["Notes", visit.visit_notes]
      ] as const).filter(([, value]) => Boolean(value))
    : [];

  return (
    <Page width="narrow">
      <PageHeader title="Visit details" />

      {error || !visit ? (
        <InlineError title="Visit not found" description="It may have been removed." onRetry={() => refetch()} />
      ) : (
        <>
      {/* Display only: this page owns the actions below. The status is passed
          through directly so "requested" and "reschedule suggested" differ. */}
      <VisitCard visit={{ ...visitToVisitCardProps(visit), status: visitStatusToCardStatus(visit.status) }} />

      {notes.length ? (
        <Card className="p-5">
          <dl className="flex flex-col gap-4">
            {notes.map(([label, value]) => (
              <div key={label}>
                <dt className="text-caption text-ink-3">{label}</dt>
                <dd className="mt-0.5 text-body-md text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ) : null}

      {isUpcoming ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          {visit.status === "requested" ? (
            <Button fullWidth onClick={handleConfirm} loading={updateVisit.isPending} disabled={isMutating}>
              Confirm visit
            </Button>
          ) : null}
          <Button variant="secondary" fullWidth onClick={() => setShowReschedule(true)} disabled={isMutating}>
            Reschedule
          </Button>
          <Button variant="tertiary" fullWidth onClick={() => setShowCancelConfirm(true)} disabled={isMutating}>
            Cancel visit
          </Button>
        </div>
      ) : null}

      {/* Feedback section for completed visits */}
      <VisitFeedbackSection
        visitCompleted={visit.status === "completed"}
        feedbackSubmitted={feedbackSubmitted}
        feedbackRating={feedbackRating}
        onFeedbackRatingChange={setFeedbackRating}
        feedbackComment={feedbackComment}
        onFeedbackCommentChange={setFeedbackComment}
        submitting={updateVisit.isPending}
        onSubmit={handleFeedbackSubmit}
      />

      <RescheduleVisitModal
        open={showReschedule}
        newDate={newDate}
        minDate={minDate}
        rescheduleInvalid={rescheduleInvalid}
        isMutating={isMutating}
        submitting={updateVisit.isPending}
        onClose={() => setShowReschedule(false)}
        onDateChange={setNewDate}
        onConfirm={handleReschedule}
      />

      <ConfirmModal
        open={showCancelConfirm}
        title="Cancel this visit?"
        description="We tell the other person the visit is off. You can ask for a new one at any time."
        cancelLabel="Keep visit"
        confirmLabel="Cancel visit"
        destructive
        loading={cancelVisit.isPending}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
      />
        </>
      )}
    </Page>
  );
}
