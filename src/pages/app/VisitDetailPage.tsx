import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useVisit, useCancelVisit, useUpdateVisit } from "@/hooks/queries";
import { visitToVisitCardProps, visitStatusToCardStatus } from "@/lib/api/adapters";
import { uiStore } from "@/lib/stores/ui-store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { VisitCard } from "@/components/molecules/VisitCard";
import type { StatusTone } from "@/components/ui/Badge";
import type { Tone } from "@/components/ui/component-utils";
import type { Visit } from "@/lib/api/types";
import { RescheduleVisitModal } from "./RescheduleVisitModal";
import { CancelVisitModal } from "./CancelVisitModal";
import { VisitFeedbackSection } from "./VisitFeedbackSection";

const VISIT_STATUS_BADGE: Record<Visit["status"], StatusTone> = {
  requested: "pending",
  confirmed: "confirmed",
  reschedule_suggested: "pending",
  cancelled: "cancelled",
  completed: "completed",
};

const VISIT_STATUS_LABEL: Record<Visit["status"], string> = {
  requested: "Pending",
  confirmed: "Confirmed",
  reschedule_suggested: "Reschedule suggested",
  cancelled: "Cancelled",
  completed: "Completed",
};

/** Today as a YYYY-MM-DD string in the user's local timezone (for date-input min). */
function todayLocalISODate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const VISIT_CONTEXT_CONFIG: Record<string, { tone: Tone; label: string }> = {
  property_tour: { tone: "teal", label: "Property Tour" },
  flatmate_meet: { tone: "purple", label: "Flatmate Meet" },
};

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
      <div className="flex flex-col gap-5 p-4 md:p-6 max-w-lg mx-auto">
        {/* Title */}
        <Skeleton className="h-7 w-32" />
        {/* Visit card */}
        <Skeleton variant="visitCard" />
        {/* Detail card with key-value rows */}
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-[52px] flex-1 rounded-[8px]" />
          <Skeleton className="h-[52px] flex-1 rounded-[8px]" />
        </div>
      </div>
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
          description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
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
            description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
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
            description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
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
            description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
          }),
      }
    );
  }

  const isUpcoming = visit
    ? visit.status === "requested" ||
      visit.status === "confirmed" ||
      visit.status === "reschedule_suggested"
    : false;

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 max-w-lg mx-auto">
      <h1 className="text-h1">Visit Details</h1>

      {error || !visit ? (
        <>
          <Card className="flex items-center justify-center p-8">
            <ErrorState
              title="Visit not found"
              description="This visit may have been removed."
              onRetry={() => refetch()}
            />
          </Card>
          <Button variant="tertiary" fullWidth onClick={() => navigate("/visits")}>
            Back to Visits
          </Button>
        </>
      ) : (
        <>
      {/*
        The detail page owns the full-width action buttons below, so the
        embedded card is rendered *display-only* — pass undefined for the
        action handlers to suppress the duplicate inline buttons. Status is
        threaded through directly (not via the adapter) so the card can
        distinguish "requested" from "reschedule_suggested".
      */}
      <VisitCard
        visit={{
          ...visitToVisitCardProps(visit),
          status: visitStatusToCardStatus(visit.status),
        }}
        busy={isMutating}
      />

      <Card className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-body-md text-ink-2">Visit Type</span>
          <Badge tone={VISIT_CONTEXT_CONFIG[visit.visit_context]?.tone ?? "neutral"}>
            {VISIT_CONTEXT_CONFIG[visit.visit_context]?.label ?? visit.visit_context}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-body-md text-ink-2">Status</span>
          <Badge
            variant="status"
            status={VISIT_STATUS_BADGE[visit.status] ?? "pending"}
          >
            {VISIT_STATUS_LABEL[visit.status] ?? visit.status.replace(/_/g, " ")}
          </Badge>
        </div>
        {visit.special_requirements && (
          <div className="border-t border-line pt-3">
            <p className="text-caption text-ink-3">Special Requirements</p>
            <p className="text-body-md text-ink mt-1">{visit.special_requirements}</p>
          </div>
        )}
        {visit.visit_notes && (
          <div className="border-t border-line pt-3">
            <p className="text-caption text-ink-3">Notes</p>
            <p className="text-body-md text-ink mt-1">{visit.visit_notes}</p>
          </div>
        )}
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {visit.status === "requested" && (
          <Button
            variant="primary"
            fullWidth
            onClick={handleConfirm}
            loading={updateVisit.isPending}
            disabled={isMutating}
          >
            Confirm Visit
          </Button>
        )}
        {isUpcoming && (
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowReschedule(true)}
            disabled={isMutating}
          >
            Reschedule
          </Button>
        )}
        {isUpcoming && (
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowCancelConfirm(true)}
            disabled={isMutating}
          >
            Cancel Visit
          </Button>
        )}
        <Button variant="tertiary" fullWidth onClick={() => navigate("/visits")}>
          Back to Visits
        </Button>
      </div>

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

      <CancelVisitModal
        open={showCancelConfirm}
        submitting={cancelVisit.isPending}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
      />
      </>
      )}
    </div>
  );
}
