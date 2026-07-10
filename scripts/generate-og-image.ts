/**
 * Generate 1200x630 social preview WebP (og-image.webp) and a square brand
 * logo WebP (logo.webp) for 360 Flatmates.
 *
 * The brand font (Inter) is self-hosted as a variable TTF in public/fonts/.
 * We embed it into the SVG as a base64 @font-face block so sharp's librsvg
 * renderer paints the real brand typography deterministically.
 *
 * Run:  npx tsx scripts/generate-og-image.ts
 *
 * Output:
 *   public/og-image.webp   (1200 x 630, optimized)
 *   public/logo.webp       (512 x 512, brand mark)
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import sharp from "sharp";

// ── Brand tokens (Airbnb design system) ───────────────────────────────────
const C = {
  canvas: "#ffffff",
  surfaceSoft: "#f7f7f7",
  surfaceStrong: "#f2f2f2",
  ink: "#222222",
  ink2: "#3f3f3f",
  ink3: "#6a6a6a",
  accent: "#ff385c",
  accentDeep: "#e00b41",
  accentSoft: "#ffd1da",
} as const;

const root = process.cwd();
const fontsDir = resolve(root, "public", "fonts");

function fontDataUri(file: string): string {
  const buf = readFileSync(resolve(fontsDir, file));
  return `data:font/ttf;base64,${buf.toString("base64")}`;
}

/**
 * Build the 1200x630 social card as an SVG string with embedded fonts.
 */
function buildOgSvg(): string {
  const inter = fontDataUri("Inter-Variable.ttf");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style type="text/css"><![CDATA[
      @font-face {
        font-family: "Inter";
        src: url("${inter}") format("truetype");
        font-weight: 100 900;
      }
    ]]></style>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${C.accent}"/>
      <stop offset="100%" stop-color="${C.accentDeep}"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="${C.canvas}"/>

  <!-- Top + bottom accent bars -->
  <rect x="0" y="0" width="1200" height="8" fill="url(#accent)"/>
  <rect x="0" y="622" width="1200" height="8" fill="url(#accent)"/>

  <!-- Brand mark: circular "360" arrow -->
  <g transform="translate(140 130)">
    <rect x="0" y="0" width="150" height="150" rx="34" fill="${C.accent}"/>
    <g transform="translate(75 75)">
      <circle cx="0" cy="0" r="44" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" stroke-dasharray="220 276"/>
      <polyline points="24,-34 41,-47 37,-22" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>

  <!-- Wordmark next to mark -->
  <text x="320" y="220" font-family="Inter, sans-serif" font-size="40" font-weight="700" fill="${C.ink}" letter-spacing="-0.5">360 Flatmates</text>

  <!-- Eyebrow tag -->
  <text x="92" y="320" font-family="Inter, sans-serif" font-size="22" font-weight="700" fill="${C.accent}" letter-spacing="3">VERIFIED ROOMS · COMPATIBLE FLATMATES</text>

  <!-- Headline -->
  <text x="90" y="408" font-family="Inter, sans-serif" font-size="72" font-weight="700" fill="${C.ink}" letter-spacing="-1">Find your flatmate.</text>
  <text x="90" y="500" font-family="Inter, sans-serif" font-size="72" font-weight="700" fill="${C.ink}" letter-spacing="-1">Find your <tspan font-style="italic" fill="${C.accent}">vibe.</tspan></text>

  <!-- Subline -->
  <text x="92" y="556" font-family="Inter, sans-serif" font-size="28" font-weight="400" fill="${C.ink3}">Verified rooms and compatible flatmates across India.</text>

  <!-- Domain -->
  <text x="1108" y="566" font-family="Inter, sans-serif" font-size="26" font-weight="700" fill="${C.accent}" text-anchor="end" letter-spacing="1">360ghar.com</text>
</svg>`;
}

/** Build the square 512 brand logo SVG (the mark + wordmark). */
function buildLogoSvg(): string {
  const inter = fontDataUri("Inter-Variable.ttf");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <style type="text/css"><![CDATA[
      @font-face { font-family: "Inter"; src: url("${inter}") format("truetype"); font-weight: 100 900; }
    ]]></style>
  </defs>
  <rect width="512" height="512" rx="112" fill="${C.canvas}"/>
  <rect width="512" height="512" rx="112" fill="none" stroke="${C.surfaceStrong}" stroke-width="3"/>
  <g transform="translate(256 200)">
    <circle cx="0" cy="0" r="96" fill="none" stroke="${C.accent}" stroke-width="16" stroke-linecap="round" stroke-dasharray="480 603"/>
    <polyline points="56,-72 96,-104 84,-44" fill="none" stroke="${C.accent}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="256" y="372" font-family="Inter, sans-serif" font-size="64" font-weight="700" fill="${C.ink}" text-anchor="middle" letter-spacing="-1">360 Flatmates</text>
  <text x="256" y="412" font-family="Inter, sans-serif" font-size="22" font-weight="700" fill="${C.accent}" text-anchor="middle" letter-spacing="3">360GHAR.COM</text>
</svg>`;
}

async function generateOgImage(): Promise<void> {
  const svg = Buffer.from(buildOgSvg(), "utf-8");
  const out = resolve(root, "public", "og-image.webp");
  await sharp(svg, { density: 144 })
    .resize(1200, 630, { fit: "cover" })
    .webp({ quality: 85 })
    .toFile(out);
  console.log("Generated og-image.webp (1200x630)");

  // logo.webp
  const logoSvg = Buffer.from(buildLogoSvg(), "utf-8");
  const logoOut = resolve(root, "public", "logo.webp");
  await sharp(logoSvg, { density: 144 })
    .resize(512, 512, { fit: "cover" })
    .webp({ quality: 90 })
    .toFile(logoOut);
  console.log("Generated logo.webp (512x512)");
}

generateOgImage().catch((err) => {
  console.error("Error generating OG image / logo:", err);
  process.exit(1);
});
