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
  smoking: "never",
  drinking: "never",
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
  age_bucket: "25-30",
  profession: "Product Manager",
  budget_min: 18000,
  budget_max: 35000,
  move_in_timeline: "this_month",
  sleep_schedule: "early_bird",
  cleanliness: "tidy",
  food_habits: "vegetarian",
  smoking: "never",
  drinking: "never",
  guests_policy: "occasional_ok",
  work_style: "hybrid",
  gender_preference: "any",
  match_percentage: 86,
  // Listing context is one nested object. A peer carries no phone number.
  listing: {
    property_id: 101,
    title: "Sunny room in Koramangala",
    main_image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
    image_urls: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"],
    monthly_rent: 22000,
    features: [],
    amenities: [],
  },
};

const property = {
  id: 101,
  owner_id: 2,
  property_type: "flatmate",
  purpose: "rent",
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
  images: [
    {
      id: 1,
      property_id: 101,
      image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
      display_order: 0,
      is_main_image: true,
    },
  ],
  available_from: "2026-07-15",
  // Flatmate facts live in listing_preferences, not at the top level.
  listing_preferences: {
    moderation_status: "live",
    gender_preference: "any",
    sharing_type: "private_room",
    society_type: "gated",
    society_amenities: ["gym", "security"],
    society_vibe_tags: ["quiet", "professional"],
  },
  interest_count: 4,
  view_count: 120,
  like_count: 12,
  is_available: true,
  status: "available",
  owner_name: "Aarav Mehta",
  // For a non-owner this is the agent or company number, never the owner's.
  owner_contact: "+911800000000",
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
  source: "profile_match",
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
  property: property,
  counterparty_user_id: peer.id,
  // A visit counterparty is a PublicUserRef: name and avatar only.
  counterparty_user: { id: peer.id, display_name: peer.full_name, avatar_url: null },
  conversation_id: conversation.id,
  visit_context: "property_tour",
  // Relative to today so the visit stays "upcoming" whenever the suite runs.
  scheduled_date: new Date(Date.now() + 3 * 86_400_000).toISOString(),
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
      if (path === "/flatmates/swipes") return json(route, { did_match: true, match_id: 501, conversation_id: conversation.id }, 201);
      if (path.includes("/messages")) return json(route, { ...(posted ?? {}), id: 999, conversation_id: conversation.id, sender_id: 1, message_type: "text", created_at: now }, 201);
      if (path.endsWith("/mark-read") || (method === "DELETE" && !path.includes("/visits"))) return route.fulfill({ status: 204 });
      if (path.includes("/visits")) return json(route, visit, path.endsWith("/visits") ? 201 : 200);
      if (path.includes("/properties")) return json(route, property, method === "POST" ? 201 : 200);
      return json(route, {});
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
    if (path === "/flatmates/catalogs") return json(route, cursor(catalogs, 100));
    if (path === "/flatmates/notifications") return json(route, cursor([]));
    if (path === "/flatmates/notifications/unread-count") return json(route, { unread_count: 0 });
    if (path === "/users/notification-settings") {
      return json(route, { push_notifications: true, email_notifications: true, sms_notifications: false, promotional_emails: false });
    }
    if (path === "/flatmates/conversations") return json(route, cursor([conversation]));
    if (/^\/flatmates\/conversations\/[^/]+\/messages$/.test(path)) {
      return json(route, cursor([
        {
          id: 401,
          conversation_id: conversation.id,
          sender_id: peer.id,
          body: "Can I visit this weekend?",
          message_type: "text",
          created_at: now,
        },
      ]));
    }
    if (/^\/flatmates\/conversations\/[^/]+$/.test(path)) return json(route, conversation);
    if (path === "/flatmates/matches") {
      return json(route, cursor([{ id: 501, status: "active", peer, context_property: conversation.context_property, created_at: now }]));
    }
    if (path === "/flatmates/likes") {
      return json(route, cursor([{ id: 601, peer, context_property: conversation.context_property, created_at: now }]));
    }
    if (path === "/flatmates/profiles") return json(route, cursor([peer]));
    if (/^\/flatmates\/profiles\/[^/]+$/.test(path)) return json(route, peer);
    if (path === "/flatmates/blocks") return json(route, cursor([]));
    if (/^\/flatmates\/profiles\/[^/]+\/compatibility$/.test(path)) {
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
    if (path === "/properties" || path === "/properties/me") return json(route, cursor([property], 20));
    if (/^\/properties\/[^/]+$/.test(path)) return json(route, property);
    if (path === "/visits") return json(route, cursor([visit]));
    if (/^\/visits\/[^/]+$/.test(path)) return json(route, visit);
    if (path === "/flatmates/moderation/listings") {
      return json(route, cursor([{
        id: property.id,
        title: property.title,
        description: property.description,
        property_type: property.property_type,
        purpose: "rent",
        moderation_status: "pending_review",
        status: "pending_review",
        monthly_rent: property.monthly_rent,
        features: property.features,
        images: [{ id: 1, image_url: property.main_image_url }],
        image_urls: [property.main_image_url],
        city: property.city,
        locality: property.locality,
        owner_id: peer.id,
        owner: { id: peer.id, full_name: peer.full_name, phone: "+919888888888" },
        tags: [],
        ai_prescreen_flags: [],
        listing_preferences: {},
        created_at: now,
      }]));
    }
    if (path === "/flatmates/moderation/reports") {
      return json(route, cursor([{
        id: 701,
        reporter_user_id: 1,
        reported_user_id: peer.id,
        reason: "spam",
        status: "open",
        notes: "Test report",
        created_at: now,
        reporter: { id: 1, full_name: profile.full_name },
        reported_user: { id: peer.id, full_name: peer.full_name },
      }]));
    }

    return json(route, {});
  });
}
