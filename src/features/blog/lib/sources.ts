export interface BlogSource {
  label: string;
  url: string;
}

/** The `sources` of a post are free objects. Keep the ones that have a link. */
export function readBlogSources(sources: ReadonlyArray<Record<string, unknown>> | null | undefined): BlogSource[] {
  const result: BlogSource[] = [];
  for (const source of sources ?? []) {
    const url = typeof source.url === "string" ? source.url : "";
    if (!url) continue;
    const label = typeof source.label === "string" && source.label ? source.label : url;
    result.push({ label, url });
  }
  return result;
}
