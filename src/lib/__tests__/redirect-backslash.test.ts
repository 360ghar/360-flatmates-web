import { describe, expect, it } from "vitest";
import { resolveRedirect } from "../redirect";

// W29 regression: protocol-relative forms never pass as in-app paths.
describe("resolveRedirect", () => {
  it("rejects protocol-relative targets", () => {
    expect(resolveRedirect("//evil.com")).toBe("/home");
    expect(resolveRedirect("/\\evil.com")).toBe("/home");
    expect(resolveRedirect("https://evil.com")).toBe("/home");
  });
  it("keeps same-origin paths", () => {
    expect(resolveRedirect("/chats/4?x=1")).toBe("/chats/4?x=1");
  });
});
