import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "../Card";

describe("Card design system", () => {
  it("default card is a grained paper sheet with a hand-cut radius", () => {
    render(
      <Card data-testid="card" variant="default">
        Content
      </Card>
    );
    const el = screen.getByTestId("card");
    expect(el.className).toMatch(/rounded-hand/);
    expect(el.className).toMatch(/bg-surface/);
    expect(el.className).toMatch(/paper-grain/);
    expect(el.className).toMatch(/shadow-sm/);
    expect(el.className).not.toMatch(/border-line/);
  });

  it("promo card is a grained paper-1 band", () => {
    render(
      <Card data-testid="promo" variant="promo">
        Promo
      </Card>
    );
    const el = screen.getByTestId("promo");
    expect(el.className).toMatch(/bg-paper-1/);
    expect(el.className).toMatch(/radius-promo/);
  });

  it("elevated card sits above default with stronger shadow", () => {
    render(
      <Card data-testid="elevated" variant="elevated">
        Up
      </Card>
    );
    const el = screen.getByTestId("elevated");
    expect(el.className).toMatch(/shadow-md/);
    expect(el.className).toMatch(/bg-surface-elevated/);
  });

  it("media card is photo-first (p-0 surface + shadow)", () => {
    render(
      <Card data-testid="media" variant="media">
        Photo
      </Card>
    );
    const el = screen.getByTestId("media");
    expect(el.className).toMatch(/p-0/);
    expect(el.className).toMatch(/bg-surface/);
    expect(el.className).toMatch(/shadow-sm/);
  });
});
