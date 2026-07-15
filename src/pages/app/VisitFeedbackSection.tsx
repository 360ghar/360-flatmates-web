import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextArea } from "@/components/ui/Input";
import { cn } from "@/components/ui/component-utils";

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

export function VisitFeedbackSection({
  visitCompleted,
  feedbackSubmitted,
  feedbackRating,
  onFeedbackRatingChange,
  feedbackComment,
  onFeedbackCommentChange,
  submitting,
  onSubmit
}: {
  visitCompleted: boolean;
  feedbackSubmitted: boolean;
  feedbackRating: number;
  onFeedbackRatingChange: (rating: number) => void;
  feedbackComment: string;
  onFeedbackCommentChange: (value: string) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  if (feedbackSubmitted) {
    return (
      <Card className="p-4 text-center">
        <p className="text-body-md font-semibold text-success">Thank you for your feedback!</p>
      </Card>
    );
  }

  if (!visitCompleted) return null;

  return (
    <Card className="p-4 flex flex-col gap-4">
      <h2 className="text-h3">Leave Feedback</h2>
      <div className="flex flex-col gap-2">
        <span className="text-label-md text-ink-2">How was your visit?</span>
        <StarRating value={feedbackRating} onChange={onFeedbackRatingChange} />
      </div>
      <TextArea
        label="Comments"
        placeholder="Share your experience (optional)"
        value={feedbackComment}
        onChange={(e) => onFeedbackCommentChange(e.target.value)}
        rows={3}
      />
      <Button
        fullWidth
        disabled={feedbackRating === 0}
        loading={submitting}
        onClick={onSubmit}
      >
        Submit Feedback
      </Button>
    </Card>
  );
}
