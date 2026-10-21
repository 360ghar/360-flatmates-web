export interface BlogSource {
  label: string;
  url: string;
}

/** Only http(s) goes into an `href`: `javascript:` and other schemes are dropped. */
function isWebUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** The `sources` of a post are free objects. Keep the ones that have a web link. */
export function readBlogSources(sources: ReadonlyArray<Record<string, unknown>> | null | undefined): BlogSource[] {
  const result: BlogSource[] = [];
  for (const source of sources ?? []) {
    const url = typeof source.url === "string" ? source.url : "";
    if (!isWebUrl(url)) continue;
    const label = typeof source.label === "string" && source.label ? source.label : url;
    result.push({ label, url });
  }
  return result;
}
