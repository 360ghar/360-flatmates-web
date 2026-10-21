import { describe, expect, it } from "vitest";
import { toPropertyCreate, toPropertyUpdate, type ListingDraftForm } from "../listing-payload";
import type { ListingFormData } from "../listing-form";

describe("toPropertyCreate", () => {
  it("leaves blank and NaN values out of the body", () => {
    const form = {
      title: "  Sunny room  ",
      monthly_rent: 12000,
      available_from: "",
      area_sqft: Number.NaN
    } as unknown as ListingDraftForm;
    const body = toPropertyCreate(form);
    expect(body).not.toBeNull();
    expect(body).not.toHaveProperty("available_from");
    expect(body).not.toHaveProperty("area_sqft");
    expect(body?.title).toBe("Sunny room");
    expect(body?.base_price).toBe(12000);
  });

  it("returns null for a whitespace-only title", () => {
    expect(toPropertyCreate({ title: "   ", monthly_rent: 1000 } as unknown as ListingDraftForm)).toBeNull();
  });
});

describe("toPropertyUpdate", () => {
  const values = { title: "   ", description: "  ", monthly_rent: 9000 } as unknown as ListingFormData;

  it("treats whitespace as cleared: null for an optional key, skipped for the title", () => {
    const body = toPropertyUpdate(values, { title: true, description: true });
    expect(body).toEqual({ description: null });
  });

  it("clears a NaN number and sends a trimmed string", () => {
    const body = toPropertyUpdate(
      { title: "  New  ", area_sqft: Number.NaN, monthly_rent: 9000 } as unknown as ListingFormData,
      { title: true, area_sqft: true, monthly_rent: true }
    );
    expect(body).toEqual({ title: "New", area_sqft: null, monthly_rent: 9000, base_price: 9000 });
  });
});
