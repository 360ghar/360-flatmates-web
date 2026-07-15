import {
  CLEANLINESS_VALUES,
  GUESTS_POLICY_VALUES,
  LIFESTYLE_DIMENSIONS,
  SLEEP_SCHEDULE_VALUES
} from "@/lib/data";
import type {
  Cleanliness,
  FoodHabits,
  GuestsPolicy,
  LifestyleDimensionKey,
  SleepSchedule,
  SmokingDrinking,
  WorkStyle
} from "@/lib/data";
import type { DimensionScorer } from "./types";

export const COMPATIBILITY_MATCH_THRESHOLD = 60;

export const COMPATIBILITY_WEIGHTS = {
  sleep_schedule: 0.2,
  cleanliness: 0.2,
  food_habits: 0.15,
  smoking_drinking: 0.2,
  guests_policy: 0.15,
  work_style: 0.1
} as const satisfies Record<LifestyleDimensionKey, number>;

export const COMPATIBILITY_LABELS = Object.fromEntries(
  LIFESTYLE_DIMENSIONS.map((dimension) => [dimension.key, dimension.label])
) as Record<LifestyleDimensionKey, string>;

function scoreOrdered<TValue extends string>(
  values: readonly TValue[],
  exactScore: number,
  adjacentScore: number,
  distantScore: number
): DimensionScorer<TValue> {
  return (userValue, peerValue) => {
    if (!userValue || !peerValue) {
      return 0;
    }

    const distance = Math.abs(values.indexOf(userValue) - values.indexOf(peerValue));

    if (distance === 0) {
      return exactScore;
    }

    if (distance === 1) {
      return adjacentScore;
    }

    return distantScore;
  };
}

export const scoreSleepSchedule: DimensionScorer<SleepSchedule> = scoreOrdered(
  SLEEP_SCHEDULE_VALUES,
  100,
  50,
  0
);

export const scoreCleanliness: DimensionScorer<Cleanliness> = scoreOrdered(
  CLEANLINESS_VALUES,
  100,
  50,
  0
);

export const scoreGuestsPolicy: DimensionScorer<GuestsPolicy> = scoreOrdered(
  GUESTS_POLICY_VALUES,
  100,
  60,
  20
);

export const scoreFoodHabits: DimensionScorer<FoodHabits> = (
  userValue,
  peerValue
) => {
  if (!userValue || !peerValue) {
    return 0;
  }

  if (userValue === peerValue) {
    return 100;
  }

  if (userValue === "no_preference" || peerValue === "no_preference") {
    return 70;
  }

  // Strict diets: vegetarian and vegan are compatible with each other
  const strict = new Set(["vegetarian", "vegan"]);
  if (strict.has(userValue) && strict.has(peerValue)) {
    return 100;
  }
  // One strict, other not
  if (strict.has(userValue) || strict.has(peerValue)) {
    return 0;
  }

  // Both non-strict (non_vegetarian, eggetarian)
  return 80;
};

export const scoreSmokingDrinking: DimensionScorer<SmokingDrinking> = (
  userValue,
  peerValue
) => {
  if (!userValue || !peerValue) {
    return 0;
  }

  if (userValue === peerValue) {
    return 100;
  }

  if (userValue === "both_fine" || peerValue === "both_fine") {
    return 70;
  }

  // Non-smoker set: neither, drink_occasionally
  const nonSmoker = new Set(["neither", "drink_occasionally"]);
  if (nonSmoker.has(userValue) && nonSmoker.has(peerValue)) {
    return 80;
  }

  // One smokes, other doesn't
  return 30;
};

export const scoreWorkStyle: DimensionScorer<WorkStyle> = (
  userValue,
  peerValue
) => {
  if (!userValue || !peerValue) {
    return 0;
  }

  if (userValue === peerValue) {
    return 100;
  }

  return 70;
};

