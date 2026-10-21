/**
 * Generate the 1200x630 social preview (og-image.webp) and the 512 logo
 * (logo.webp) for 360 Flatmates, in the Paper Diorama style (DESIGN.md).
 *
 * The scene is drawn from the generated cut-paper art (src/components/paper/art.ts).
 * Chrome (Playwright) renders the page so Gambarino matches the live site;
 * librsvg and Pango ignore embedded or file fonts on some platforms.
 *
 * Output is committed. Run after changing the art or tokens:
 *   npm run generate:og-image
 */
import { resolve } from "path";
import { readFileSync } from "fs";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { paperArt, type PaperArtName } from "../src/components/paper/art";

// Light-theme tokens (DESIGN.md §1, §6).
const C = {
  sky: "#E4EBE3",
  ink: "#23201C",
  ink2: "#4A443D",
  clay: "#A94A2B",
  hillFar: "#C3D5C8",
  hillNear: "#93B39F",
  townFar: "#DDB3A0",
  window: "#F6EBD9",
  tree: "#2E5B48",
  sun: "#E0A034",
  cloud: "#FFFFFF"
} as const;

const root = process.cwd();
const fontUrl = `data:font/woff2;base64,${readFileSync(resolve(root, "public", "fonts", "Gambarino-Regular.woff2")).toString("base64")}`;

const shadow = `<filter id="paper" x="-5%" y="-5%" width="110%" height="115%">
  <feDropShadow dx="1" dy="2" stdDeviation="0.75" flood-color="${C.ink}" flood-opacity="0.22"/>
</filter>`;

function layer(name: PaperArtName, fill: string, withShadow = true): string {
  const shape = paperArt[name];
  return `<path d="${shape.d}" fill="${fill}" fill-rule="${shape.evenOdd ? "evenodd" : "nonzero"}"${withShadow ? ' filter="url(#paper)"' : ""}/>`;
}

/** Page wrapper: Chrome renders the Gambarino woff2 exactly like the site. */
function page(width: number, height: number, body: string): string {
  return `<!doctype html><html><head><style>
    @font-face { font-family: "Gambarino"; src: url("${fontUrl}") format("woff2"); }
    html, body { margin: 0; width: ${width}px; height: ${height}px; overflow: hidden; }
    body { font-family: "Gambarino", serif; font-synthesis: none; }
  </style></head><body>${body}</body></html>`;
}

function buildOgHtml(): string {
  return page(1200, 630, `
<div style="position:absolute;left:80px;top:52px;font-size:38px"><span style="color:${C.clay}">360</span> <span style="color:${C.ink}">Flatmates</span></div>
<div style="position:absolute;left:80px;top:124px;font-size:68px;line-height:76px;color:${C.ink}">Find your flatmate,<br>not a nightmare.</div>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" style="position:absolute;inset:0;z-index:-1">
  <defs>${shadow}</defs>
  <rect width="1200" height="630" fill="${C.sky}"/>
  <g transform="translate(0 270)">
    ${layer("sun", C.sun)}${layer("cloudA", C.cloud)}${layer("cloudB", C.cloud)}
    ${layer("hillsFar", C.hillFar)}${layer("townFar", C.townFar)}${layer("hillsNear", C.hillNear)}
    ${layer("townWindows", C.window, false)}${layer("townNear", C.clay)}${layer("tree", C.tree)}
  </g>
</svg>`);
}

function buildLogoHtml(): string {
  return page(512, 512, `
<div style="width:512px;height:512px;border-radius:112px;background:${C.sky};display:flex;flex-direction:column;align-items:center;justify-content:center">
  <div style="font-size:176px;line-height:1;color:${C.clay}">360</div>
  <div style="font-size:64px;line-height:1.2;color:${C.ink}">Flatmates</div>
</div>`);
}

async function generateOgImage(): Promise<void> {
  const browser = await chromium.launch(process.env.CI ? {} : { channel: "chrome" });
  const shot = async (html: string, width: number, height: number, file: string, quality: number) => {
    const tab = await browser.newPage({ viewport: { width, height } });
    await tab.setContent(html);
    await tab.evaluate(() => document.fonts.ready);
    const png = await tab.screenshot({ omitBackground: true });
    await sharp(png).webp({ quality }).toFile(resolve(root, "public", file));
    await tab.close();
    console.log(`Generated ${file} (${width}x${height})`);
  };
  try {
    await shot(buildOgHtml(), 1200, 630, "og-image.webp", 85);
    await shot(buildLogoHtml(), 512, 512, "logo.webp", 90);
  } finally {
    await browser.close();
  }
}

generateOgImage().catch((err) => {
  console.error("Error generating OG image / logo:", err);
  process.exit(1);
});
