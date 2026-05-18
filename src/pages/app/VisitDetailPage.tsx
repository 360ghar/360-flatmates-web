import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Star } from "lucide-react";
import { useVisit, useCancelVisit, useUpdateVisit } from "@/hooks/queries";
import { visitToVisitCardProps } from "@/lib/api/adapters";
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

const VISIT_STATUS_BADGE: Record<string, StatusTone> = {
  requested: "pending",
  confirmed: "confirmed",
  reschedule_suggested: "pending",
  cancelled: "cancelled",
  completed: "completed",
};

const VISIT_CONTEXT_CONFIG: Record<string, { tone: Tone; label: string }> = {
  property_tour: { tone: "teal", label: "Property Tour" },
  flatmate_meet: { tone: "purple", label: "Flatmate Meet" },
};

function ratingToInterestLevel(rating: number): "high" | "medium" | "low" {
  if (rating >= 4) return "high";
  if (rating >= 3) return "medium";
  return "low";
}

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

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <Skeleton variant="card" />
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className="flex items-center justify-center p-8">
        <ErrorState
          title="Visit not found"
          description="This visit may have been removed."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  function handleCancel() {
    cancelVisit.mutate(undefined, {
      onSuccess: () => navigate("/visits"),
    });
  }

  function handleConfirm() {
    updateVisit.mutate({ status: "confirmed" }, { onSuccess: () => refetch() });
  }

  function handleReschedule() {
    if (!newDate) return;
    updateVisit.mutate(
      { scheduled_date: newDate },
      {
        onSuccess: () => {
          setShowReschedule(false);
          setNewDate("");
          refetch();
        },
      }
    );
  }

  function handleFeedbackSubmit() {
    if (feedbackRating === 0) return;
    updateVisit.mutate(
      {
        visitor_feedback: feedbackComment,
        interest_level: ratingToInterestLevel(feedbackRating),
      },
      {
        onSuccess: () => {
          setFeedbackSubmitted(true);
        },
      }
    );
  }

  const isUpcoming =
    visit.status === "requested" ||
    visit.status === "confirmed" ||
    visit.status === "reschedule_suggested";

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 max-w-lg mx-auto">
      <h1 className="text-h1">Visit Details</h1>

      <VisitCard
        visit={visitToVisitCardProps(visit)}
        canConfirm={visit.status === "requested"}
        onConfirm={() => handleConfirm()}
        onCancel={() => handleCancel()}
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
          />
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
      <div className="flex gap-3">
        {visit.status === "requested" && (
          <>
            <Button variant="primary" fullWidth onClick={handleConfirm} loading={updateVisit.isPending}>
              Confirm Visit
            </Button>
            <Button variant="secondary" fullWidth onClick={handleCancel} loading={cancelVisit.isPending}>
              Cancel
            </Button>
          </>
        )}
        {isUpcoming && (
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowReschedule(true)}
          >
            Reschedule
          </Button>
        )}
        {visit.status === "confirmed" && (
          <Button variant="secondary" fullWidth onClick={handleCancel} loading={cancelVisit.isPending}>
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
              Cancel
            </Button>
            <Button
              disabled={!newDate}
              loading={updateVisit.isPending}
              onClick={handleReschedule}
            >
              Confirm Reschedule
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <label htmlFor="reschedule-date" className="text-label-md text-ink-2">
            New Date
          </label>
          <input
            id="reschedule-date"
            type="date"
            className="h-12 w-full rounded-[9px] border border-line bg-surface px-3 text-body-md text-ink focus:border-accent focus:shadow-focus focus:outline-none"
            value={newDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
