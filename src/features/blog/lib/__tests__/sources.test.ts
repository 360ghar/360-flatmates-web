import { describe, expect, it } from "vitest";
import { readBlogSources } from "../sources";

describe("readBlogSources", () => {
  it("keeps http and https links and labels a source with its url when it has no label", () => {
    expect(
      readBlogSources([{ url: "https://example.com/a", label: "A" }, { url: "http://example.com/b" }])
    ).toEqual([
      { label: "A", url: "https://example.com/a" },
      { label: "http://example.com/b", url: "http://example.com/b" }
    ]);
  });

  it("drops javascript:, data: and malformed urls", () => {
    expect(
      readBlogSources([{ url: "javascript:alert(1)" }, { url: "data:text/html,x" }, { url: "not a url" }, { label: "no url" }])
    ).toEqual([]);
  });
});
