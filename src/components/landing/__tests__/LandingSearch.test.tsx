import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen } from "@/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockNavigate = vi.fn();

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { LandingSearch } from "../LandingSearch";

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

  it("navigates directly when a popular search is chosen", async () => {
    render(<LandingSearch />);

    fireEvent.click(screen.getByRole("button", { name: "Gurugram" }));

    expect(mockNavigate).toHaveBeenCalledWith("/search?q=Gurugram");
  });
});
