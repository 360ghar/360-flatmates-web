import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Token values from DESIGN.md §1. The mobile repo has the same test.
const THEMES = {
  light: {
    backgrounds: { sky: "#E4EBE3", paper1: "#EDF1EA", paper2: "#FDFCFA", paper3: "#FFFFFF" },
    text: {
      ink: "#23201C",
      ink2: "#4A443D",
      ink3: "#6B6359",
      clay: "#A94A2B",
      pine: "#2E5B48",
      danger: "#B3261E",
      warningInk: "#7E5208"
    },
    pairs: [
      ["#FFFFFF", "#A94A2B"], // on-clay / clay
      ["#FFFFFF", "#8C3B20"], // on-clay / clay-press
      ["#FFFFFF", "#2E5B48"], // on-pine / pine
      ["#23201C", "#F6E6DE"], // ink / clay-soft
      ["#23201C", "#D3E2D8"], // ink / pine-soft
      ["#A94A2B", "#F6E6DE"], // clay / clay-soft
      ["#B3261E", "#F6DAD7"], // danger / danger-soft
      ["#7E5208", "#F7E8C8"] // warning-ink / warning-soft
    ]
  },
  dark: {
    backgrounds: { sky: "#121814", paper1: "#19211C", paper2: "#222A24", paper3: "#2A332C" },
    text: {
      ink: "#F1EDE6",
      ink2: "#CBC4B9",
      ink3: "#A39C91",
      clay: "#E27E5A",
      pine: "#86B9A0",
      danger: "#F2A097",
      warningInk: "#E8B458"
    },
    pairs: [
      ["#1A120E", "#E27E5A"],
      ["#1A120E", "#C9694A"],
      ["#1A120E", "#86B9A0"],
      ["#F1EDE6", "#3A2A23"],
      ["#F1EDE6", "#22352C"],
      ["#E27E5A", "#3A2A23"],
      ["#F2A097", "#3B2220"],
      ["#E8B458", "#352B19"]
    ]
  }
} as const;

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("paper palette contrast (WCAG AA)", () => {
  for (const [name, theme] of Object.entries(THEMES)) {
    it(`${name}: every text token passes 4.5:1 on every paper layer`, () => {
      for (const [fgName, fg] of Object.entries(theme.text)) {
        for (const [bgName, bg] of Object.entries(theme.backgrounds)) {
          expect(contrast(fg, bg), `${fgName} on ${bgName}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    });

    it(`${name}: filled and tinted pairs pass 4.5:1`, () => {
      for (const [fg, bg] of theme.pairs) {
        expect(contrast(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  it("globals.css uses the DESIGN.md values", () => {
    const css = readFileSync(resolve(__dirname, "../globals.css"), "utf8").toUpperCase();
    for (const theme of Object.values(THEMES)) {
      for (const hex of [...Object.values(theme.backgrounds), ...Object.values(theme.text)]) {
        expect(css, hex).toContain(hex.toUpperCase());
      }
    }
  });
});
