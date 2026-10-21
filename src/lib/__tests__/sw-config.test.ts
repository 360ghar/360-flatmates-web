import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// W1 regression: the service worker must never cache API responses. The
// cache key ignores Authorization, so a shared device would leak data.
describe("service worker config", () => {
  it("has no runtime cache rule for /api/", () => {
    const config = readFileSync(resolve(__dirname, "../../../vite.config.ts"), "utf8");
    expect(config).not.toMatch(/startsWith\(["']\/api\/["']\)/);
    expect(config).not.toMatch(/cacheName:\s*["']api["']/);
  });
});
