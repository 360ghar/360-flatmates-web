import { Home, Moon, PartyPopper, Sparkles, Users, Utensils, Wind } from "lucide-react";
import type { CompatibilityDimensionResult } from "@/lib/compatibility/types";
import type { SwipeDirection, SwipeProfile } from "./swipeDeck.types";

export const SWIPE_THRESHOLD_X = 120;
export const SWIPE_VELOCITY_X = 500;
export const SWIPE_THRESHOLD_Y = 80;
export const SWIPE_VELOCITY_Y = 400;
export const MAX_ROTATION = 15;
export const ROTATION_RANGE = 200;

// Slightly higher thresholds when expanded to avoid accidental swipes while scrolling
export const EXPANDED_SWIPE_THRESHOLD_X = 160;
export const EXPANDED_SWIPE_VELOCITY_X = 600;

export const LIFESTYLE_ITEMS = [
  { key: "sleepSchedule" as const, dimKey: "sleep_schedule", icon: Moon, label: "Sleep Schedule" },
  { key: "cleanliness" as const, dimKey: "cleanliness", icon: Sparkles, label: "Cleanliness" },
  { key: "foodHabits" as const, dimKey: "food_habits", icon: Utensils, label: "Food Habits" },
  { key: "smokingDrinking" as const, dimKey: "smoking_drinking", icon: Wind, label: "Smoking / Drinking" },
  { key: "guestsPolicy" as const, dimKey: "guests_policy", icon: Users, label: "Guests Policy" },
  { key: "workStyle" as const, dimKey: "work_style", icon: Home, label: "Work Style" },
  { key: "partyHabit" as const, dimKey: "party_habit", icon: PartyPopper, label: "Party Habit" }
] as const;

export const DIMENSION_ICONS: Record<string, typeof Moon> = {
  sleep_schedule: Moon,
  cleanliness: Sparkles,
  food_habits: Utensils,
  smoking_drinking: Wind,
  guests_policy: Users,
  work_style: Home
};

export function dimensionBarColor(match: boolean, score: number): string {
  if (match || score >= 70) return "bg-success";
  if (score >= 40) return "bg-warning";
  return "bg-error";
}

export function dimensionScoreText(match: boolean, score: number): string {
  if (match || score >= 70) return "text-success";
  if (score >= 40) return "text-warning";
  return "text-error";
}

export function matchToneLabel(score: number): string {
  if (score >= 70) return "Great match";
  if (score >= 40) return "Workable";
  return "Preference gaps";
}

export function dimensionBuckets(dims: CompatibilityDimensionResult[]) {
  let aligned = 0;
  let workable = 0;
  let gaps = 0;
  for (const d of dims) {
    if (d.score >= 70) aligned++;
    else if (d.score >= 40) workable++;
    else gaps++;
  }
  return { aligned, workable, gaps };
}

export function profilePhotos(profile: SwipeProfile): string[] {
  const urls = [
    ...(profile.imageUrls ?? []),
    ...(profile.photoUrl ? [profile.photoUrl] : [])
  ].filter((u): u is string => Boolean(u && u.trim()));
  return Array.from(new Set(urls));
}

export function getExitAnimation(direction: SwipeDirection) {
  const xTarget = direction === "right" ? 500 : direction === "left" ? -500 : 0;
  const yTarget = direction === "up" ? -500 : 0;
  const rotateTarget =
    direction === "right" ? MAX_ROTATION : direction === "left" ? -MAX_ROTATION : 0;

  return {
    x: xTarget,
    y: yTarget,
    rotate: rotateTarget,
    opacity: 0,
    transition: { duration: 0.3, ease: "easeOut" as const }
  };
}
