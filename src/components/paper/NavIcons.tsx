import type { SVGProps } from "react";

/* Cut-paper nav icons (DESIGN.md §9): filled silhouettes on a 24 grid with
   cut-out holes (even-odd), matching the scene art. Colour = currentColor. */

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
      d="M14 2.5h4.5v3.2H14zM3 7.2h18.2v1.6H20V21.3H4V8.8H3zM7 11.2v3h3v-3zm7 0v3h3v-3zm-4 10.1h4v-5.1h-4z"
    />
  );
}

/** Folded paper map with a pin hole. */
export function ExploreIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d="M2.5 5.2 8.6 3l6.8 2.4 6.1-2.2v15.6l-6.1 2.2-6.8-2.4-6.1 2.2zM15 9.3a2.3 2.3 0 1 0-4.6 0c0 1.7 2.3 4.3 2.3 4.3S15 11 15 9.3z"
    />
  );
}

/** Two paper cards, one tilted behind the other. */
export function SwipeIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d="M4.2 6.9 12.6 4l4.9 14.3-8.4 2.9zM13.6 3.6l5.7 1.5c.9.2 1.4 1.1 1.2 2l-2.4 9.4z"
    />
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d="M12 21c-4.4-3.2-9-6.6-9-11.3C3 6.6 5.2 4.3 8 4.3c1.7 0 3.1.9 4 2.3.9-1.4 2.3-2.3 4-2.3 2.8 0 5 2.3 5 5.4 0 4.7-4.6 8.1-9 11.3z"
    />
  );
}

/** Paper sheet with a folded corner and a plus cut out. */
export function PostIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d="M5 2.5h9.5L19.5 7.5V21.5H5zM14 3.5v4.5h4.5zM11.2 10.5v2.8H8.4v1.8h2.8v2.8H13v-2.8h2.8v-1.8H13v-2.8z"
    />
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d="M12 2.8a4.3 4.3 0 1 1 0 8.6 4.3 4.3 0 0 1 0-8.6zM3.5 21.2c.4-4.6 4-7.6 8.5-7.6s8.1 3 8.5 7.6z"
    />
  );
}

/** Four hand-cut squares. */
export function MoreIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d="M3.4 3.6h7.3v7.2H3.2zM13.3 3.3h7.4v7.3h-7.3zM3.3 13.4h7.2v7.3H3.5zM13.4 13.3h7.3l-.1 7.4h-7.2z"
    />
  );
}

/** Bookmark ribbon with a notch cut into the tail. */
export function SavedIcon(props: IconProps) {
  return <PaperIcon {...props} d="M6 2.8h12.2V21.4l-6.1-4.3-6.1 4.3z" />;
}

/** Speech bubble with two dots cut out. */
export function ChatsIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d="M4.6 3.6h14.8c.9 0 1.6.7 1.6 1.6v10.2c0 .9-.7 1.6-1.6 1.6H11l-4.8 3.9.4-3.9h-2c-.9 0-1.6-.7-1.6-1.6V5.2c0-.9.7-1.6 1.6-1.6zM8.2 8.7h2.4v2.4H8.2zm5.2 0h2.4v2.4h-2.4z"
    />
  );
}

/** Three paper bars of rising height. */
export function DashboardIcon(props: IconProps) {
  return <PaperIcon {...props} d="M3.4 13.4h4.4v7.4H3.3zM9.8 8.3h4.4l.1 12.5H9.7zM16.3 3.4h4.4v17.4h-4.5z" />;
}

/** Calendar page with the two ring holes and one day cut out. */
export function VisitsIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d="M3.2 5.2h17.6v16.2H3.2zM6.8 2.6h2.2v4.4H6.8zm8.2 0h2.2v4.4H15zM13.6 13.2v4.2h4.2v-4.2z"
    />
  );
}

/** Bell with the clapper as a separate cut piece. */
export function AlertsIcon(props: IconProps) {
  return (
    <PaperIcon
      {...props}
      d="M12 2.6c.8 0 1.4.6 1.4 1.3 2.8.7 4.4 3 4.4 6.2v4.2l2 2.5H4.2l2-2.5v-4.2c0-3.2 1.6-5.5 4.4-6.2 0-.7.6-1.3 1.4-1.3zM9.8 18.4h4.4a2.2 2.2 0 0 1-4.4 0z"
    />
  );
}

/** Paper disc, half cut away: light / dark. */
export function AppearanceIcon(props: IconProps) {
  return <PaperIcon {...props} d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 2.2v13.6a6.8 6.8 0 0 0 0-13.6z" />;
}
