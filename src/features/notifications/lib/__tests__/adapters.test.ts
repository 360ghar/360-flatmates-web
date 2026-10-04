import { describe, it, expect } from "vitest";
import { notificationToNotificationCardProps } from "../adapters";
import type { FlatmatesNotification } from "@/lib/api/types";

describe("notificationToNotificationCardProps", () => {
  it("converts number ID to string", () => {
    const notification = {
      id: "notif-1",
      type: "new_match",
      title: "New Match!",
      body: "You matched with Aditi",
      is_read: false,
      created_at: "2026-05-16T10:00:00Z"
    } as FlatmatesNotification;

    const result = notificationToNotificationCardProps(notification);
    expect(result.id).toBe("notif-1");
  });

  it("maps type correctly", () => {
    const match = { id: "1", type: "new_match", title: "Match", body: "", is_read: false } as FlatmatesNotification;
    expect(notificationToNotificationCardProps(match).type).toBe("new_match");

    const message = { id: "2", type: "new_message", title: "Message", body: "", is_read: false } as FlatmatesNotification;
    expect(notificationToNotificationCardProps(message).type).toBe("new_message");

    const listing = { id: "3", type: "listing_approved", title: "Approved", body: "", is_read: false } as FlatmatesNotification;
    expect(notificationToNotificationCardProps(listing).type).toBe("listing_approved");

    const unknown = { id: "4", type: "unknown_type", title: "Unknown", body: "", is_read: false } as FlatmatesNotification;
    expect(notificationToNotificationCardProps(unknown).type).toBe("general");
  });

  it("maps is_read to unread (inverted)", () => {
    const read = { id: "1", type: "new_match", title: "Read", body: "", is_read: true } as FlatmatesNotification;
    expect(notificationToNotificationCardProps(read).unread).toBe(false);

    const unread = { id: "2", type: "new_match", title: "Unread", body: "", is_read: false } as FlatmatesNotification;
    expect(notificationToNotificationCardProps(unread).unread).toBe(true);
  });
});
