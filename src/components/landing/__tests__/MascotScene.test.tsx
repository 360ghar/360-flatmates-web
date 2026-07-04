import { render, screen } from "@/test-utils";
import { describe, expect, it } from "vitest";

import { MascotScene } from "../MascotScene";

describe("MascotScene", () => {
  it("renders the decorative hero scene content", () => {
    render(<MascotScene />);

    expect(screen.getByAltText(/two flatmates exchanging keys beside moving boxes/i)).toBeInTheDocument();
    expect(screen.getByText("Vibe match")).toBeInTheDocument();
    expect(screen.getByText("Visit booked")).toBeInTheDocument();
  });
});
