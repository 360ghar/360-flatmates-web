import type { FlatmatesPeer } from "@/lib/api/types";
import { LIFESTYLE_DIMENSIONS } from "@/lib/data";
import type { LifestyleDimensionKey } from "@/lib/data";
import {
  COMPATIBILITY_LABELS,
  COMPATIBILITY_MATCH_THRESHOLD,
  COMPATIBILITY_WEIGHTS,
  scoreCleanliness,
  scoreFoodHabits,
  scoreGuestsPolicy,
  scoreSleepSchedule,
  scoreSmokingDrinking,
  scoreWorkStyle
} from "./dimensions";
import type {
  CompatibilityDimensionResult,
  CompatibilityProfile,
  CompatibilityResult
} from "./types";

export function getCompatibilityColor(score: number): CompatibilityResult["color"] {
  if (score >= 70) {
    return "green";
  }

  if (score >= 40) {
    return "amber";
  }

  return "red";
}

function formatDimensionSummary(
  key: LifestyleDimensionKey,
  score: number,
  userValue?: string,
  peerValue?: string
): string {
  const label = COMPATIBILITY_LABELS[key];

  if (!userValue || !peerValue) {
    return `${label}: incomplete profile data`;
  }

  if (score >= 90) {
    return `${label}: strong match`;
  }

  if (score >= COMPATIBILITY_MATCH_THRESHOLD) {
    return `${label}: workable match`;
  }

  return `${label}: preference gap`;
}

function scoreDimension(
  key: LifestyleDimensionKey,
  user: CompatibilityProfile,
  peer: CompatibilityProfile
): number {
  switch (key) {
    case "sleep_schedule":
      return scoreSleepSchedule(user.sleep_schedule, peer.sleep_schedule);
    case "cleanliness":
      return scoreCleanliness(user.cleanliness, peer.cleanliness);
    case "food_habits":
      return scoreFoodHabits(user.food_habits, peer.food_habits);
    case "smoking_drinking":
      return scoreSmokingDrinking(user.smoking_drinking, peer.smoking_drinking);
    case "guests_policy":
      return scoreGuestsPolicy(user.guests_policy, peer.guests_policy);
    case "work_style":
      return scoreWorkStyle(user.work_style, peer.work_style);
  }
}

export function calculateCompatibility(
  user: CompatibilityProfile,
  peer: CompatibilityProfile
): CompatibilityResult {
  const dimensions = LIFESTYLE_DIMENSIONS.map((definition) => {
    const key = definition.key;
    const userValue = user[key];
    const peerValue = peer[key];
    const score = scoreDimension(key, user, peer);

    return {
      name: key,
      label: definition.label,
      weight: COMPATIBILITY_WEIGHTS[key],
      user_value: userValue,
      peer_value: peerValue,
      score,
      match: score >= COMPATIBILITY_MATCH_THRESHOLD,
      summary: formatDimensionSummary(key, score, userValue, peerValue)
    } satisfies CompatibilityDimensionResult;
  });

  const weightedScore = dimensions.reduce(
    (total, dimension) => total + dimension.score * dimension.weight,
    0
  );
  const overall = Math.round(weightedScore);

  return {
    user_id: user.id,
    peer_id: peer.id,
    overall_percentage: overall,
    color: getCompatibilityColor(overall),
    dimensions,
    summary: dimensions.map((dimension) => dimension.summary)
  };
}

export function toApiCompatibilityBreakdown(
  result: CompatibilityResult
): {
  user_id: number;
  peer_id: number;
  overall_percentage: number;
  color: CompatibilityResult["color"];
  dimensions: Array<{
    name: LifestyleDimensionKey;
    weight: number;
    user_value?: string;
    peer_value?: string;
    score: number;
    match: boolean;
  }>;
  summary: string[];
} {
  return {
    user_id: result.user_id ?? 0,
    peer_id: result.peer_id ?? 0,
    overall_percentage: result.overall_percentage,
    color: result.color,
    dimensions: result.dimensions.map((dimension) => ({
      name: dimension.name,
      weight: dimension.weight,
      user_value: dimension.user_value,
      peer_value: dimension.peer_value,
      score: dimension.score,
      match: dimension.match
    })),
    summary: result.summary
  };
}

export function rankPeersByCompatibility<TPeer extends FlatmatesPeer>(
  user: CompatibilityProfile,
  peers: readonly TPeer[]
): Array<TPeer & { match_percentage: number }> {
  return peers
    .map((peer) => ({
      ...peer,
      match_percentage: calculateCompatibility(user, peer).overall_percentage
    }))
    .sort((left, right) => right.match_percentage - left.match_percentage);
}
