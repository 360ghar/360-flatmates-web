# Validation schemas (Zod)

Active contributors: Saksham

Zod schemas under `src/lib/schemas/` are the client-side mirror of the FastAPI backend contract in `docs/flatmates-openapi.yaml`. They serve three jobs: they validate form input before it is sent, they validate persisted drafts when they are rehydrated from `localStorage`, and they provide the TypeScript types that flow through components and hooks. Everything is re-exported from `src/lib/schemas/index.ts`.

## How schemas mirror the backend

Each schema file corresponds to a backend resource family. Field names use the backend's snake_case, not the frontend's camelCase, so a validated payload can be posted to `/api/v1` without a mapping layer. The enum values themselves come from `src/lib/data` (the canonical string unions) and are wrapped in `z.enum(...)` in `src/lib/schemas/enums.ts`, so there is exactly one place that lists the allowed values for, say, a `sleep_schedule` or a `property_type`.

| Schema file | Mirrors | Used by |
| --- | --- | --- |
| `src/lib/schemas/enums.ts` | All backend enum unions | Every other schema file, form dropdowns |
| `src/lib/schemas/common.ts` | Shared primitives: `PASSWORD_REGEX`, `optionalUrlSchema`, `minMaxRefine` | profile, onboarding, listing-builder, search |
| `src/lib/schemas/profile.ts` | `FlatmatesProfile`, `FlatmatesProfileUpdate`, `FlatmatesPeer`, `Lifestyle` | Profile edit, swipe deck, compatibility |
| `src/lib/schemas/onboarding.ts` | `OnboardingDraft`, `CompletedOnboarding`, per-step schemas | Onboarding flow, `onboardingStore` |
| `src/lib/schemas/listing-builder.ts` | `PropertyCreate`, `Property`, `ListingDraft`, per-step schemas | Listing builder, manage pages |
| `src/lib/schemas/search.ts` | `SearchFilters`, `WebSearchResponse`, `SavedSearch`, `SearchAlert` | Search page, saved searches, alerts |
| `src/lib/schemas/search-params.ts` | nuqs parsers for `/search` and `/discover` URL state | Search and discover pages |
| `src/lib/schemas/visit.ts` | `VisitCreate`, `VisitUpdate`, `Visit`, `VisitList` | Visit scheduling and management |

## Enum re-exports

`src/lib/schemas/enums.ts` imports the frozen value arrays from `src/lib/data` (for example `FLATMATE_MODE_VALUES`, `SLEEP_SCHEDULE_VALUES`, `PROPERTY_TYPE_VALUES`) and re-exports each as a `z.enum(...)`. This means the allowed values cannot drift between the data layer, the schema layer, and the UI: adding a new `food_habits` option is a one-line change in `src/lib/data` that automatically flows into the Zod enum, the inferred type, and any `SelectField` driven by the same array. The file also exports `jsonObjectSchema` (`z.record(z.string(), z.unknown())`) for the freeform `preferences` blobs the backend accepts.

## Feeding react-hook-form

Forms use `react-hook-form` with `@hookform/resolvers/zod` to wire a schema to a field. The pattern, used by the profile editor, the listing builder, and the visit form, is:

```ts
const form = useForm<FlatmatesProfileUpdateInput>({
  resolver: zodResolver(flatmatesProfileUpdateSchema),
  defaultValues: ...
});
```

Because the schema's inferred type is the form's value type, the data returned by `form.handleSubmit` is already shaped correctly for the API client, and `z.infer<typeof flatmatesProfileUpdateSchema>` is the same type the corresponding TanStack Query mutation accepts (see [Server state](server-state.md)). No manual DTO mapping is needed.

## Cross-field refinements

`src/lib/schemas/common.ts` exports `minMaxRefine(minField, maxField, message)`, a small helper that returns a `.superRefine`-compatible check used wherever a minimum must not exceed a maximum. It is applied to:

