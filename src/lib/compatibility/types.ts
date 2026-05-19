import type {
  Cleanliness,
  FoodHabits,
  GuestsPolicy,
  LifestyleDimensionKey,
  SleepSchedule,
  SmokingDrinking,
  WorkStyle
} from "@/lib/data";
import type { CompatibilityColor } from "@/lib/data";

export interface CompatibilityProfile {
  id?: number;
  sleep_schedule?: SleepSchedule;
  cleanliness?: Cleanliness;
  food_habits?: FoodHabits;
  smoking_drinking?: SmokingDrinking;
  guests_policy?: GuestsPolicy;
  work_style?: WorkStyle;
}

export interface CompatibilityDimensionResult {
  name: LifestyleDimensionKey;
  label: string;
  weight: number;
  user_value?: string;
  peer_value?: string;
  score: number;
  match: boolean;
  summary: string;
}

export interface CompatibilityResult {
  user_id?: number;
  peer_id?: number;
  overall_percentage: number;
  color: CompatibilityColor;
  dimensions: CompatibilityDimensionResult[];
  summary: string[];
}

export type DimensionScorer<TValue extends string> = (
  userValue: TValue | undefined,
  peerValue: TValue | undefined
) => number;

