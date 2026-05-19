import { useState } from "react";
import { useNavigate } from "react-router";
import { Home, Search, Shuffle, Users } from "lucide-react";
import { useMyProfile, useUpdateProfile } from "@/hooks/queries";
import type { UserMode } from "@/components/ui/Badge";
import { FLATMATE_MODE_OPTIONS } from "@/lib/data/domain";
import { Button } from "@/components/ui/Button";
import { SelectableCardGrid } from "@/components/molecules/SelectableCardGrid";
import { uiStore } from "@/lib/stores/ui-store";
import { Skeleton } from "@/components/ui/Skeleton";

const MODE_ICONS: Record<UserMode, React.ReactNode> = {
  room_poster: <Home aria-hidden="true" className="h-6 w-6" />,
  seeker: <Users aria-hidden="true" className="h-6 w-6" />,
  co_hunter: <Search aria-hidden="true" className="h-6 w-6" />,
  open_to_both: <Shuffle aria-hidden="true" className="h-6 w-6" />,
};

export function ChooseRolePage() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const [selected, setSelected] = useState<UserMode | null>(profile?.mode ?? null);
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await updateProfile.mutateAsync({ mode: selected });
      navigate("/home");
    } catch {
      uiStore.getState().pushToast({
        type: "error",
        title: "Could not save preference",
        description: "Please try again.",
      });
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
        <h1 className="text-h1">How do you want to use 360 Flatmates?</h1>
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
