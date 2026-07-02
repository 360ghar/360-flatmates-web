import { render, screen } from "@/test-utils";
import { describe, expect, it, vi } from "vitest";

vi.mock("../LandingSearch", () => ({
  LandingSearch: () => <div>Search mock</div>,
}));

vi.mock("../AppStoreBadges", () => ({
  AppStoreBadges: () => <div>App badges mock</div>,
}));

vi.mock("../MascotScene", () => ({
  MascotScene: () => <div>Scene mock</div>,
}));

import { HeroSection } from "../HeroSection";

describe("HeroSection", () => {
  it("keeps the mascot scene out of the accessibility tree", () => {
    render(<HeroSection />);

    const scene = screen.getByText("Scene mock");
    expect(scene.parentElement).toHaveAttribute("aria-hidden", "true");
    expect(scene.parentElement).toHaveAttribute("inert");
  });
});
