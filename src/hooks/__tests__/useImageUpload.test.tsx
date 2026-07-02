import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockConvertToWebP = vi.fn();

vi.mock("@/lib/image-utils", () => ({
  convertToWebP: (...args: unknown[]) => mockConvertToWebP(...args),
}));

import { useImageUpload } from "@/hooks/useImageUpload";

describe("useImageUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the processed preview data URL for listing flows", async () => {
    const file = new File(["image"], "room.png", { type: "image/png" });
    mockConvertToWebP.mockResolvedValue("data:image/webp;base64,preview");

    const { result } = renderHook(() => useImageUpload());

    await expect(result.current.upload(file)).resolves.toBe("data:image/webp;base64,preview");
    expect(mockConvertToWebP).toHaveBeenCalledWith(file, 1600, 0.82);
  });
});
