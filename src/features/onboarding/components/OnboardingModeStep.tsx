import { ChoiceCards } from "@/components/ui/ChoiceCards";
import { ExploreIcon, HomeIcon, MoreIcon, SwipeIcon } from "@/components/paper/NavIcons";
import { FLATMATE_MODE_OPTIONS, type FlatmatesMode } from "@/lib/data";
import type { OnboardingDraft } from "@/lib/schemas/onboarding";

const ICONS: Record<FlatmatesMode, React.ReactNode> = {
  room_poster: <HomeIcon />,
  seeker: <ExploreIcon />,
  co_hunter: <SwipeIcon />,
  open_to_both: <MoreIcon />
};

/** The four ways to use 360, each with its cut-paper mark. Shared with /choose-role. */
export const MODE_CHOICES = FLATMATE_MODE_OPTIONS.map((o) => ({ ...o, icon: ICONS[o.value] }));

export function OnboardingModeStep({
  mode,
  patchDraft
}: {
  mode: FlatmatesMode;
  patchDraft: (patch: Partial<OnboardingDraft>) => void;
}) {
  return (
    <>
      <h2 className="text-h2 text-ink">How will you use 360?</h2>
      <ChoiceCards label="How will you use 360?" options={MODE_CHOICES} value={mode} onValueChange={(value) => patchDraft({ mode: value })} />
    </>
  );
}
