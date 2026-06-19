import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useReportUserMutation } from "@/hooks/queries/useReports";
import { uiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextArea, SelectField } from "@/components/ui/Input";
import type { UserReportReason } from "@/lib/data";

const REPORT_REASONS: Array<{ value: UserReportReason; label: string }> = [
  { value: "spam", label: "Spam" },
  { value: "fake_profile", label: "Fake Profile" },
  { value: "abuse", label: "Abuse" },
  { value: "inappropriate", label: "Inappropriate Content" },
  { value: "other", label: "Other" }
];

export function ReportProblemPage() {
  const navigate = useNavigate();
  const reportMutation = useReportUserMutation();
  const [reason, setReason] = useState<UserReportReason>("other");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showDescError, setShowDescError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setShowDescError(true);
      return;
    }
    setShowDescError(false);

    // TODO(wire): the user-reports endpoint (/flatmates/reports) expects a
    // target user (see A-8), but this is a general problem report with no
    // target. The backend needs to define a separate problem-report wire
    // (see B-2) before this form can be wired correctly. Until then we
    // post to the user-reports endpoint without a target and rely on the
    // server to surface the mismatch in tests rather than in production.
    reportMutation.mutate(
      {
        // General problem report — no target user
        reason,
        notes: description.trim()
      },
      {
        onSuccess: () => {
          uiStore.getState().pushToast({
            type: "success",
            title: "Report submitted",
            description: "Thank you for your feedback. We will look into it."
          });
          setSubmitted(true);
        },
        onError: () => {
          uiStore.getState().pushToast({
            type: "error",
            title: "Submission failed",
            description: "Could not submit your report. Please try again."
          });
        }
      }
    );
  }

  const isSubmitting = reportMutation.isPending;

  if (submitted) {
    return (
      <div className="flex flex-col gap-5 page-fade">
        <div className="flex items-center gap-3">
          <Button variant="icon" size="icon" onClick={() => navigate("/profile")}>
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </Button>
          <h1 className="text-h1">Report a Problem</h1>
        </div>
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
            <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-h3 text-ink">Thank you!</h2>
          <p className="text-body-md text-ink-2 max-w-sm">
            Your report has been submitted. We appreciate your feedback and will look into it.
          </p>
          <Button className="mt-2" onClick={() => navigate("/profile")}>
            Back to Profile
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 page-fade">
      <div className="flex items-center gap-3">
        <Button variant="icon" size="icon" onClick={() => navigate("/profile")}>
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h1 className="text-h1">Report a Problem</h1>
      </div>

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <SelectField
            label="Reason"
            options={REPORT_REASONS}
            value={reason}
            onChange={(e) => setReason(e.target.value as UserReportReason)}
          />

          <TextArea
            label="Description"
            placeholder="Tell us what went wrong or what you would like to see..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (showDescError && e.target.value.trim()) setShowDescError(false);
            }}
            error={showDescError ? "Please describe the problem" : undefined}
            rows={5}
          />

          <Button
            type="submit"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Submit Report
          </Button>
        </form>
      </Card>
    </div>
  );
}
