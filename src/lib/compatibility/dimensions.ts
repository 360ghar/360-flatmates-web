import {
  CLEANLINESS_VALUES,
  DRINKING_VALUES,
  GUESTS_POLICY_VALUES,
  LIFESTYLE_DIMENSIONS,
  SLEEP_SCHEDULE_VALUES,
  SMOKING_VALUES
} from "@/lib/data";
import type {
  Cleanliness,
  DrinkingType,
  FoodHabits,
  GuestsPolicy,
  LifestyleDimensionKey,
  SleepSchedule,
  SmokingType,
  WorkStyle
} from "@/lib/data";
import type { DimensionScorer } from "./types";

export const COMPATIBILITY_MATCH_THRESHOLD = 60;

export const COMPATIBILITY_WEIGHTS = {
  sleep_schedule: 0.2,
  cleanliness: 0.2,
  food_habits: 0.15,
  smoking: 0.1,
  drinking: 0.1,
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

/** Same spectrum for smoking: never vs occasionally scores higher than
 *  never vs regularly, and exact matches are perfect. Values match the
 *  backend `_score_lifestyle_level` (100/70/40) and the Flutter engine so
 *  all surfaces agree on a pair's score and color. */
export const scoreSmoking: DimensionScorer<SmokingType> = scoreOrdered(
  SMOKING_VALUES,
  100,
  70,
  40
);

/** Same spectrum for drinking: never vs occasionally scores higher than
 *  never vs regularly, and exact matches are perfect. */
export const scoreDrinking: DimensionScorer<DrinkingType> = scoreOrdered(
  DRINKING_VALUES,
  100,
  70,
  40
);

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

