import { afterEach, describe, expect, it, vi } from "vitest";

const mockRequest = vi.fn();

vi.mock("@/lib/api", () => ({
  apiClient: { request: (...args: unknown[]) => mockRequest(...args) },
}));

import {
  checkIdentifierStatus,
  detectIdentifierChannel,
  postLastMethod,
  reportLastMethod,
} from "@/lib/api/auth";

afterEach(() => {
  vi.clearAllMocks();
});

describe("detectIdentifierChannel", () => {
  it("classifies an email", () => {
    expect(detectIdentifierChannel("user@example.com")).toBe("email");
  });

  it("classifies a plain phone number", () => {
    expect(detectIdentifierChannel("9876543210")).toBe("phone");
  });

  it("classifies an E.164 phone number", () => {
    expect(detectIdentifierChannel("+91 98765 43210")).toBe("phone");
  });

  it("falls back to email for ambiguous alpha input", () => {
    expect(detectIdentifierChannel("janedoe")).toBe("email");
  });
});

describe("checkIdentifierStatus", () => {
  it("POSTs to the public identifier-status endpoint", async () => {
    const status = {
      exists: false,
      verified: false,
      has_password: false,
      channel: "phone",
      next_step: "otp",
    };
    mockRequest.mockResolvedValue(status);

    const result = await checkIdentifierStatus("+919876543210");

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        path: "/auth/identifier-status",
        body: { identifier: "+919876543210" },
        auth: false,
      })
    );
    expect(result).toEqual(status);
  });
});

describe("postLastMethod / reportLastMethod", () => {
  it("postLastMethod POSTs the method to the auth endpoint", async () => {
    mockRequest.mockResolvedValue(undefined);
    await postLastMethod("google");
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        path: "/auth/last-method",
        body: { method: "google" },
        auth: true,
      })
    );
  });

  it("reportLastMethod swallows errors (best-effort)", async () => {
    mockRequest.mockRejectedValue(new Error("network"));
    await expect(reportLastMethod("phone_otp")).resolves.toBeUndefined();
  });
});
