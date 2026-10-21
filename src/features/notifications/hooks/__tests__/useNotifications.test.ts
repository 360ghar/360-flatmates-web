/**
 * Unit tests for useNotifications.queryFn envelope-shape guard.
 *
 * Regression coverage for the deployed `TypeError: h?.filter is not a function`
 * crash caused by the cursor-envelope refactor (the old queryFn treated the
 * whole CursorPage envelope as a flat array). The guard must always return an
 * array, even when the API returns malformed/non-envelope payloads.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const requestMock = vi.fn();

vi.mock("@/lib/api", () => ({
  get apiClient() {
    return { request: requestMock };
  }
}));

import { notificationsOptions } from "@/features/notifications/hooks/useNotifications";

describe("notificationsOptions.queryFn envelope guard", () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it("returns the items array for a well-formed CursorPage envelope", async () => {
    requestMock.mockResolvedValue({
      items: [
        { id: "1", type: "like", title: "t", body: "b", is_read: false }
      ],
      has_more: false,
      next_cursor: null
    });

    const data = await notificationsOptions().queryFn();

    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("1");
  });

  it("returns [] when response is a CursorPage envelope whose items is not an array (shape drift)", async () => {
    // Simulates a malformed backend response: items present but an object.
    requestMock.mockResolvedValue({
      items: { not: "an array" },
      has_more: false,
      next_cursor: null
    });

    const data = await notificationsOptions().queryFn();

    expect(Array.isArray(data)).toBe(true);
    expect(data).toEqual([]);
  });

  it("returns [] when response is an empty object (no items field)", async () => {
    requestMock.mockResolvedValue({});

    const data = await notificationsOptions().queryFn();

    expect(data).toEqual([]);
  });

  it("returns [] when response is null", async () => {
    requestMock.mockResolvedValue(null);

    const data = await notificationsOptions().queryFn();

    expect(data).toEqual([]);
  });
});
