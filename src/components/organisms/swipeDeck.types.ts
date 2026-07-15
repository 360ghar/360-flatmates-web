import type { HTMLAttributes, ReactNode } from "react";
import type { UserMode } from "../ui/Badge";
import type { CompatibilityDimensionResult } from "@/lib/compatibility/types";

export interface SwipeProfile {
  id: string;
  name: string;
  age?: number;
  photoUrl?: string | null;
  mode?: UserMode;
  verified?: boolean;
  location?: string;
  matchScore: number;
  topMatches?: string[];
  moveInLabel?: string;
  /* Rich profile fields for expanded view */
  bio?: string;
  profession?: string;
  budgetMin?: number;
  budgetMax?: number;
  moveInTimeline?: string;
  sleepSchedule?: string;
  cleanliness?: string;
  foodHabits?: string;
  smokingDrinking?: string;
  guestsPolicy?: string;
  workStyle?: string;
  gender?: string;
  genderPreference?: string;
  nonNegotiables?: string[];
  hasPets?: boolean;
  partyHabit?: string;
  /** Full 6-dimension breakdown (client-computed or from API). */
  compatibilityDimensions?: CompatibilityDimensionResult[];
  /* Listing context when the peer has an active flatmate/PG listing */
  propertyTitle?: string;
  imageUrls?: string[];
  monthlyRent?: number | null;
  securityDeposit?: number | null;
  maintenance?: number | null;
  roomType?: string | null;
  flatConfig?: string | null;
  floor?: string | null;
  societyName?: string | null;
  flatAmenities?: string[];
  societyAmenities?: string[];
  amenities?: string[];
  features?: string[];
  furnishing?: string[];
  availableFrom?: string | null;
  areaSqft?: number | null;
  bedrooms?: number | null;
  totalFloors?: number | null;
  videoTourUrl?: string | null;
  details?: ReactNode;
}

export interface SwipeDeckProps extends HTMLAttributes<HTMLDivElement> {
  profiles: SwipeProfile[];
  currentIndex?: number;
  onPass?: (profileId: string) => void;
  onLike?: (profileId: string) => void;
  onSuperLike?: (profileId: string) => void;
  onExpand?: (profileId: string) => void;
  onEmptyAction?: () => void;
  /** Callback when the deck is running low on cards (within 3 of the end) */
  onNearEnd?: () => void;
  /** Controlled by SwipePage to disable gestures during API mutation */
  isAnimating?: boolean;
  /** Called when the active card index changes (for keyboard swipe integration) */
  onIndexChange?: (index: number) => void;
  /** When true, taps on cards toggle their selection in a multi-select set. */
  multiSelect?: boolean;
  /** The currently-selected set of profile ids (controlled). */
  selectedIds?: string[];
  /** Fires when the user toggles a card in multi-select mode. */
  onSelectToggle?: (profileId: string) => void;
  /** Fires when the user confirms a multi-select action (e.g. "Remove selected"). */
  onMultiSelectAction?: (selectedIds: string[]) => void;
  /** Label for the multi-select confirm button. Defaults to "Remove selected". */
  multiSelectActionLabel?: string;
}

export type SwipeDirection = "left" | "right" | "up" | null;
