import type { SVGProps } from "react";
import { paperArt } from "./art";

/* Cut-paper nav icons (DESIGN.md §9): filled silhouettes on a 24 grid with
   cut-out holes (even-odd), matching the scene art. Colour = currentColor.
   Paths live in scripts/generate-paper-art.py (shared with the Flutter app). */

type IconProps = SVGProps<SVGSVGElement>;

function PaperIcon({ d, ...props }: IconProps & { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...props}>
      <path d={d} fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

/** Flat-roof house with a water tank, a window and a door cut out. */
export function HomeIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d={paperArt.navHome.d}
    />
  );
}

/** Folded paper map with a pin hole. */
export function ExploreIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d={paperArt.navExplore.d}
    />
  );
}

/** Two paper cards, one tilted behind the other. */
export function SwipeIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d={paperArt.navSwipe.d}
    />
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d={paperArt.navHeart.d}
    />
  );
}

/** Paper sheet with a folded corner and a plus cut out. */
export function PostIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d={paperArt.navPost.d}
    />
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d={paperArt.navProfile.d}
    />
  );
}

/** Four hand-cut squares. */
export function MoreIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d={paperArt.navMore.d}
    />
  );
}

/** Bookmark ribbon with a notch cut into the tail. */
export function SavedIcon(props: IconProps) {
  return <PaperIcon {...props} d={paperArt.navSaved.d} />;
}

/** Speech bubble with two dots cut out. */
export function ChatsIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d={paperArt.navChats.d}
    />
  );
}

/** Three paper bars of rising height. */
export function DashboardIcon(props: IconProps) {
  return <PaperIcon {...props} d={paperArt.navDashboard.d} />;
}

/** Calendar page with the two ring holes and one day cut out. */
export function VisitsIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d={paperArt.navVisits.d}
    />
  );
}

/** Bell with the clapper as a separate cut piece. */
export function AlertsIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d={paperArt.navAlerts.d}
    />
  );
}

/** Paper disc, half cut away: light / dark. */
export function AppearanceIcon(props: IconProps) {
  return <PaperIcon {...props} d={paperArt.navAppearance.d} />;
}
