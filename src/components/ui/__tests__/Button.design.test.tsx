import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "../Button";
import { buttonClasses } from "../component-utils";

/**
 * Design-system contract tests for the Paper Diorama buttons (DESIGN.md §8).
 * Asserts shipped class strings (not mocked reimplementations).
 */
describe("Button design system (Paper Diorama)", () => {
  it("primary is a clay fill that presses, never lifts on hover", () => {
    const classes = buttonClasses("primary", "default");
    expect(classes).toContain("bg-clay");
    expect(classes).toContain("text-on-clay");
    expect(classes).toContain("shadow-sm");
    expect(classes).toContain("hover:bg-clay-press");
    expect(classes).toContain("paper-press");
    expect(classes).toContain("rounded-[var(--radius-button)]");
    expect(classes).not.toMatch(/hover:-?translate-y/);
  });

  it("highlight is a distinct ink secondary fill (not grey-on-grey)", () => {
    const classes = buttonClasses("highlight", "default");
    expect(classes).toContain("bg-action");
    expect(classes).toContain("text-action-ink");
    expect(classes).not.toContain("bg-surface-strong");
    expect(classes).not.toBe(buttonClasses("primary", "default"));
  });

  it("secondary is a pine paper fill, not an outline button", () => {
    const classes = buttonClasses("secondary", "default");
    expect(classes).toContain("bg-pine-soft");
    expect(classes).toContain("text-ink");
    expect(classes).not.toMatch(/border-\[1\.5px\]|bg-transparent/);
  });

  it("renders primary CTA in the DOM with expected class contract", () => {
    render(<Button variant="primary">Start matching</Button>);
    const btn = screen.getByRole("button", { name: "Start matching" });
    expect(btn.className).toMatch(/bg-clay/);
    expect(btn.className).toMatch(/shadow-sm/);
  });

  it("renders highlight as action-ink secondary path", () => {
    render(<Button variant="highlight">Search</Button>);
    const btn = screen.getByRole("button", { name: "Search" });
    expect(btn.className).toMatch(/bg-action/);
    expect(btn.className).toMatch(/text-action-ink/);
  });

  it("disabled primary uses theme-aware disabled fill + ink-2 text (AA on light pink)", () => {
    const classes = buttonClasses("primary", "default");
    expect(classes).toContain("disabled:bg-primary-disabled");
    // ink-2 on the disabled clay tint, never white-on-tint
    expect(classes).toContain("disabled:text-ink-2");
    expect(classes).not.toMatch(/disabled:text-white(?![/\w-])/);

    render(
      <Button variant="primary" disabled>
        Continue
      </Button>
    );
    const btn = screen.getByRole("button", { name: "Continue" });
    expect(btn).toBeDisabled();
    expect(btn.className).toMatch(/disabled:bg-primary-disabled/);
    expect(btn.className).toMatch(/disabled:text-ink-2/);
  });

  it("disabled destructive shares the same contrast-safe disabled contract", () => {
    const classes = buttonClasses("destructive", "default");
    expect(classes).toContain("disabled:bg-primary-disabled");
    expect(classes).toContain("disabled:text-ink-2");
  });
});
