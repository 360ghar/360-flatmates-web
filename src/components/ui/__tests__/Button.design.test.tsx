import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button, buttonClasses } from "../Button";

/**
 * Design-system contract tests for the Airbnb Rausch migration.
 * Asserts shipped class strings (not mocked reimplementations).
 */
describe("Button design system (Airbnb Rausch)", () => {
  it("primary uses Rausch accent fill with CTA shadow and active hover", () => {
    const classes = buttonClasses("primary", "default");
    expect(classes).toContain("bg-accent");
    expect(classes).toContain("text-white");
    expect(classes).toContain("shadow-cta");
    expect(classes).toContain("hover:bg-primary-active");
    expect(classes).toContain("rounded-[8px]");
    expect(classes).toContain("normal-case");
  });

  it("highlight is a distinct ink secondary fill (not grey-on-grey)", () => {
    const classes = buttonClasses("highlight", "default");
    expect(classes).toContain("bg-action");
    expect(classes).toContain("text-action-ink");
    expect(classes).not.toContain("bg-surface-strong");
    expect(classes).not.toBe(buttonClasses("primary", "default"));
  });

  it("secondary uses ink outline rather than accent flood", () => {
    const classes = buttonClasses("secondary", "default");
    expect(classes).toContain("border-ink");
    expect(classes).toContain("text-ink");
    expect(classes).toContain("bg-transparent");
  });

  it("renders primary CTA in the DOM with expected class contract", () => {
    render(<Button variant="primary">Start matching</Button>);
    const btn = screen.getByRole("button", { name: "Start matching" });
    expect(btn.className).toMatch(/bg-accent/);
    expect(btn.className).toMatch(/shadow-cta/);
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
    // ink-2 (~7.7:1 on #ffd1da) not white-on-pink and not ink-3 (~3.96:1)
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
