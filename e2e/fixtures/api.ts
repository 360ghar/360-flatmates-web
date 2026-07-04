import type { Page, Route } from "@playwright/test";

const now = new Date("2026-06-29T08:00:00.000Z").toISOString();

const profile = {
  id: 1,
  full_name: "Priya Shah",
  email: "priya@example.com",
  phone: "+919999999999",
  mode: "open_to_both",
  onboarding_completed: true,
  profile_status: "active",
  city: "Bangalore",
  locality: "Koramangala",
  age: 26,
  profession: "Software Engineer",
  budget_min: 15000,
  budget_max: 30000,
  move_in_timeline: "this_month",
  sleep_schedule: "early_bird",
  cleanliness: "tidy",
  food_habits: "vegetarian",
  smoking_drinking: "neither",
  guests_policy: "occasional_ok",
  work_style: "hybrid",
  gender_preference: "any",
  bio: "Looking for a clean, calm flatshare near work.",
  last_active_at: now,
};

const peer = {
  id: 2,
  full_name: "Aarav Mehta",
  mode: "seeker",
  city: "Bangalore",
  locality: "Indiranagar",
  age: 28,
  profession: "Product Manager",
  budget_min: 18000,
  budget_max: 35000,
  move_in_timeline: "this_month",
  sleep_schedule: "early_bird",
  cleanliness: "tidy",
  food_habits: "vegetarian",
  smoking_drinking: "neither",
  guests_policy: "occasional_ok",
  work_style: "hybrid",
  gender_preference: "any",
  match_percentage: 86,
  property_id: 101,
  property_title: "Sunny room in Koramangala",
  monthly_rent: 22000,
  main_image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
};

const property = {
  id: 101,
  owner_id: 2,
  property_type: "apartment",
  purpose: "flatmate",
  title: "Sunny room in Koramangala",
  description: "A bright private room in a calm, vegetarian flatshare.",
  city: "Bangalore",
  state: "Karnataka",
  locality: "Koramangala",
  sub_locality: "5th Block",
  latitude: 12.9352,
  longitude: 77.6245,
  monthly_rent: 22000,
  security_deposit: 44000,
  maintenance_charges: 2500,
  area_sqft: 950,
  bedrooms: 3,
  bathrooms: 2,
  features: ["Private room", "Balcony", "WiFi"],
  tags: ["vegetarian", "quiet"],
  main_image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
  image_urls: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"],
  available_from: "2026-07-15",
  gender_preference: "any",
  sharing_type: "private_room",
  society_type: "gated",
  society_amenities: ["gym", "security"],
  society_vibe_tags: ["quiet", "professional"],
  interest_count: 4,
  view_count: 120,
  like_count: 12,
  is_available: true,
  status: "active",
  property_status: "approved",
  owner: {
    id: 2,
    full_name: "Aarav Mehta",
    phone: "+919888888888",
  },
};

const catalogs = [
  {
    key: "cities",
    version: 1,
    payload: { items: [
      { id: 1, name: "Bangalore", state: "Karnataka", is_active: true },
      { id: 2, name: "Mumbai", state: "Maharashtra", is_active: true },
    ] },
  },
  {
    key: "localities",
    version: 1,
    payload: { items: [
      { id: 11, name: "Koramangala", city_id: 1, city_name: "Bangalore" },
      { id: 12, name: "Indiranagar", city_id: 1, city_name: "Bangalore" },
      { id: 21, name: "Bandra", city_id: 2, city_name: "Mumbai" },
    ] },
  },
  {
    key: "amenities",
    version: 1,
    payload: { items: [
      { id: 101, name: "WiFi", category: "utility", icon: "wifi" },
      { id: 102, name: "Gym", category: "society", icon: "dumbbell" },
      { id: 103, name: "Security", category: "society", icon: "shield" },
    ] },
  },
];

const realtime = {
  provider: "supabase",
  channel: "flatmates:user:1",
  private: true,
  events: [
    "new_match",
    "new_message",
    "conversation_updated",
    "visit_updated",
    "listing_status_changed",
    "new_notification",
  ],
};

const conversation = {
  id: 201,
  source: "match",
  status: "active",
  peer,
  context_property: {
    id: property.id,
    title: property.title,
    locality: property.locality,
    city: property.city,
    monthly_rent: property.monthly_rent,
    main_image_url: property.main_image_url,
    owner_name: peer.full_name,
  },
  last_message_preview: "Can I visit this weekend?",
  last_message_at: now,
  unread_count: 0,
  matched_at: now,
};

const visit = {
  id: 301,
  user_id: 1,
  property_id: property.id,
  property_title: property.title,
  counterparty_user_id: peer.id,
  conversation_id: conversation.id,
  visit_context: "property_tour",
  scheduled_date: "2026-07-02T11:00:00.000Z",
  status: "requested",
  special_requirements: "Weekend preferred",
  created_at: now,
};

