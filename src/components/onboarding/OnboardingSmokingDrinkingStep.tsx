import { useMemo } from "react";
import { useCatalogs } from "@/hooks/queries";
import { Chip } from "@/components/ui/Chip";
import {
  DRINKING_OPTIONS,
  SMOKING_OPTIONS,
  type DrinkingType,
  type SmokingType
} from "@/lib/data";
import type { OnboardingDraft } from "@/lib/schemas/onboarding";
import type { CatalogEntry } from "@/lib/api/types";

/**
 * Extract a flat list of option values from a catalog entry whose payload is
 * either a raw string array or `{ items: [{ id, label }] }` (the shape the
 * flatmates lifestyle catalogs ship). Returns null when the payload cannot
 * be interpreted, so callers fall back to the domain constants.
 */
function catalogOptionValues(entry: CatalogEntry | undefined): readonly string[] | null {
  if (!entry) return null;
  const payload = entry.payload as unknown;
  const items =
    Array.isArray(payload)
      ? (payload as unknown[])
      : typeof payload === "object" && payload !== null &&
          Array.isArray((payload as { items?: unknown }).items)
        ? ((payload as { items: unknown[] }).items)
        : null;
  if (!items) return null;
  const values = items
    .map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item !== null) {
        const candidate = (item as { id?: unknown }).id ?? (item as { value?: unknown }).value;
        return typeof candidate === "string" ? candidate : null;
      }
      return null;
    })
    .filter((value): value is string => Boolean(value));
  return values.length > 0 ? values : null;
}

function optionLabel(
  values: readonly string[],
  fallback: readonly { value: string; label: string }[]
): { value: string; label: string }[] {
  return values.map((value) => ({
    value,
    label: fallback.find((o) => o.value === value)?.label ?? value
  }));
}

export function OnboardingSmokingDrinkingStep({
  lifestyle,
  patchDraft
}: {
  lifestyle: OnboardingDraft["lifestyle"];
  patchDraft: (patch: Partial<OnboardingDraft>) => void;
}) {
  const { data: catalogs } = useCatalogs();

  const smokingOptions = useMemo(() => {
    const catalog = catalogOptionValues(
      catalogs?.find((c) => c.key === "flatmates_smoking_options")
    );
    return optionLabel(catalog ?? SMOKING_OPTIONS.map((o) => o.value), SMOKING_OPTIONS);
  }, [catalogs]);

  const drinkingOptions = useMemo(() => {
    const catalog = catalogOptionValues(
      catalogs?.find((c) => c.key === "flatmates_drinking_options")
    );
    return optionLabel(catalog ?? DRINKING_OPTIONS.map((o) => o.value), DRINKING_OPTIONS);
  }, [catalogs]);

  return (
    <>
      <h2 className="text-h2">Smoking & drinking</h2>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-label-md text-ink-2 mb-2">Do you smoke?</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Smoking">
            {smokingOptions.map((option) => (
              <Chip
                variant="choice"
                key={option.value}
                selected={lifestyle?.smoking === option.value}
                onClick={() =>
                  patchDraft({
                    lifestyle: { ...lifestyle, smoking: option.value as SmokingType }
                  })
                }
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="text-label-md text-ink-2 mb-2">How often do you drink?</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Drinking">
            {drinkingOptions.map((option) => (
              <Chip
                variant="choice"
                key={option.value}
                selected={lifestyle?.drinking === option.value}
                onClick={() =>
                  patchDraft({
                    lifestyle: { ...lifestyle, drinking: option.value as DrinkingType }
                  })
                }
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
