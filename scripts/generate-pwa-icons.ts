import { readFileSync } from "fs";
import { resolve } from "path";
import sharp from "sharp";

async function generateIcons() {
  const root = process.cwd();
  const faviconPath = resolve(root, "public", "favicon.svg");
  const svgBuffer = readFileSync(faviconPath);

  console.log("Generating PWA icons from favicon.svg...");

  // 1. Standard 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .webp({ quality: 90 })
    .toFile(resolve(root, "public", "favicon-192.webp"));
  console.log("Generated favicon-192.webp");

  // 2. Standard 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .webp({ quality: 90 })
    .toFile(resolve(root, "public", "favicon-512.webp"));
  console.log("Generated favicon-512.webp");

  // 3. Maskable 192x192 (scale down logo and place on Rausch #ff385c background)
  const pad192 = Math.round(192 * 0.15); // 15% padding
  const size192 = 192 - pad192 * 2;
  const logo192 = await sharp(svgBuffer)
    .resize(size192, size192)
    .toBuffer();

  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: "#ff385c"
    }
  })
    .composite([{ input: logo192, gravity: "center" }])
    .webp({ quality: 90 })
    .toFile(resolve(root, "public", "favicon-192-maskable.webp"));
  console.log("Generated favicon-192-maskable.webp");

  // 4. Maskable 512x512
  const pad512 = Math.round(512 * 0.15);
  const size512 = 512 - pad512 * 2;
  const logo512 = await sharp(svgBuffer)
    .resize(size512, size512)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: "#ff385c"
    }
  })
    .composite([{ input: logo512, gravity: "center" }])
    .webp({ quality: 90 })
    .toFile(resolve(root, "public", "favicon-512-maskable.webp"));
  console.log("Generated favicon-512-maskable.webp");

  console.log("PWA icon generation complete.");
}

generateIcons().catch((err) => {
  console.error("Error generating PWA icons:", err);
  process.exit(1);
});
