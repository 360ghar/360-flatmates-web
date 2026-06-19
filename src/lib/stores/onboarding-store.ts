import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import type { LifestyleInput, OnboardingDraft } from "@/lib/schemas";
import {
  ONBOARDING_DRAFT_STORAGE_KEY,
  onboardingDraftSchema
} from "@/lib/schemas";
import { createSafeJsonStorage } from "./storage";

export const ONBOARDING_STEPS = [
  "splash",
  "mode",
  "location",
  "basic_info",
  "profile_photo",
  "lifestyle",
  "smoking_guests",
  "work_style",
  "budget_timeline",
  "preferences"
] as const;

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number];

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
        // NOTE (F10 #20): bump this version whenever the OnboardingDraft
        // schema changes in a backward-incompatible way. Zustand's persist
        // middleware ships a `migrate` hook; for the current 1.0 schema
        // there is no migration logic because the Zod safeParse in
        // `hydrateDraft` is the only consumer and it will simply reject
        // malformed payloads. Add a `migrate` function when a real upgrade
        // path is needed.
        version: 1,
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

