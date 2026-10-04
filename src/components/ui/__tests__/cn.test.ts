import { describe, expect, it } from "vitest";
import { cn } from "../component-utils";

describe("cn", () => {
  it("keeps a type role next to a colour", () => {
    expect(cn("text-h1", "text-ink")).toBe("text-h1 text-ink");
    expect(cn("text-caption text-ink-3", "text-error")).toBe("text-caption text-error");
  });

  it("lets a later conflicting class win", () => {
    expect(cn("p-4", "p-0")).toBe("p-0");
    expect(cn("text-body-md", "text-h3")).toBe("text-h3");
    expect(cn("rounded-hand", "rounded-cut-md")).toBe("rounded-cut-md");
    expect(cn("shadow-sm", "shadow-none")).toBe("shadow-none");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});
