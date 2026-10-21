import { beforeEach, describe, expect, it } from "vitest";
import { loadDraft, saveDraft } from "@/features/hosting/pages/PostPage";
import { LISTING_DRAFT_STORAGE_KEY, LISTING_DRAFT_VERSION } from "@/lib/schemas/listing-builder";

describe("listing draft", () => {
  beforeEach(() => window.localStorage.clear());

  it("saves a versioned draft and reads it back", () => {
    expect(saveDraft({ currentStep: 5, form: { title: "Room", monthly_rent: 12000 } })).toBe(true);
    const saved = JSON.parse(window.localStorage.getItem(LISTING_DRAFT_STORAGE_KEY) ?? "{}");
    expect(saved.version).toBe(LISTING_DRAFT_VERSION);
    expect(saved.currentStep).toBe(5);
    expect(loadDraft().form).toMatchObject({ title: "Room", monthly_rent: 12000 });
    expect(loadDraft().currentStep).toBe(5);
  });

  it("drops a draft saved under another version", () => {
    window.localStorage.setItem(
      LISTING_DRAFT_STORAGE_KEY,
      JSON.stringify({ version: LISTING_DRAFT_VERSION - 1, form: { title: "Old" }, currentStep: 3 })
    );
    expect(loadDraft().form.title).toBeUndefined();
    expect(loadDraft().currentStep).toBe(0);
  });
});
