import { describe, expect, it } from "vitest";

import { routeInventory } from "@/lib/route-inventory";

const expectedRoutes = [
  "/",
  "/discover",
  "/discover/koramangala-studio",
  "/search",
  "/search/semantic",
  "/login",
  "/signup",
  "/forgot-password",
  "/add-phone",
  "/auth/callback",
  "/complete-profile",
  "/onboarding",
  "/onboarding/mode",
  "/home",
  "/swipe",
  "/likes",
  "/matches",
  "/chats",
  "/chats/c-priya",
  "/compatibility/1",
  "/explore",
  "/post",
  "/post/review",
  "/post/review/123",
  "/manage",
  "/dashboard",
  "/dashboard/analytics",
  "/visits",
  "/visits/v-1",
  "/profile",
  "/profile/priya",
  "/profile/edit",
  "/settings",
  "/settings/appearance",
  "/settings/blocked-users",
  "/settings/notifications",
  "/settings/report-problem",
  "/notifications",
  "/saved-searches",
  "/alerts",
  "/payments",
  "/payments/new",
  "/my-listings/koramangala-studio/edit",
  "/my-listings/koramangala-studio",
  "/choose-role",
  "/location",
  "/help",
  "/terms",
  "/privacy",
  "/about",
  "/maintenance",
  "/not-found",
  "/error",
  "/admin/stats",
  "/admin/moderation/listings",
  "/admin/moderation/reports",
  "/admin/moderation/prescreen/koramangala-studio",
  "/admin/blog",
] as const;

const staleDesignAliases = ["/chat", "/bookings", "/admin/moderation", "/app/compatibility/1", "/app/explore"] as const;

describe("route contracts", () => {
  it("tracks every documented route sample in one canonical inventory", () => {
    expect(new Set(routeInventory).size).toBe(routeInventory.length);
    for (const stale of staleDesignAliases) {
      expect(routeInventory).not.toContain(stale);
    }
  });

  it("covers all expected route samples in the inventory", () => {
    for (const route of expectedRoutes) {
      expect(routeInventory, `Missing route: ${route}`).toContain(route);
    }
  });
});
