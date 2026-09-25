import { beforeEach, describe, expect, it } from "vitest";
import { saveDraft } from "@/pages/app/PostPage";
import { LISTING_DRAFT_STORAGE_KEY } from "@/lib/schemas/listing-builder";

// W2 regression: base64 previews must never reach localStorage.
describe("listing draft", () => {
  beforeEach(() => window.localStorage.clear());

  it("drops data: photo previews and keeps hosted URLs", () => {
    expect(
      saveDraft({
        currentStep: 5,
        form: { title: "Room", image_urls: ["data:image/webp;base64,AAAA", "https://cdn.test/a.webp"] }
      })
    ).toBe(true);
    const saved = JSON.parse(window.localStorage.getItem(LISTING_DRAFT_STORAGE_KEY) ?? "{}");
    expect(saved.form.image_urls).toEqual(["https://cdn.test/a.webp"]);
    expect(saved.currentStep).toBe(5);
  });
});
