import { describe, expect, it, vi } from "vitest";
import { applyFieldErrors } from "../form-errors";
import { ApiClientError, mapStatusToAppError } from "../errors";

const FIELDS = ["title", "address", "monthly_rent"] as const;

function validationError(fields: Record<string, string[]>) {
  return new ApiClientError(mapStatusToAppError(422, "Request validation failed", fields), 422);
}

describe("applyFieldErrors", () => {
  it("puts each 422 message on its form field and renames wire keys", () => {
    const setError = vi.fn();
    const line = applyFieldErrors(
      validationError({ "body.title": ["Field required"], "body.full_address": ["Too short"] }),
      setError,
      FIELDS,
      { full_address: "address" }
    );
    expect(setError).toHaveBeenCalledWith("title", { type: "server", message: "Field required" });
    expect(setError).toHaveBeenCalledWith("address", { type: "server", message: "Too short" });
    expect(line).toBe("Some details need fixing. The fields are marked below.");
  });

  it("reports a message that no form field can show", () => {
    const setError = vi.fn();
    const line = applyFieldErrors(
      validationError({ "body.base_price": ["Input should be less than or equal to 9999999999.99"] }),
      setError,
      FIELDS
    );
    expect(setError).not.toHaveBeenCalled();
    expect(line).toBe("base_price: Input should be less than or equal to 9999999999.99");
  });

  it("returns null for any other error, so the caller shows its own message", () => {
    const setError = vi.fn();
    expect(applyFieldErrors(new Error("boom"), setError, FIELDS)).toBeNull();
    expect(applyFieldErrors(new ApiClientError(mapStatusToAppError(409, "Conflict"), 409), setError, FIELDS)).toBeNull();
    expect(applyFieldErrors(validationError({}), setError, FIELDS)).toBeNull();
    expect(setError).not.toHaveBeenCalled();
  });
});
