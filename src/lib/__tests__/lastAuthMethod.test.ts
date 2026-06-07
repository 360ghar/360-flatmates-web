import { afterEach, describe, expect, it } from "vitest";
import {
  clearLastAuthMethod,
  getLastAuthMethod,
  maskIdentifier,
  setLastAuthMethod,
} from "@/lib/lastAuthMethod";

describe("maskIdentifier", () => {
  it("masks an email, keeping the first char and domain", () => {
    expect(maskIdentifier("jane@gmail.com")).toBe("j•••@gmail.com");
  });

  it("masks a short email local part with at least one dot", () => {
    expect(maskIdentifier("a@x.com")).toBe("a•@x.com");
  });

  it("masks a phone keeping the leading + and last 4 digits", () => {
    expect(maskIdentifier("+919876543210")).toBe("+••••••••3210");
  });

  it("masks a plain digit phone keeping last 4", () => {
    expect(maskIdentifier("9876543210")).toBe("••••••3210");
  });

  it("returns empty string for empty input", () => {
    expect(maskIdentifier("   ")).toBe("");
  });
});

describe("last auth method storage", () => {
  afterEach(() => {
    clearLastAuthMethod();
  });

  it("round-trips a method with a masked identifier hint", () => {
    setLastAuthMethod("email_password", "jane@gmail.com");
    const stored = getLastAuthMethod();
    expect(stored?.method).toBe("email_password");
    expect(stored?.identifierHint).toBe("j•••@gmail.com");
    expect(typeof stored?.ts).toBe("number");
  });

  it("never stores the raw identifier", () => {
    setLastAuthMethod("phone_otp", "+919876543210");
    const raw = window.localStorage.getItem("360ghar:lastAuthMethod") ?? "";
    expect(raw).not.toContain("9876543210");
  });

  it("returns null when nothing is stored", () => {
    clearLastAuthMethod();
    expect(getLastAuthMethod()).toBeNull();
  });

  it("returns null for malformed stored JSON", () => {
    window.localStorage.setItem("360ghar:lastAuthMethod", "{not json");
    expect(getLastAuthMethod()).toBeNull();
  });
});
