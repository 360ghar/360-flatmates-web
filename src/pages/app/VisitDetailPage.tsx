import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Star } from "lucide-react";
import { useVisit, useCancelVisit, useUpdateVisit } from "@/hooks/queries";
import { visitToVisitCardProps } from "@/lib/api/adapters";
import { visitStatusToCardStatus } from "@/components/molecules";
import { uiStore } from "@/lib/stores/ui-store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { TextArea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { VisitCard } from "@/components/molecules/VisitCard";
import { cn } from "@/components/ui/component-utils";
import type { StatusTone } from "@/components/ui/Badge";
import type { Tone } from "@/components/ui/component-utils";
import type { Visit } from "@/lib/api/types";

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

/* ---------- Star Rating ---------- */

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className={cn(
            "p-0.5 transition-colors",
            (hovered || value) >= star ? "text-warning" : "text-ink-4"
          )}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
        >
          <Star
            aria-hidden="true"
            className="h-7 w-7"
            fill={(hovered || value) >= star ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

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
      {visit.status === "completed" && !feedbackSubmitted && (
        <Card className="p-4 flex flex-col gap-4">
          <h2 className="text-h3">Leave Feedback</h2>
          <div className="flex flex-col gap-2">
            <span className="text-label-md text-ink-2">How was your visit?</span>
            <StarRating value={feedbackRating} onChange={setFeedbackRating} />
          </div>
          <TextArea
            label="Comments"
            placeholder="Share your experience (optional)"
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            rows={3}
          />
          <Button
            fullWidth
            disabled={feedbackRating === 0}
            loading={updateVisit.isPending}
            onClick={handleFeedbackSubmit}
          >
            Submit Feedback
          </Button>
        </Card>
      )}

      {feedbackSubmitted && (
        <Card className="p-4 text-center">
          <p className="text-body-md font-semibold text-success">Thank you for your feedback!</p>
        </Card>
      )}

      {/* Reschedule Modal */}
      <Modal
        open={showReschedule}
        title="Reschedule Visit"
        description="Pick a new date for your visit."
        onClose={() => setShowReschedule(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowReschedule(false)}>
              Keep current date
            </Button>
            <Button
              disabled={!newDate || rescheduleInvalid || isMutating}
              loading={updateVisit.isPending}
              onClick={handleReschedule}
            >
              Confirm Reschedule
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="reschedule-date" className="text-label-md text-ink-2">
            New Date
          </label>
          <input
            id="reschedule-date"
            type="date"
            className={cn(
              "h-12 w-full rounded-[8px] border bg-surface px-3 text-body-md text-ink focus:focus:outline-none",
              rescheduleInvalid ? "border-error focus:border-error" : "border-line focus:border-accent"
            )}
            value={newDate}
            min={minDate}
            aria-invalid={rescheduleInvalid}
            aria-describedby={rescheduleInvalid ? "reschedule-date-error" : undefined}
            onChange={(e) => setNewDate(e.target.value)}
          />
          {rescheduleInvalid ? (
            <p id="reschedule-date-error" className="text-caption text-error">
              Pick a date today or later.
            </p>
          ) : null}
        </div>
      </Modal>

      {/* Cancel-confirmation Modal */}
      <Modal
        open={showCancelConfirm}
        title="Cancel this visit?"
        description="This lets the other party know the visit is off. You can always schedule a new one."
        onClose={() => setShowCancelConfirm(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCancelConfirm(false)}>
              Keep visit
            </Button>
            <Button
              variant="primary"
              className="bg-error text-white shadow-none hover:bg-error/90"
              loading={cancelVisit.isPending}
              onClick={handleCancel}
            >
              Cancel visit
            </Button>
          </>
        }
      />
      </>
      )}
    </div>
  );
}
