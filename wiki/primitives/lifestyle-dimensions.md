# Lifestyle dimensions

Active contributors: Saksham

The six lifestyle dimensions are the axes the compatibility engine scores. They are defined in `src/lib/data/domain.ts` as `LIFESTYLE_DIMENSIONS` (the canonical list with labels, weights, and options) and scored in `src/lib/compatibility/dimensions.ts` (per-dimension scorer functions, the weight map, and the match threshold). Each dimension is a small multiple-choice question the user answers during onboarding. The engine compares two users' answers per dimension, applies the dimension's weight, and sums to an overall percentage. See [compatibility profile](compatibility-profile.md) for the result shape.

## The six dimensions and their weights

The weights live in `COMPATIBILITY_WEIGHTS` in `src/lib/compatibility/dimensions.ts` and sum to exactly 1.0. The three lifestyle-flashpoint dimensions (sleep, cleanliness, smoking and drinking) carry the most weight.

| Dimension | Key | Weight |
| --- | --- | --- |
| Sleep Schedule | `sleep_schedule` | 0.20 |
| Cleanliness | `cleanliness` | 0.20 |
| Smoking/Drinking | `smoking_drinking` | 0.20 |
| Food Habits | `food_habits` | 0.15 |
| Guests Policy | `guests_policy` | 0.15 |
| Work Style | `work_style` | 0.10 |

## Options per dimension

Each dimension's allowed values and labels are listed in `LIFESTYLE_DIMENSIONS` and re-exported as their own `*_VALUES` arrays.

### Sleep Schedule (`SLEEP_SCHEDULE_VALUES`, weight 0.20)

| Value | Label |
| --- | --- |
| `early_bird` | Early Bird |
| `flexible` | Flexible |
| `night_owl` | Night Owl |

### Cleanliness (`CLEANLINESS_VALUES`, weight 0.20)

| Value | Label |
| --- | --- |
| `minimal` | Minimal |
| `tidy` | Tidy |
| `spotless` | Spotless |

### Food Habits (`FOOD_HABITS_VALUES`, weight 0.15)

| Value | Label |
| --- | --- |
| `vegetarian` | Vegetarian |
| `vegan` | Vegan |
| `non_vegetarian` | Non-Vegetarian |
| `eggetarian` | Eggetarian |
| `no_preference` | No Preference |

### Smoking/Drinking (`SMOKING_DRINKING_VALUES`, weight 0.20)

| Value | Label |
| --- | --- |
| `neither` | Neither |
| `smoke_outside` | Smoke Outside |
| `drink_occasionally` | Drink Occasionally |
| `both_fine` | Both Fine |

### Guests Policy (`GUESTS_POLICY_VALUES`, weight 0.15)

| Value | Label |
| --- | --- |
| `no_overnight_guests` | No Overnight Guests |
| `occasional_ok` | Occasional Guests OK |
| `open_house` | Open House |

### Work Style (`WORK_STYLE_VALUES`, weight 0.10)

| Value | Label |
| --- | --- |
| `wfh` | WFH |
| `office` | Office |
| `hybrid` | Hybrid |

## Scoring approach

Each dimension has a dedicated scorer of type `DimensionScorer<TValue>`, a function `(userValue, peerValue) => number` returning 0 to 100. All scorers return `0` if either value is missing (so an incomplete profile never scores artificially high). The scorers fall into two families.

### Ordered-distance scorers

`scoreSleepSchedule`, `scoreCleanliness`, and `scoreGuestsPolicy` use a shared `scoreOrdered` helper that treats the option list as an ordered spectrum and scores by the index distance between the two answers:

| Distance | Sleep / Cleanliness | Guests |
| --- | --- | --- |
| 0 (same) | 100 | 100 |
| 1 (adjacent) | 50 | 60 |
| 2+ (distant) | 0 | 20 |

Guests Policy is slightly more forgiving at distance 1 and 2 than sleep and cleanliness, reflecting that guests are a softer preference than sleep timing.

### Custom-logic scorers

`scoreFoodHabits`, `scoreSmokingDrinking`, and `scoreWorkStyle` use bespoke logic because their option semantics are not a clean spectrum:

- **Food Habits**: identical answers score 100. Either side `no_preference` scores 70. Vegetarian and vegan are treated as mutually compatible (100) because vegan food is vegetarian-safe. One strict (vegetarian or vegan) and one non-strict scores 0. Two non-strict (non-vegetarian, eggetarian) score 80.
- **Smoking/Drinking**: identical answers score 100. Either side `both_fine` scores 70. Both in the non-smoker set (`neither`, `drink_occasionally`) score 80. Otherwise (one smokes, the other does not) scores 30.
- **Work Style**: identical answers score 100, anything else scores 70. Work style is the lowest-weight dimension and the most forgiving.

## Match threshold

`COMPATIBILITY_MATCH_THRESHOLD` is `60`. A dimension scores `match: true` in the result when its raw score is at or above 60. This does not affect the overall percentage, it only sets the boolean per-dimension flag the UI uses to show a check or a gap.

## Related pages

- [Compatibility profile](compatibility-profile.md) for how these scores combine into an overall result.
- [Compatibility matching](../features/compatibility-matching/index.md) for how the engine drives the swipe deck.
- [Glossary](../overview/glossary.md) for the lifestyle dimension and compatibility weight terms.

## Key source files

| File | Role |
| --- | --- |
| `src/lib/data/domain.ts` | `LIFESTYLE_DIMENSIONS` (labels, weights, options), `LIFESTYLE_DIMENSION_VALUES`, per-dimension `*_VALUES` arrays and types |
| `src/lib/compatibility/dimensions.ts` | `COMPATIBILITY_WEIGHTS`, `COMPATIBILITY_MATCH_THRESHOLD`, `scoreOrdered` helper, per-dimension scorers, `DIMENSION_SCORERS` map |
| `src/lib/compatibility/types.ts` | `DimensionScorer<TValue>` type |
| `src/lib/compatibility/engine.ts` | `scoreDimension` dispatcher that routes a key to its scorer |
