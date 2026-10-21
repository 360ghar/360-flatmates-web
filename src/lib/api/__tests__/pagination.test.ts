import { describe, expect, it, vi } from "vitest";
import { fetchAllPages, ListTruncatedError } from "../pagination";

const page = (items: number[], next: string | null) => ({
  items,
  next_cursor: next,
  has_more: next !== null,
  limit: 100,
  total: null
});

describe("fetchAllPages", () => {
  it("follows next_cursor until has_more is false", async () => {
    const request = vi.fn(async (cursor: string | undefined) => (cursor ? page([2], null) : page([1], "c2")));
    await expect(fetchAllPages(request)).resolves.toEqual([1, 2]);
    expect(request).toHaveBeenNthCalledWith(2, "c2");
  });

  it("throws ListTruncatedError with the rows read when maxPages runs out", async () => {
    const request = vi.fn(async () => page([1], "again"));
    const err = await fetchAllPages(request, 3).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ListTruncatedError);
    expect((err as ListTruncatedError<number>).items).toEqual([1, 1, 1]);
    expect(request).toHaveBeenCalledTimes(3);
  });
});
