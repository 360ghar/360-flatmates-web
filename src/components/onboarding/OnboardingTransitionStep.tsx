import { Button } from "@/components/ui/Button";

/**
 * Bridge between the two wizard phases. Rendered as a regular step so the
 * existing draft persistence, deep-link, and Back/Next store flow keeps
 * working unchanged; "Continue" just advances to the first Phase 2 step.
 */
export function OnboardingTransitionStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h2 className="text-h2">Your information is set</h2>
      <p className="text-body-md text-ink-2">
        Let&apos;s match you with the right flatmates.
      </p>
      <Button fullWidth onClick={onContinue}>
        Continue
      </Button>
    </div>
  );
}
