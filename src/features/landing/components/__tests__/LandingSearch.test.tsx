import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockNavigate = vi.fn();

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { LandingSearch } from "@/features/landing/components/LandingSearch";

describe("LandingSearch", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("navigates to discover when the search is blank", async () => {
    const user = userEvent.setup();
    render(<LandingSearch />);

    await user.click(screen.getByRole("button", { name: /^search$/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/discover");
  });

  it("links popular searches straight to their results", () => {
    render(<LandingSearch />);

    expect(screen.getByRole("link", { name: "Gurugram" })).toHaveAttribute("href", "/search?q=Gurugram");
  });

  it("trims and encodes a location when submitted with Enter", async () => {
    const user = userEvent.setup();
    render(<LandingSearch />);

    await user.type(screen.getByRole("textbox", { name: "Search location" }), "  Sector 4 & 5  {Enter}");

    expect(mockNavigate).toHaveBeenCalledWith("/search?q=Sector%204%20%26%205");
  });
});
