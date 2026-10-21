import { userMessage } from "@/lib/api/errors";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useMyProfile, useUpdateProfile } from "@/hooks/queries/useProfiles";
import type { UserMode } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChoiceCards } from "@/components/ui/ChoiceCards";
import { MODE_CHOICES } from "@/features/onboarding/components/OnboardingModeStep";
import { uiStore } from "@/lib/stores/ui-store";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiClientError } from "@/lib/api/errors";


export function ChooseRolePage() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const [selected, setSelected] = useState<UserMode | null>(profile?.mode ?? null);
  const [submitting, setSubmitting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Preselect the saved mode once the profile finishes loading. The initial
  // useState ran before `profile` resolved, so seed it here without clobbering
  // a fresh user choice.
  const syncedFromProfile = useRef(false);
  useEffect(() => {
    if (profile?.mode && !syncedFromProfile.current) {
      syncedFromProfile.current = true;
      setSelected((prev) => prev ?? (profile.mode as UserMode));
    }
  }, [profile?.mode]);

  // Move focus to the heading on mount for screen-reader and keyboard context.
  useEffect(() => {
    if (!isLoading) {
      headingRef.current?.focus();
    }
  }, [isLoading]);

  async function handleContinue() {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await updateProfile.mutateAsync({ mode: selected });
      navigate("/home");
    } catch (err: unknown) {
      // Drive the toast copy off the structured AppError so the user gets a
      // useful message for network failures / 401s / 5xx instead of a
      // catch-all "try again". Falls back to a generic message for
      // non-ApiClientError throws.
      let title = "Could not save preference";
      let description = "Please try again.";

      if (err instanceof ApiClientError) {
        const { type, message } = err.appError;
        if (type === "network") {
          title = "You're offline";
          description = "Check your connection and try again.";
        } else if (type === "auth") {
          title = "Session expired";
          description = "Please sign in again to continue.";
        } else if (type === "validation") {
          title = "We couldn't save that choice";
          description = message;
        } else if (type === "server") {
          title = "Server hiccup";
          description = "Our servers are having a moment. Please try again in a bit.";
        } else {
          description = message;
        }
      } else {
        description = userMessage(err);
      }

      uiStore.getState().pushToast({ type: "error", title, description });
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[76px] w-full rounded-hand" />
          ))}
        </div>
        <Skeleton className="h-[52px] w-full rounded-cut-md" />
      </div>
    );
  }

  return (
    <div className="page-fade flex flex-col gap-6">
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-h1 text-ink outline-none">
          How will you use 360?
        </h1>
        <p className="mt-2 text-body-lg text-ink-2">You can change this later in your profile.</p>
      </div>

      <ChoiceCards label="How will you use 360?" options={MODE_CHOICES} value={selected} onValueChange={setSelected} />

      <Button fullWidth disabled={!selected} loading={submitting} onClick={handleContinue}>
        Continue
      </Button>
    </div>
  );
}
