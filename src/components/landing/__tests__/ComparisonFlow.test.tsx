import type { ReactNode } from "react";
import { render, screen } from "@/test-utils";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/RevealSection", () => ({
  RevealSection: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

import { ComparisonFlow } from "../ComparisonFlow";

describe("ComparisonFlow", () => {
  it("renders the key comparison states", () => {
    const { container } = render(<ComparisonFlow />);

    expect(screen.getByRole("heading", { name: /flatmate search without the chaos/i })).toBeInTheDocument();
    expect(screen.getByText("The old way")).toBeInTheDocument();
    expect(screen.getByText("The Flatmates way")).toBeInTheDocument();
    expect(container.querySelectorAll(".text-paper").length).toBeGreaterThan(0);
  });
});
