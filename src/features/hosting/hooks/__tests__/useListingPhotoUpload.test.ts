import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequest = vi.fn();

vi.mock("@/lib/api", () => ({ apiClient: { request: (...args: unknown[]) => mockRequest(...args) } }));
// Conversion fails in jsdom: the original file is uploaded.
vi.mock("@/lib/image-utils", () => ({
  convertUploadImageToDataUrl: () => Promise.reject(new Error("no canvas"))
}));

import { uploadListingPhoto, useListingPhotoUpload } from "@/features/hosting/hooks/useListingPhotoUpload";

const photo = (name: string) => new File(["x"], name, { type: "image/jpeg" });

describe("listing photo upload", () => {
  beforeEach(() => mockRequest.mockReset());

  it("posts the file to /upload as a property image and returns its hosted URL", async () => {
    mockRequest.mockResolvedValue({ public_url: "https://cdn.test/a.webp" });
    await expect(uploadListingPhoto(photo("a.jpg"))).resolves.toBe("https://cdn.test/a.webp");
    const req = mockRequest.mock.calls[0][0] as { method: string; path: string; body: FormData };
    expect(req).toMatchObject({ method: "POST", path: "/upload" });
    expect(req.body.get("folder_type")).toBe("property_image");
    expect((req.body.get("file") as File).name).toBe("a.jpg");
  });

  it("keeps pick order, skips non-images and counts failures", async () => {
    mockRequest
      .mockResolvedValueOnce({ public_url: "https://cdn.test/1" })
      .mockRejectedValueOnce(new Error("503"))
      .mockResolvedValueOnce({ public_url: "https://cdn.test/3" });
    const { result } = renderHook(() => useListingPhotoUpload());
    let outcome: { urls: string[]; failed: number } | undefined;
    await act(async () => {
      outcome = await result.current.upload([
        photo("1.jpg"),
        photo("2.jpg"),
        new File(["x"], "notes.txt", { type: "text/plain" }),
        photo("3.jpg")
      ]);
    });
    expect(outcome).toEqual({ urls: ["https://cdn.test/1", "https://cdn.test/3"], failed: 1 });
    expect(mockRequest).toHaveBeenCalledTimes(3);
    expect(result.current.uploadingCount).toBe(0);
  });
});