function cursor<T>(items: T[], limit = 20) {
  return {
    items,
    next_cursor: null,
    has_more: false,
    limit,
    total: items.length,
  };
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function pathFor(route: Route): string {
  return new URL(route.request().url()).pathname.replace(/^\/api\/v1/, "");
}

export async function installApiMocks(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const path = pathFor(route);

    if (method !== "GET") {
      const posted = request.postDataJSON() as Record<string, unknown> | null;
      if (path === "/flatmates/swipes") return json(route, { did_match: true, match_id: 501, conversation_id: conversation.id });
      if (path.includes("/messages")) return json(route, { ...(posted ?? {}), id: 999, conversation_id: conversation.id, sender_id: 1, message_type: "text", created_at: now });
      if (path.includes("/visits")) return json(route, visit);
      if (path.includes("/properties")) return json(route, property);
      return json(route, { message: "ok" });
    }

    if (path === "/users/me/auth-state") {
      return json(route, { stage: "active", next_action: "home", missing_fields: [] });
    }
    if (path === "/flatmates/profile") return json(route, profile);
    if (path === "/flatmates/bootstrap") {
      return json(route, {
        profile,
        catalogs,
        active_listing_count: 1,
        conversation_count: 1,
        unread_message_count: 0,
        realtime,
      });
    }
    if (path === "/flatmates/catalogs") return json(route, catalogs);
    if (path === "/flatmates/notifications") return json(route, cursor([]));
    if (path === "/flatmates/conversations") return json(route, cursor([conversation]));
    if (/^\/flatmates\/conversations\/[^/]+\/messages$/.test(path)) {
      return json(route, {
        messages: [
          {
            id: 401,
            conversation_id: conversation.id,
            sender_id: peer.id,
            body: "Can I visit this weekend?",
            message_type: "text",
            created_at: now,
          },
        ],
        total: 1,
        has_more: false,
        next_cursor: null,
      });
    }
    if (/^\/flatmates\/conversations\/[^/]+$/.test(path)) return json(route, conversation);
    if (path === "/flatmates/matches") {
      return json(route, cursor([{ id: 501, status: "matched", peer, context_property: conversation.context_property, created_at: now }]));
    }
    if (path === "/flatmates/likes") {
      return json(route, cursor([{ id: 601, peer, context_property: conversation.context_property, created_at: now }]));
    }
    if (path === "/flatmates/profiles") return json(route, cursor([peer]));
    if (/^\/flatmates\/profiles\/[^/]+$/.test(path)) return json(route, peer);
    if (path === "/flatmates/blocks") return json(route, []);
    if (path === "/flatmates/web/dashboard") {
      return json(route, {
        total_listings: 1,
        active_listings: 1,
        pending_review: 0,
        paused: 0,
        total_views_30d: 120,
        total_likes_30d: 12,
        total_conversations_30d: 4,
        total_visits_30d: 1,
        listings: [{ id: property.id, title: property.title, status: "active", views: 120, likes: 12, conversations: 4, days_until_expiry: 24, boost_active: false }],
      });
    }
    if (/^\/flatmates\/web\/compatibility\/[^/]+$/.test(path)) {
      return json(route, {
        user_id: 1,
        peer_id: peer.id,
        overall_percentage: 86,
        color: "green",
        dimensions: [
          { name: "sleep_schedule", weight: 1, user_value: "early_bird", peer_value: "early_bird", score: 100, match: true },
          { name: "cleanliness", weight: 1, user_value: "tidy", peer_value: "tidy", score: 100, match: true },
        ],
        summary: ["Strong lifestyle overlap", "Similar work schedule"],
      });
    }
    if (/^\/flatmates\/web\/listings\/[^/]+\/analytics$/.test(path)) {
      return json(route, {
        listing_id: property.id,
        period: "30d",
        total_views: 120,
        unique_views: 90,
        likes: 12,
        shares: 3,
        conversations_started: 4,
        visits_scheduled: 1,
        daily_stats: [],
        boost_active: false,
      });
    }
    if (path === "/flatmates/web/saved-searches") return json(route, []);
    if (path === "/flatmates/web/alerts") return json(route, []);
    if (path === "/properties" || path === "/properties/me") return json(route, cursor([property], 20));
    if (/^\/properties\/[^/]+$/.test(path)) return json(route, property);
    if (path === "/visits") return json(route, cursor([visit]));
    if (/^\/visits\/[^/]+$/.test(path)) return json(route, visit);
    if (path === "/flatmates/moderation/stats") {
      return json(route, {
        total_users: 12,
        total_listings: 4,
        pending_moderation: 1,
        total_matches: 8,
        total_visits: 3,
        active_conversations: 5,
      });
    }
    if (path === "/flatmates/moderation/listings") {
      return json(route, cursor([{ ...property, owner_name: peer.full_name, owner_phone: "+919888888888", moderation_status: "pending_review", ai_prescreen_flags: [] }]));
    }
    if (path === "/flatmates/moderation/reports") {
      return json(route, cursor([{ id: 701, reporter_user_id: 1, reporter_name: profile.full_name, reported_user_id: peer.id, reported_name: peer.full_name, reason: "spam", status: "open", notes: "Test report", created_at: now }]));
    }

    return json(route, { message: "ok" });
  });
}