- `budget_min` / `budget_max` in `flatmatesProfileUpdateSchema`, `onboardingBudgetTimelineSchema`, and `searchFiltersSchema`,
- `price_min` / `price_max` and `bedrooms_min` / `bedrooms_max` in `searchFiltersSchema`.

The listing builder adds a domain-specific refinement of its own: `propertyCreateSchema` rejects a `security_deposit` greater than twelve times the `monthly_rent` ("Security deposit is unusually high"). The visit schema refines `visitCreateSchema` so that a `flatmate_meet` context requires both a `conversation_id` and a `counterparty_user_id` (see [Visits](../features/visits.md)).

## Step and draft schemas

Multi-step flows define a strict "completed" schema and a loose "draft" schema. The onboarding flow is the clearest example:

- `onboardingBasicInfoSchema`, `onboardingBudgetTimelineSchema`, `onboardingPreferencesSchema`, etc. validate a single step's fields.
- `onboardingDraftSchema` composes every step as `.partial().optional()` plus a `current_step` counter, so a half-finished draft can be persisted and reloaded.
- `completedOnboardingSchema` re-declares the same fields as required, and is what the final submit is validated against.

The `onboardingStore` (`src/lib/stores/onboarding-store.ts`) runs `onboardingDraftSchema.safeParse` on every hydration, so a corrupted `localStorage` entry is silently discarded instead of crashing the flow. The listing builder follows the same draft/completed split (`listingDraftSchema` vs the step schemas that compose into `propertyCreateSchema`). See [Profile and onboarding](../features/profile-onboarding.md) and [Listing management](../features/listing-management.md).

## URL state with nuqs

`src/lib/schemas/search-params.ts` defines the URL query-string contract for the search and discover pages using `nuqs` parsers (`parseAsString`, `parseAsInteger`, `parseAsArrayOf`). These are not Zod schemas, but they live alongside the schemas because they serve the same role for URL state: they define the shape of `?q=Delhi&city=1&amenities=WiFi,Parking&page=1`, provide defaults, and make the URL deep-linkable and shareable. The search page reads them with `useQueryStates(searchPageParams)` and the discover page with `useQueryStates(discoverPageParams)`. See [Search and explore](../features/search-explore.md).

## The `FlatmatesPeer` shape

`flatmatesPeerSchema` is worth calling out because it is the type that flows through the swipe deck, the compatibility view, and the public profile page. It is a strict `pick` from `flatmatesProfileSchema` (the immutable identity fields) extended with computed fields the backend attaches in list contexts: `non_negotiables`, `has_pets`, `party_habit`, `match_percentage`, `phone_number`. The flatmate profile primitive is documented in [Flatmate profile](../primitives/flatmate-profile.md).

## Key source files

| File | Role |
| --- | --- |
| `src/lib/schemas/enums.ts` | `z.enum(...)` wrappers over the frozen value arrays from `src/lib/data` |
| `src/lib/schemas/common.ts` | `PASSWORD_REGEX`, `optionalUrlSchema`, `minMaxRefine` |
| `src/lib/schemas/profile.ts` | `flatmatesProfileSchema`, `flatmatesProfileUpdateSchema`, `flatmatesPeerSchema`, `lifestyleSchema` |
| `src/lib/schemas/onboarding.ts` | `onboardingDraftSchema`, `completedOnboardingSchema`, per-step schemas, `ONBOARDING_DRAFT_STORAGE_KEY` |
| `src/lib/schemas/listing-builder.ts` | `propertyCreateSchema`, `propertySchema`, `listingDraftSchema`, per-step schemas |
| `src/lib/schemas/search.ts` | `searchFiltersSchema`, `webSearchResponseSchema`, `savedSearchSchema`, `searchAlertSchema` |
| `src/lib/schemas/search-params.ts` | `searchPageParams`, `discoverPageParams` (nuqs parsers) |
| `src/lib/schemas/visit.ts` | `visitCreateSchema`, `visitUpdateSchema`, `visitSchema`, `visitListSchema` |
| `src/lib/schemas/index.ts` | Barrel re-export of every schema and inferred type |
