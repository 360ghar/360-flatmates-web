/**
 * Local-only persistence for saved searches and search alerts.
 *
 * The backend does not currently expose the `/flatmates/web/saved-searches` or
 * `/flatmates/web/alerts` endpoints (verified against the deployed server),
 * so these features are stored in the browser's `localStorage` instead. This
 * keeps the Saved Searches and Alerts pages fully functional without 404
 * network errors, and gives the user a single-device experience until the
 * backend lands the endpoints. Once they do, the storage module is the only
 * place that needs to change; the hooks and pages above are agnostic to the
 * transport.
 *
 * Keys are versioned (`.v1`) so we can ship a breaking shape change without
 * crashing returning users.
 */

const SAVED_SEARCHES_KEY = "360ghar:saved-searches:v1";
const SEARCH_ALERTS_KEY = "360ghar:search-alerts:v1";

// Re-export the keys for tests and other consumers that need to clear or
// inspect the storage directly without depending on the rest of the module.
export { SAVED_SEARCHES_KEY, SEARCH_ALERTS_KEY };

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readJson<T>(key: string): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as T[];
  } catch {
    return [];
  }
}

function writeJson<T>(key: string, value: T[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or private mode - best-effort.
  }
}

/* -------------------------------------------------------------------------- */
/*  Saved searches                                                            */
/* -------------------------------------------------------------------------- */

export interface LocalSavedSearch {
  id: number;
  user_id: number;
  name: string;
  filters: Record<string, unknown>;
  alert_enabled: boolean;
  alert_frequency?: string;
  alert_channels?: string[];
  last_run_at?: string;
  new_results_count?: number;
  created_at?: string;
  updated_at?: string;
}

let savedSearchSeq = 0;

function nextSavedSearchId(): number {
  // Use a high-resolution counter so we don't collide with existing ids across
  // mounts within the same session. Time-based prefix keeps ids unique even
  // after the user reloads the page.
  savedSearchSeq += 1;
  return Date.now() * 1000 + savedSearchSeq;
}

export function loadSavedSearches(): LocalSavedSearch[] {
  return readJson<LocalSavedSearch>(SAVED_SEARCHES_KEY);
}

export function saveSavedSearches(items: LocalSavedSearch[]): void {
  writeJson(SAVED_SEARCHES_KEY, items);
}

export function createSavedSearch(input: {
  name: string;
  filters: Record<string, unknown>;
  alert_enabled?: boolean;
  alert_frequency?: string;
  alert_channels?: string[];
}): LocalSavedSearch {
  const now = new Date().toISOString();
  const next: LocalSavedSearch = {
    id: nextSavedSearchId(),
    user_id: 0,
    name: input.name,
    filters: input.filters,
    alert_enabled: input.alert_enabled ?? false,
    alert_frequency: input.alert_frequency,
    alert_channels: input.alert_channels,
    created_at: now,
    updated_at: now
  };
  const items = loadSavedSearches();
  saveSavedSearches([next, ...items]);
  return next;
}

export function deleteSavedSearchById(id: number): void {
  const items = loadSavedSearches();
  saveSavedSearches(items.filter((item) => item.id !== id));
}

export function updateSavedSearch(
  id: number,
  patch: Partial<Omit<LocalSavedSearch, "id" | "user_id" | "created_at">>
): LocalSavedSearch | undefined {
  const items = loadSavedSearches();
  const idx = items.findIndex((item) => item.id === id);
  if (idx === -1) return undefined;
  const next: LocalSavedSearch = {
    ...items[idx],
    ...patch,
    id: items[idx].id,
    user_id: items[idx].user_id,
    created_at: items[idx].created_at,
    updated_at: new Date().toISOString()
  };
  const updated = items.slice();
  updated[idx] = next;
  saveSavedSearches(updated);
  return next;
}

/* -------------------------------------------------------------------------- */
/*  Search alerts                                                             */
/* -------------------------------------------------------------------------- */

export interface LocalSearchAlert {
  id: number;
  user_id: number;
  name: string;
  filters: Record<string, unknown>;
  frequency: string;
  channels: string[];
  enabled: boolean;
  last_sent_at?: string;
  results_sent_count?: number;
  created_at?: string;
}

let alertSeq = 0;

function nextAlertId(): number {
  alertSeq += 1;
  return Date.now() * 1000 + alertSeq;
}

export function loadSearchAlerts(): LocalSearchAlert[] {
  return readJson<LocalSearchAlert>(SEARCH_ALERTS_KEY);
}

export function saveSearchAlerts(items: LocalSearchAlert[]): void {
  writeJson(SEARCH_ALERTS_KEY, items);
}

export function createSearchAlert(input: {
  name: string;
  filters: Record<string, unknown>;
  frequency?: string;
  channels?: string[];
}): LocalSearchAlert {
  const now = new Date().toISOString();
  const next: LocalSearchAlert = {
    id: nextAlertId(),
    user_id: 0,
    name: input.name,
    filters: input.filters,
    frequency: input.frequency ?? "daily",
    channels: input.channels ?? ["push"],
    enabled: true,
    created_at: now
  };
  const items = loadSearchAlerts();
  saveSearchAlerts([next, ...items]);
  return next;
}

export function updateSearchAlert(
  id: number,
  patch: Partial<Omit<LocalSearchAlert, "id" | "user_id" | "created_at">>
): LocalSearchAlert | undefined {
  const items = loadSearchAlerts();
  const idx = items.findIndex((item) => item.id === id);
  if (idx === -1) return undefined;
  const next: LocalSearchAlert = {
    ...items[idx],
    ...patch,
    id: items[idx].id,
    user_id: items[idx].user_id,
    created_at: items[idx].created_at
  };
  const updated = items.slice();
  updated[idx] = next;
  saveSearchAlerts(updated);
  return next;
}

export function deleteSearchAlertById(id: number): void {
  const items = loadSearchAlerts();
  saveSearchAlerts(items.filter((item) => item.id !== id));
}
