import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import type { LifestyleInput, OnboardingDraft } from "@/lib/schemas";
import {
  ONBOARDING_DRAFT_STORAGE_KEY,
  onboardingDraftSchema
} from "@/lib/schemas";
import { createSafeJsonStorage } from "./storage";

export const ONBOARDING_STEPS = [
  // Phase 1 — Your Information
  "splash",
  "mode",
  "location",
  "basic_info",
  "profile_photo",
  "phase_transition",
  // Phase 2 — Your Preferences
  "lifestyle",
  "smoking_drinking",
  "guests",
  "work_style",
  "budget_timeline",
  "preferences"
] as const;

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number];

export interface OnboardingPhase {
  index: 1 | 2;
  label: string;
  /** Index (into ONBOARDING_STEPS) of the first step belonging to the phase. */
  start: number;
}

/** Phase metadata for the two-phase wizard. */
export const ONBOARDING_PHASES: readonly OnboardingPhase[] = [
  { index: 1, label: "Your Information", start: 0 },
  { index: 2, label: "Your Preferences", start: 6 }
] as const;

/** Phase containing the transition marker between the two phases. */
export const PHASE_TRANSITION_STEP = "phase_transition";

export function phaseForStep(step: number): OnboardingPhase {
  const phase =
    ONBOARDING_PHASES[step >= ONBOARDING_PHASES[1].start ? 1 : 0] ??
    ONBOARDING_PHASES[0];
  return phase;
}

export interface OnboardingStoreState {
  currentStep: number;
  draft: OnboardingDraft;
  lastSavedAt: string | null;
  setStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  patchDraft: (patch: Partial<OnboardingDraft>) => void;
  patchLifestyle: (patch: Partial<LifestyleInput>) => void;
  clearDraft: () => void;
  hydrateDraft: (draft: unknown) => void;
}

export type OnboardingStoreInitialState = Partial<
  Pick<OnboardingStoreState, "currentStep" | "draft" | "lastSavedAt">
>;

function timestamp(): string {
  return new Date().toISOString();
}

function clampStep(step: number): number {
  return Math.min(Math.max(Math.trunc(step), 0), ONBOARDING_STEPS.length - 1);
}

const EMPTY_DRAFT: OnboardingDraft = {
  current_step: 0
};

export function createOnboardingStore(
  initialState: OnboardingStoreInitialState = {}
) {
  return createStore<OnboardingStoreState>()(
    persist(
      (set) => ({
        currentStep: 0,
        draft: EMPTY_DRAFT,
        lastSavedAt: null,
        ...initialState,
        setStep: (step) =>
          set((state) => {
            const currentStep = clampStep(step);
            return {
              currentStep,
              draft: { ...state.draft, current_step: currentStep }
            };
          }),
        nextStep: () =>
          set((state) => {
            const currentStep = clampStep(state.currentStep + 1);
            return {
              currentStep,
              draft: { ...state.draft, current_step: currentStep }
            };
          }),
        previousStep: () =>
          set((state) => {
            const currentStep = clampStep(state.currentStep - 1);
            return {
              currentStep,
              draft: { ...state.draft, current_step: currentStep }
            };
          }),
        patchDraft: (patch) =>
          set((state) => {
            const updatedAt = timestamp();
            const draft = {
              ...state.draft,
              ...patch,
              updated_at: updatedAt
            };
            return {
              draft,
              currentStep: draft.current_step ?? state.currentStep,
              lastSavedAt: updatedAt
            };
          }),
        patchLifestyle: (patch) =>
          set((state) => {
            const updatedAt = timestamp();
            return {
              draft: {
                ...state.draft,
                lifestyle: {
                  ...state.draft.lifestyle,
                  ...patch
                },
                updated_at: updatedAt
              },
              lastSavedAt: updatedAt
            };
          }),
        clearDraft: () =>
          set({
            currentStep: 0,
            draft: EMPTY_DRAFT,
            lastSavedAt: null
          }),
        hydrateDraft: (candidate) => {
          const parsed = onboardingDraftSchema.safeParse(candidate);
          if (!parsed.success) {
            return;
          }

          // NOTE (F10 #19): `lastSavedAt` is derived from the draft's
          // `updated_at` field rather than stamped here. This is correct for
          // the restore-from-storage path because the persisted draft already
          // carries the timestamp from its last `patchDraft` / `patchLifestyle`
          // write. If we ever hydrate from a different source (e.g. server
          // snapshot), stamp `lastSavedAt` at the time of hydration instead.
          set({
            draft: parsed.data,
            currentStep: parsed.data.current_step ?? 0,
            lastSavedAt: parsed.data.updated_at ?? null
          });
        }
      }),
      {
        name: ONBOARDING_DRAFT_STORAGE_KEY,
        version: 2,
        // v1 -> v2: the lifestyle step split `smoking_drinking` into
        // `smoking` + `drinking` and MOVE_IN_TIMELINE_VALUES replaced
        // immediate/this_month/next_month with the expanded set. Migrate
        // persisted drafts so in-flight users don't lose their answers or
        // get stuck on a step whose stored values no longer validate.
        migrate: (persistedState, version) => {
          if (version >= 2) {
            return persistedState as OnboardingStoreState;
          }
          const state = (persistedState ?? {}) as {
            currentStep?: number;
            draft?: Record<string, unknown>;
            lastSavedAt?: string | null;
          };
          const draft = { ...(state.draft ?? {}) } as Record<string, unknown>;
          const lifestyle = draft.lifestyle as
            | Record<string, unknown>
            | undefined;
          if (lifestyle && typeof lifestyle === "object") {
            const combined = lifestyle.smoking_drinking;
            if (typeof combined === "string") {
              switch (combined) {
                case "neither":
                  lifestyle.smoking = "never";
                  lifestyle.drinking = "never";
                  break;
                case "smoke_outside":
                  lifestyle.smoking = "regularly";
                  lifestyle.drinking = "never";
                  break;
                case "drink_occasionally":
                  lifestyle.smoking = "never";
                  lifestyle.drinking = "occasionally";
                  break;
                case "both_fine":
                  lifestyle.smoking = "regularly";
                  lifestyle.drinking = "occasionally";
                  break;
              }
              delete lifestyle.smoking_drinking;
            }
          }
          const budgetTimeline = draft.budget_timeline as
            | Record<string, unknown>
            | undefined;
          if (budgetTimeline && typeof budgetTimeline === "object") {
            const moveIn = budgetTimeline.move_in_timeline;
            const legacyMoveIn: Record<string, string> = {
              immediate: "immediately",
              this_month: "within_1_month",
              next_month: "within_2_months"
            };
            if (typeof moveIn === "string" && moveIn in legacyMoveIn) {
              budgetTimeline.move_in_timeline = legacyMoveIn[moveIn];
            }
          }
          return {
            currentStep: state.currentStep ?? 0,
            draft: draft as OnboardingStoreState["draft"],
            lastSavedAt: state.lastSavedAt ?? null
          };
        },
        storage: createSafeJsonStorage(),
        partialize: (state) => ({
          currentStep: state.currentStep,
          draft: state.draft,
          lastSavedAt: state.lastSavedAt
        })
      }
    )
  );
}

export const onboardingStore = createOnboardingStore();

