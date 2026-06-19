import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Home, Search, Shuffle } from "lucide-react";
import { useMyProfile, useUpdateProfile } from "@/hooks/queries";
import type { UserMode } from "@/components/ui/Badge";
import { FLATMATE_MODE_OPTIONS } from "@/lib/data";
import { Button } from "@/components/ui/Button";
import { SelectableCardGrid } from "@/components/molecules/SelectableCardGrid";
import { uiStore } from "@/lib/stores/ui-store";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiClientError } from "@/lib/api/errors";

const MODE_ICONS: Record<UserMode, React.ReactNode> = {
  room_poster: <Home aria-hidden="true" className="h-6 w-6" />,
  seeker: <Search aria-hidden="true" className="h-6 w-6" />,
  co_hunter: <Search aria-hidden="true" className="h-6 w-6" />,
  open_to_both: <Shuffle aria-hidden="true" className="h-6 w-6" />,
};

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
      } else if (err instanceof Error) {
        description = err.message;
      }

      uiStore.getState().pushToast({ type: "error", title, description });
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 p-4 md:p-6 mx-auto max-w-lg">
        {/* Title + description */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        {/* 3 selectable card placeholders */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
        {/* Continue button */}
        <Skeleton className="h-[52px] w-full rounded-[10px]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 page-fade mx-auto max-w-lg">
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-h1 outline-none">
          How do you want to use 360 Flatmates?
        </h1>
        <p className="mt-2 text-body-md text-ink-2">
          You can change this anytime from your profile settings.
        </p>
      </div>

      <SelectableCardGrid<UserMode>
        options={FLATMATE_MODE_OPTIONS.map((o) => ({
          value: o.value as UserMode,
          label: o.label,
          description: o.description,
        }))}
        iconMap={MODE_ICONS}
        selected={selected}
        onSelect={setSelected}
      />

      <Button
        fullWidth
        disabled={!selected}
        loading={submitting}
        onClick={handleContinue}
      >
        Continue
      </Button>
    </div>
  );
}
