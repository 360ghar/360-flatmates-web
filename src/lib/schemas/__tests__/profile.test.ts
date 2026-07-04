import { describe, expect, it } from "vitest";

import { flatmatesBootstrapSchema, flatmatesRealtimeConfigSchema } from "../profile";

describe("flatmates realtime config schema", () => {
  it("accepts the Supabase Broadcast channel config", () => {
    const config = flatmatesRealtimeConfigSchema.parse({
      provider: "supabase",
      channel: "private-flatmates-user-1",
      private: true,
      events: ["new_message", "conversation_updated", "new_notification"]
    });

    expect(config).toEqual({
      provider: "supabase",
      channel: "private-flatmates-user-1",
      private: true,
      events: ["new_message", "conversation_updated", "new_notification"]
    });
  });

  it("requires the complete backend transport metadata", () => {
    expect(() =>
      flatmatesRealtimeConfigSchema.parse({
        channel: "private-flatmates-user-1",
        events: ["new_match"]
      })
    ).toThrow();
  });

  it("rejects legacy backend stream event names", () => {
    expect(() =>
      flatmatesRealtimeConfigSchema.parse({
        provider: "supabase",
        channel: "private-flatmates-user-1",
        private: true,
        events: ["message"]
      })
    ).toThrow();
  });

  it("requires bootstrap realtime config from the backend", () => {
    expect(() =>
      flatmatesBootstrapSchema.parse({
        profile: {
          id: 1,
          full_name: "Priya Shah",
          mode: "seeker",
          onboarding_completed: true
        },
        catalogs: [],
        active_listing_count: 0,
        conversation_count: 0,
        unread_message_count: 0
      })
    ).toThrow();
  });
});
