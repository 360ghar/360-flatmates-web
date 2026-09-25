import { render, screen } from "@/test-utils";
import { describe, expect, it, vi } from "vitest";

vi.mock("../LandingSearch", () => ({
  LandingSearch: () => <div>Search mock</div>,
}));

import { HeroSection } from "../HeroSection";

describe("HeroSection", () => {
  it("renders the headline over the paper scene and keeps the art decorative", () => {
    render(<HeroSection />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Find your flatmate");
    const scene = screen.getByTestId("paper-scene");
    scene.querySelectorAll("svg").forEach((svg) => expect(svg).toHaveAttribute("aria-hidden", "true"));
    expect(screen.getByText("Search mock")).toBeInTheDocument();
  });
});
