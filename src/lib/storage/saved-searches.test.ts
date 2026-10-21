import { beforeEach, describe, expect, it } from "vitest";
import {
  LEGACY_SAVED_SEARCHES_KEY,
  SAVED_SEARCHES_KEY,
  createSavedSearch,
  createSearchAlert,
  loadSavedSearches,
  loadSearchAlerts,
  updateSavedSearch,
  updateSearchAlert
} from "./saved-searches";

describe("saved searches storage", () => {
  beforeEach(() => window.localStorage.clear());

  it("upgrades v1 entries to single-value filters and removes the v1 key", () => {
    window.localStorage.setItem(
      LEGACY_SAVED_SEARCHES_KEY,
      JSON.stringify([
        {
          id: 1,
          user_id: 0,
          name: "Koramangala rooms",
          alert_enabled: false,
          filters: {
            city: "Bengaluru",
            sharing_type: ["private_room", "shared_room"],
            move_in: ["immediately"],
            search_type: "listings",
            sort_by: "match_percentage"
          }
        }
      ])
    );

    const [saved] = loadSavedSearches();

    expect(saved.filters).toEqual({ city: "Bengaluru", sharing_type: "private_room", move_in: "immediate" });
    expect(window.localStorage.getItem(LEGACY_SAVED_SEARCHES_KEY)).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(SAVED_SEARCHES_KEY) ?? "[]")).toHaveLength(1);
  });

  it("reads v2 entries as stored", () => {
    window.localStorage.setItem(
      SAVED_SEARCHES_KEY,
      JSON.stringify([{ id: 2, user_id: 0, name: "n", alert_enabled: false, filters: { city: "Pune" } }])
    );
    expect(loadSavedSearches()[0].filters).toEqual({ city: "Pune" });
  });

  it("keeps the stored fields a partial update leaves unset", () => {
    const saved = createSavedSearch({ name: "Pune rooms", filters: { city: "Pune" }, alert_enabled: true });
    updateSavedSearch(saved.id, { name: "Pune flats", filters: undefined, alert_enabled: undefined });
    expect(loadSavedSearches()[0]).toMatchObject({ name: "Pune flats", filters: { city: "Pune" }, alert_enabled: true });

    const alert = createSearchAlert({ name: "Daily", filters: { city: "Pune" }, frequency: "weekly", channels: ["email"] });
    updateSearchAlert(alert.id, { name: undefined, filters: undefined, frequency: undefined, channels: undefined, enabled: false });
    expect(loadSearchAlerts()[0]).toMatchObject({
      name: "Daily",
      filters: { city: "Pune" },
      frequency: "weekly",
      channels: ["email"],
      enabled: false
    });
  });
});
