import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Token contract for the Paper Diorama design system (DESIGN.md).
 * Reads the shipped globals.css — not a reimplementation.
 */
const globalsPath = resolve(__dirname, "../globals.css");
const css = readFileSync(globalsPath, "utf8");

/** Extract the first occurrence of a CSS custom property value in a CSS block. */
function tokenValue(name: string, block: string = css): string | null {
  const re = new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*([^;]+);`);
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

/** Dark-theme block only — excludes light defaults that precede it. */
function darkThemeBlock(): string {
  const idx = css.indexOf('[data-theme="dark"]');
  if (idx < 0) return "";
  return css.slice(idx);
}

describe("design tokens (globals.css)", () => {
  it("maps primary and accent onto clay", () => {
    expect(tokenValue("--color-clay")).toBe("#A94A2B");
    expect(tokenValue("--color-primary")).toBe("var(--color-clay)");
    expect(tokenValue("--color-accent")).toBe("var(--color-clay)");
  });

  it("uses the sky as page canvas and paper for cards", () => {
    expect(tokenValue("--color-sky")).toBe("#E4EBE3");
    expect(tokenValue("--color-paper")).toBe("var(--color-sky)");
    expect(tokenValue("--color-surface")).toBe("#FDFCFA");
    expect(tokenValue("--color-ink")).toBe("#23201C");
  });

  it("does not bring back Rausch, Inter or the violet palette", () => {
    const lower = css.toLowerCase();
    expect(lower).not.toContain("#ff385c");
    expect(lower).not.toContain("#6e57e8");
    expect(css).not.toMatch(/font-inter|\bInter\b/);
  });

  it("keeps a directional shadow ladder with distinct tiers", () => {
    const tiers = ["--shadow-xs", "--shadow-sm", "--shadow-md", "--shadow-lg"].map((t) => tokenValue(t));
    for (const tier of tiers) expect(tier).toBeTruthy();
    expect(new Set(tiers).size).toBe(4);
    // No symmetric bloom: every blurred layer after the edge lip is offset down.
    for (const tier of tiers.slice(1)) {
      expect(tier!).toMatch(/\d+px \d+px \d+px -\d+px/);
    }
  });

  it("defines pressed and disabled button states", () => {
    expect(tokenValue("--color-primary-active")).toBe("var(--color-clay-press)");
    expect(tokenValue("--color-primary-disabled")).toBeTruthy();
  });

  it("dark mode is a pine-black night, not blue-charcoal", () => {
    const dark = darkThemeBlock();
    expect(tokenValue("--color-sky", dark)).toBe("#121814");
    expect(tokenValue("--color-clay", dark)).toBe("#E27E5A");
    expect(tokenValue("--color-ink", dark)).toBe("#F1EDE6");
    const disabled = tokenValue("--color-primary-disabled", dark)!;
    expect(disabled.toLowerCase()).toMatch(/^#[0-4]/);
    // Green channel >= blue channel on the night canvas.
    const sky = tokenValue("--color-sky", dark)!;
    expect(parseInt(sky.slice(3, 5), 16)).toBeGreaterThanOrEqual(parseInt(sky.slice(5, 7), 16));
  });
});
