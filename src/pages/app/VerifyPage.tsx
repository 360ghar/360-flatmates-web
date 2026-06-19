import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CheckCircle2, Shield, Smartphone, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StepProgress } from "@/components/ui/StepProgress";

// PLACEHOLDER: this page is a stub while the real verification flow (ID
// upload + admin review + automatic phone/email cross-checks) is built out.
// Per the B-* ticket series, the implementation is blocked on the backend
// verification endpoints and the AdminQueue wiring. Until that lands, the
// "Verify" button on each step just advances a local `completed` counter so
// the UI can be exercised end-to-end. Replace with real status fetches
// (`useVerificationStatus`) and side-effecting mutations once the API ships.

const STEPS = [
  { key: "phone" as const, label: "Phone Verified", icon: Smartphone },
  { key: "id" as const, label: "ID Verification", icon: Shield },
  { key: "profile" as const, label: "Profile Complete", icon: UserCheck },
];

export function VerifyPage() {
  const navigate = useNavigate();
  // Number of steps completed (0..STEPS.length). The "current" step is the
  // first not-yet-completed one.
  const [completed, setCompleted] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const allDone = completed >= STEPS.length;
  const progress = (completed / STEPS.length) * 100;

  // Land focus on the page heading for keyboard and screen-reader users.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-5 page-fade mx-auto max-w-lg">
      <div className="flex items-center gap-3">
        <Button variant="icon" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h1 ref={headingRef} tabIndex={-1} className="text-h1 outline-none">Verification</h1>
      </div>

      <Card className="flex flex-col items-center gap-4 p-6 text-center">
        <ProgressRing value={progress} size="xl" />
        <p className="text-body-md text-ink-2" aria-live="polite">
          {allDone
            ? "You're verified. Your badge is now visible across the community."
            : "Complete all steps to earn your verified badge and build trust with the community."}
        </p>
      </Card>

      <StepProgress
        totalSteps={STEPS.length}
        currentStep={Math.min(completed, STEPS.length - 1)}
        variant="linear"
        labels={STEPS.map((s) => s.label)}
      />

      <Card className="divide-y divide-line p-0">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isComplete = i < completed;
          const isCurrent = !allDone && i === completed;

          return (
            <div
              key={step.key}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isComplete
                    ? "bg-success-soft text-success"
                    : isCurrent
                    ? "bg-accent-soft text-accent"
                    : "bg-paper-3 text-ink-4"
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
                ) : (
                  <Icon aria-hidden="true" className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-body-md font-semibold text-ink">{step.label}</p>
                <p className="text-caption text-ink-3">
                  {isComplete ? "Completed" : isCurrent ? "In progress" : "Pending"}
                </p>
              </div>
              {isCurrent && (
                <Button
                  size="compact"
                  onClick={() => setCompleted((c) => Math.min(c + 1, STEPS.length))}
                >
                  Verify
                </Button>
              )}
            </div>
          );
        })}
      </Card>

      {allDone && (
        <Button fullWidth onClick={() => navigate("/profile")}>
          Done
        </Button>
      )}
    </div>
  );
}
