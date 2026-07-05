import { describe, expect, it } from "vitest";

import { propertyCreateSchema } from "../listing-builder";

const validBase = {
  title: "Spacious 1BHK in DLF Phase 1",
  city: "Gurugram",
  locality: "DLF Phase 1",
  monthly_rent: 15000
};

describe("propertyCreateSchema image_urls validation", () => {
  it("accepts hosted http(s) URLs", () => {
    const result = propertyCreateSchema.safeParse({
      ...validBase,
      image_urls: ["https://example.com/img.jpg", "http://example.com/img2.jpg"]
    });

    expect(result.success).toBe(true);
  });

  it("rejects base64 data URLs", () => {
    const result = propertyCreateSchema.safeParse({
      ...validBase,
      image_urls: ["data:image/webp;base64,abc"]
    });

    expect(result.success).toBe(false);
  });

  it("rejects blob: URLs", () => {
    const result = propertyCreateSchema.safeParse({
      ...validBase,
      image_urls: ["blob:https://example.com/abc-123"]
    });

    expect(result.success).toBe(false);
  });

  it("rejects a mix of valid and data URLs", () => {
    const result = propertyCreateSchema.safeParse({
      ...validBase,
      image_urls: ["https://example.com/img.jpg", "data:image/png;base64,xyz"]
    });

    expect(result.success).toBe(false);
  });

  it("defaults image_urls to an empty array when omitted", () => {
    const result = propertyCreateSchema.safeParse(validBase);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.image_urls).toEqual([]);
    }
  });
});
