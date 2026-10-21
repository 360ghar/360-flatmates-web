import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextArea } from "@/components/ui/Input";
import { RadioGroup } from "radix-ui";
import { cn, focusRing } from "@/components/ui/component-utils";

/** 1 to 5 stars as a radio group: one tab stop, arrow keys move. */
function StarRating({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const lit = hovered || value;
  return (
    <RadioGroup.Root
      aria-labelledby="visit-rating-label"
      orientation="horizontal"
      value={value ? String(value) : ""}
      onValueChange={(v) => onChange(Number(v))}
      className="-ml-1.5 flex"
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <RadioGroup.Item
          key={star}
          value={String(star)}
          aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
          className={cn("grid h-11 w-11 place-items-center rounded-cut-md transition-colors", focusRing, lit >= star ? "text-marigold" : "text-ink-3")}
          onMouseEnter={() => setHovered(star)}
        >
          <Star aria-hidden="true" className="h-7 w-7" fill={lit >= star ? "currentColor" : "none"} />
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
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
      <Card className="p-5">
        <p className="text-body-md font-semibold text-pine">Thanks. Your feedback is saved.</p>
      </Card>
    );
  }

  if (!visitCompleted) return null;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-h3 text-ink">How was the visit?</h2>
      <div className="flex flex-col gap-1">
        <span id="visit-rating-label" className="text-label-lg text-ink">Your rating</span>
        <StarRating value={feedbackRating} onChange={onFeedbackRatingChange} />
      </div>
      <TextArea
        label="Comments (optional)"
        placeholder="What went well, what did not"
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
        Send feedback
      </Button>
    </Card>
  );
}
