import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src", "e2e"];
const FORBIDDEN = [
  "flatmates/sse",
  "EventSource",
  "useSSE",
  "SSEConnectionState",
  "src/lib/sse",
  "sseConnected",
  "sseState",
  "ssePrimaryTab",
];

function collectFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return collectFiles(path);
    return [path];
  });
}

describe("deprecated flatmates SSE runtime", () => {
  it("does not appear in runtime source or E2E fixtures", () => {
    const offenders: string[] = [];

    for (const file of ROOTS.flatMap(collectFiles)) {
      const text = readFileSync(file, "utf8");
      for (const forbidden of FORBIDDEN) {
        if (text.includes(forbidden)) {
          offenders.push(`${file}: ${forbidden}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
