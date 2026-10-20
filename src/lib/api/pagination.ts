import type { CursorPage } from "./common.types";

/** Largest `limit` the backend accepts on a list route. */
export const MAX_PAGE_LIMIT = 100;

/** Thrown when a list still has rows after `maxPages`. `items` holds what was read. */
export class ListTruncatedError<T> extends Error {
  constructor(readonly items: T[]) {
    super(`List has more rows than the ${items.length} read`);
    this.name = "ListTruncatedError";
  }
}

/**
 * Read every row of a list: request a page, follow `next_cursor` while
 * `has_more` is true. `request` must send the same filters on every page.
 * `maxPages` stops a runaway list (100 rows a page); a list that is still
 * `has_more` then throws `ListTruncatedError` instead of passing as complete.
 */
export async function fetchAllPages<T>(
  request: (cursor: string | undefined) => Promise<CursorPage<T>>,
  maxPages = 50
): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < maxPages; page += 1) {
    const result = await request(cursor);
    items.push(...result.items);
    if (!result.has_more || !result.next_cursor) return items;
    cursor = result.next_cursor;
  }
  throw new ListTruncatedError(items);
}
