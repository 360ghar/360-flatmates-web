import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Token contract for the Airbnb Rausch design system.
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
  it("uses Airbnb Rausch as primary and accent brand color", () => {
    expect(tokenValue("--color-primary")).toBe("#ff385c");
    expect(tokenValue("--color-accent")).toBe("#ff385c");
  });

  it("uses white/Airbnb neutrals as the default canvas (not cream paper)", () => {
    expect(tokenValue("--color-paper")).toBe("#ffffff");
    expect(tokenValue("--color-surface")).toBe("#ffffff");
    expect(tokenValue("--color-surface-soft")).toBe("#f7f7f7");
    expect(tokenValue("--color-ink")).toBe("#222222");
  });

  it("does not reintroduce the old violet as global primary/accent", () => {
    expect(tokenValue("--color-primary")).not.toBe("#6e57e8");
    expect(tokenValue("--color-accent")).not.toBe("#6e57e8");
    // cream paper should not be the default
    expect(tokenValue("--color-paper")).not.toBe("#f7f5ec");
  });

  it("keeps a shadow ladder (not collapsed identical tiers)", () => {
    const xs = tokenValue("--shadow-xs");
    const sm = tokenValue("--shadow-sm");
    const md = tokenValue("--shadow-md");
    const lg = tokenValue("--shadow-lg");
    const cta = tokenValue("--shadow-cta");
    expect(xs).toBeTruthy();
    expect(sm).toBeTruthy();
    expect(md).toBeTruthy();
    expect(lg).toBeTruthy();
    expect(cta).toBeTruthy();
    expect(xs).not.toBe("none");
    expect(cta).not.toBe("none");
    // tiers must differ for hierarchy
    expect(xs).not.toBe(sm);
    expect(sm).not.toBe(md);
    expect(md).not.toBe(lg);
    // CTA shadow carries Rausch tint
    expect(cta!.toLowerCase()).toMatch(/255,\s*56,\s*92|ff385c/);
  });

  it("provides distinct section-rhythm fills (not all identical greys)", () => {
    const lavender = tokenValue("--color-lavender");
    const peach = tokenValue("--color-peach");
    const sky = tokenValue("--color-sky");
    const mint = tokenValue("--color-mint");
    const action = tokenValue("--color-action");
    expect(lavender).toBeTruthy();
    expect(peach).toBeTruthy();
    expect(sky).toBeTruthy();
    expect(mint).toBeTruthy();
    // at least some differentiation between section bands
    const set = new Set([lavender, peach, sky, mint]);
    expect(set.size).toBeGreaterThan(1);
    // action is ink secondary (Airbnb black CTA), not flat grey
    expect(action).toBe("#222222");
  });

  it("defines primary-active and primary-disabled for button states (light)", () => {
    expect(tokenValue("--color-primary-active")).toBe("#e00b41");
    expect(tokenValue("--color-primary-disabled")).toBe("#ffd1da");
  });

  it("includes dark-mode Rausch lift, dark surfaces, and distinct disabled/active CTAs", () => {
    expect(css).toContain('[data-theme="dark"]');
    const dark = darkThemeBlock();
    expect(tokenValue("--color-primary", dark)).toBe("#ff5572");
    expect(tokenValue("--color-paper", dark)).toBe("#1a1a1a");
    expect(tokenValue("--color-ink", dark)).toBe("#ffffff");
    // Dark disabled must NOT inherit light soft-pink (#ffd1da) — white-on-pink fails contrast
    const darkDisabled = tokenValue("--color-primary-disabled", dark);
    const darkActive = tokenValue("--color-primary-active", dark);
    expect(darkDisabled).toBeTruthy();
    expect(darkActive).toBeTruthy();
    expect(darkDisabled!.toLowerCase()).not.toBe("#ffd1da");
    // Dark disabled fill is a deep muted tone (not light pink)
    expect(darkDisabled!.toLowerCase()).toMatch(/^#[0-4]/);
    // Active is a lifted Rausch, distinct from disabled
    expect(darkActive).not.toBe(darkDisabled);
    expect(darkActive!.toLowerCase()).toMatch(/#ff/);
  });
});
