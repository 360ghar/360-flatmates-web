import type { ComponentType, SVGProps } from "react";
import type { UserMode } from "@/components/ui/Badge";
import {
  AlertsIcon,
  ChatsIcon,
  DashboardIcon,
  ExploreIcon,
  HeartIcon,
  HomeIcon,
  PostIcon,
  ProfileIcon,
  SavedIcon,
  SwipeIcon,
  VisitsIcon
} from "@/components/paper/NavIcons";

export interface NavItemConfig {
  label: string;
  /** One-word label for the phone tab bar; `label` stays the accessible name. */
  shortLabel?: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  showFor: UserMode[];
  /** Unread count shown on the item. */
  badge?: number;
  /** Starts a new group in the sidebar (space above it, no divider). */
  groupStart?: boolean;
}

const ALL: UserMode[] = ["room_poster", "co_hunter", "open_to_both"];
const HOSTS: UserMode[] = ["room_poster", "open_to_both"];
const HUNTERS: UserMode[] = ["co_hunter", "open_to_both"];

export const NAV_ITEMS: NavItemConfig[] = [
  { label: "Home", href: "/home", icon: HomeIcon, showFor: ALL },
  { label: "Explore", href: "/explore", icon: ExploreIcon, showFor: HUNTERS },
  { label: "Swipe", href: "/swipe", icon: SwipeIcon, showFor: ALL },
  { label: "Likes", href: "/likes", icon: HeartIcon, showFor: ALL },
  { label: "Chats", href: "/chats", icon: ChatsIcon, showFor: ALL },
  { label: "Your listings", shortLabel: "Listings", href: "/manage", icon: PostIcon, showFor: HOSTS, groupStart: true },
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon, showFor: HOSTS },
  { label: "Visits", href: "/visits", icon: VisitsIcon, showFor: ALL },
  { label: "Saved searches", shortLabel: "Saved", href: "/saved-searches", icon: SavedIcon, showFor: ALL, groupStart: true },
  { label: "Search alerts", shortLabel: "Alerts", href: "/alerts", icon: AlertsIcon, showFor: ALL },
  { label: "Profile", href: "/profile", icon: ProfileIcon, showFor: ALL, groupStart: true }
];

/** The four phone tabs before "More", per mode. Everything else lives in More. */
export const MOBILE_TABS: Record<UserMode, string[]> = {
  room_poster: ["/home", "/swipe", "/chats", "/manage"],
  co_hunter: ["/home", "/explore", "/swipe", "/chats"],
  open_to_both: ["/home", "/explore", "/swipe", "/chats"],
  seeker: ["/home", "/explore", "/swipe", "/chats"]
};

export function isNavActive(href: string, activeHref?: string): boolean {
  if (!activeHref) return false;
  if (href === "/home") return activeHref === "/home" || activeHref === "/";
  return activeHref === href || activeHref.startsWith(href + "/");
}

export interface ShellUser {
  name: string;
  avatarUrl?: string | null;
  mode?: UserMode;
  city?: string;
}
