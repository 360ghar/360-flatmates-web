import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useSubmitBugReportMutation } from "@/hooks/queries/useReports";
import { uiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, TextArea, SelectField } from "@/components/ui/Input";
import type { BugType } from "@/lib/api/types";

const PROBLEM_TYPES: Array<{ value: BugType; label: string }> = [
  { value: "functionality_bug", label: "Something is broken" },
  { value: "ui_bug", label: "UI or layout problem" },
  { value: "performance_issue", label: "Slow or laggy experience" },
  { value: "feature_request", label: "Feature request" },
  { value: "other", label: "Other" }
];

export function ReportProblemPage() {
  const navigate = useNavigate();
  const reportMutation = useSubmitBugReportMutation();
  const [problemType, setProblemType] = useState<BugType>("other");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showTitleError, setShowTitleError] = useState(false);
  const [showDescError, setShowDescError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (!trimmedTitle) {
      setShowTitleError(true);
    }
    if (!trimmedDescription) {
      setShowDescError(true);
    }
    if (!trimmedTitle || !trimmedDescription) return;
    setShowTitleError(false);
    setShowDescError(false);

    reportMutation.mutate(
      {
        source: "web",
        bug_type: problemType,
        severity: "medium",
        title: trimmedTitle,
        description: trimmedDescription,
        tags: ["report_problem"]
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
          <Button
            aria-label="Back to profile"
            variant="icon"
            size="icon"
            onClick={() => navigate("/profile")}
          >
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
        <Button
          aria-label="Back to profile"
          variant="icon"
          size="icon"
          onClick={() => navigate("/profile")}
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h1 className="text-h1">Report a Problem</h1>
      </div>

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Title"
            placeholder="Short summary of the problem"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (showTitleError && e.target.value.trim()) setShowTitleError(false);
            }}
            error={showTitleError ? "Please add a title" : undefined}
          />

          <SelectField
            label="Problem type"
            options={PROBLEM_TYPES}
            value={problemType}
            onChange={(e) => setProblemType(e.target.value as BugType)}
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
