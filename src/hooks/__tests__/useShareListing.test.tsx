import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useShareListing } from "../useShareListing";
import type { Property } from "@/lib/api/types";

const toPngMock = vi.fn();
vi.mock("html-to-image", () => ({
  toPng: (...args: unknown[]) => toPngMock(...args)
}));

vi.stubGlobal("open", vi.fn());

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function createCardRef() {
  return { current: document.createElement("div") } as React.RefObject<HTMLDivElement | null>;
}

function useShareListingWithRef(property: Property) {
  const cardRef = createCardRef();
  return useShareListing({ property, cardRef });
}

const mockProperty: Property = {
  id: 42,
  title: "2BHK in Koramangala",
  monthly_rent: 25000,
  city: "Bangalore",
  locality: "Koramangala",
  main_image_url: "https://example.com/image.png",
  property_type: "apartment",
  purpose: "rent"
};

describe("useShareListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
  });

  it("returns the share URL based on the property id", () => {
    const { result } = renderHook(() => useShareListingWithRef(mockProperty), {
      wrapper: createWrapper()
    });
    expect(result.current.shareUrl).toBe("https://360ghar.com/share/42");
  });

  it("copies the share link to the clipboard", async () => {
    (navigator.clipboard.writeText as Mock).mockResolvedValue(undefined);
    const { result } = renderHook(() => useShareListingWithRef(mockProperty), {
      wrapper: createWrapper()
    });

    await result.current.copyLink();

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://360ghar.com/share/42")
    );
  });

  it("opens a WhatsApp share window", () => {
    const { result } = renderHook(() => useShareListingWithRef(mockProperty), {
      wrapper: createWrapper()
    });
    result.current.shareOnWhatsApp();
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/?text="),
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("downloads the generated card image", async () => {
    toPngMock.mockResolvedValue("data:image/png;base64,test");
    const { result } = renderHook(() => useShareListingWithRef(mockProperty), {
      wrapper: createWrapper()
    });

    await result.current.downloadImage();

    expect(toPngMock).toHaveBeenCalled();
  });
});
