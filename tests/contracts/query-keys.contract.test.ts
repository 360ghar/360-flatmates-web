/**
 * Integration test: TanStack Query key contract
 *
 * Verifies that every query hook uses a consistent query-key structure
 * and that mutations invalidate the correct keys.
 */
import { describe, it, expect } from "vitest";

// ── Hook imports ──────────────────────────────────────────────────────────
import * as useProfiles from "@/hooks/queries/useProfiles";
import * as useProperties from "@/hooks/queries/useProperties";
import * as useSearch from "@/hooks/queries/useSearch";
import * as useSwipes from "@/hooks/queries/useSwipes";
import * as useConversations from "@/hooks/queries/useConversations";
import * as useVisits from "@/hooks/queries/useVisits";
import * as useNotifications from "@/hooks/queries/useNotifications";
import * as useDashboard from "@/hooks/queries/useDashboard";
import * as useMatches from "@/hooks/queries/useMatches";
import * as useMapView from "@/hooks/queries/useMapView";
import * as useShareCard from "@/hooks/queries/useShareCard";

// ── Type helpers ──────────────────────────────────────────────────────────

/**
 * Represents a single query-key observation extracted from a hook.
 * `queryKey`  – the full key array used in useQuery or the key invalidated
 *               after a successful mutation.
 * `source`    – human-readable label for error messages.
 * `category`  – "query" or "invalidation".
 */
interface KeyObservation {
  queryKey: unknown[];
  source: string;
  category: "query" | "invalidation";
}

/**
 * Walk a module's source code at runtime via `toString()` on every exported
 * function to find `queryKey:` and `invalidateQueries` patterns.
 *
 * We parse the literal arrays directly from the function body so we do not
 * need to actually invoke the hooks (which require a React tree).
 *
 * Strategy: first find all `invalidateQueries({ queryKey: [...] })` spans so
 * we can exclude those from the generic `queryKey:` pass. This prevents
 * invalidation keys from being mis-categorised as query definitions.
 */
function extractKeysFromModule(
  mod: Record<string, unknown>,
  moduleName: string
): KeyObservation[] {
  const observations: KeyObservation[] = [];

  for (const [exportName, value] of Object.entries(mod)) {
    // Handle queryOptions objects (non-function exports with queryKey)
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      "queryKey" in (value as object)
    ) {
      const key = (value as { queryKey: unknown }).queryKey;
      if (Array.isArray(key)) {
        observations.push({
          queryKey: key,
          source: `${moduleName}.${exportName}`,
          category: "query",
        });
      }
      continue;
    }

    if (typeof value !== "function") continue;
    const fn = value as (...args: unknown[]) => unknown;
    const body = fn.toString();

    // 1. Collect character ranges of all invalidateQueries calls so we can
    //    skip them in the generic pass.
    const invalidationSpans: [number, number][] = [];
    const invalidateRegex = /invalidateQueries\(\{[^}]*queryKey:\s*(\[[^\]]*\])/g;
    let match: RegExpExecArray | null;
    while ((match = invalidateRegex.exec(body)) !== null) {
      invalidationSpans.push([match.index, match.index + match[0].length]);
      try {
        const key = parseKeyLiteral(match[1]);
        observations.push({
          queryKey: key,
          source: `${moduleName}.${exportName}`,
          category: "invalidation",
        });
      } catch {
        const scope = extractScope(match[1]);
        if (scope) {
          observations.push({
            queryKey: [scope],
            source: `${moduleName}.${exportName}`,
            category: "invalidation",
          });
        }
      }
    }

    // 2. Generic queryKey: [...] pass — skip keys inside invalidateQueries
    const queryKeyRegex = /queryKey:\s*(\[[^\]]*\])/g;
    while ((match = queryKeyRegex.exec(body)) !== null) {
      const matchStart = match.index;
      const isInsideInvalidation = invalidationSpans.some(
        ([start, end]) => matchStart >= start && matchStart < end
      );
      if (isInsideInvalidation) continue;

      try {
        const key = parseKeyLiteral(match[1]);
        observations.push({
          queryKey: key,
          source: `${moduleName}.${exportName}`,
          category: "query",
        });
      } catch {
        // Key contains dynamic expressions we cannot statically evaluate;
        // fall back to extracting the leading string scope.
        const scope = extractScope(match[1]);
        if (scope) {
          observations.push({
            queryKey: [scope],
            source: `${moduleName}.${exportName}`,
            category: "query",
          });
        }
      }
    }
  }

  return observations;
}

/**
 * Attempt to parse a JS array literal that only contains primitive values.
 * Throws if the literal contains identifiers or other non-literal tokens.
 */
function parseKeyLiteral(literal: string): unknown[] {
  // Use Function constructor instead of eval for slightly safer parsing.
  // We only call this on strings we extracted from our own source code.
  try {
    const result = new Function(`return ${literal}`)();
    if (Array.isArray(result)) return result;
  } catch {
    // fall through
  }
  throw new Error(`Cannot parse key literal: ${literal}`);
}

/**
 * Extract the leading string scope from a key literal that may contain
 * dynamic expressions. e.g. `["profiles", id]` => "profiles"
 */
function extractScope(literal: string): string | null {
  const match = literal.match(/^\[\s*"([^"]+)"/);
  return match ? match[1] : null;
}

// ── Collect observations ─────────────────────────────────────────────────

const modules = [
  { mod: useProfiles, name: "useProfiles" },
  { mod: useProperties, name: "useProperties" },
  { mod: useSearch, name: "useSearch" },
  { mod: useSwipes, name: "useSwipes" },
  { mod: useConversations, name: "useConversations" },
  { mod: useVisits, name: "useVisits" },
  { mod: useNotifications, name: "useNotifications" },
  { mod: useDashboard, name: "useDashboard" },
  { mod: useMatches, name: "useMatches" },
  { mod: useMapView, name: "useMapView" },
  { mod: useShareCard, name: "useShareCard" },
];

const allObservations = modules.flatMap(({ mod, name }) =>
  extractKeysFromModule(mod as unknown as Record<string, (...args: unknown[]) => unknown>, name)
);

const queryObservations = allObservations.filter((o) => o.category === "query");
const invalidationObservations = allObservations.filter(
  (o) => o.category === "invalidation"
);

// ── Expected scope mappings ──────────────────────────────────────────────

const expectedScopes: Record<string, string[]> = {
  useProfiles: ["profile", "profiles"],
  useProperties: ["properties"],
  useSearch: ["search"],
  useSwipes: ["swipes"],
  useConversations: ["conversations"],
  useVisits: ["visits"],
  useNotifications: ["notifications"],
  useDashboard: ["dashboard"],
  useMatches: ["matches", "incoming-likes", "outgoing-likes"],
  useMapView: ["map"],
  useShareCard: ["share-card"],
};

// ── Tests ─────────────────────────────────────────────────────────────────

describe("TanStack Query key contracts", () => {
  it("every query hook uses an array key starting with a string scope", () => {
    expect(queryObservations.length).toBeGreaterThan(0);

    for (const obs of queryObservations) {
      expect(
        Array.isArray(obs.queryKey),
        `${obs.source} queryKey is not an array`
      ).toBe(true);
      expect(
        obs.queryKey.length,
        `${obs.source} queryKey is empty`
      ).toBeGreaterThan(0);
      expect(
        typeof obs.queryKey[0],
        `${obs.source} queryKey[0] is not a string, got: ${JSON.stringify(obs.queryKey[0])}`
      ).toBe("string");
    }
  });

  it("each module uses its expected scope prefix(es)", () => {
    for (const { mod, name } of modules) {
      const observations = extractKeysFromModule(
        mod as Record<string, unknown>,
        name
      );
      const queriesInModule = observations.filter((o) => o.category === "query");
      const scopes = queriesInModule.map((o) => o.queryKey[0] as string);
      const uniqueScopes = [...new Set(scopes)];

      const expected = expectedScopes[name];
      expect(
        uniqueScopes.every((s) => expected.includes(s)),
        `${name} uses scopes ${uniqueScopes} but expected one of ${expected}`
      ).toBe(true);
    }
  });

  it("no two different query types share the same full key pattern", () => {
    // Two different query hooks should not use the exact same static key
    // pattern. Keys that differ only in dynamic params (e.g. id) are fine.
    const seen = new Map<string, string>(); // keyPattern -> source

    for (const obs of queryObservations) {
      // Normalise: replace any non-string element with "<dynamic>"
      const pattern = obs.queryKey
        .map((el) => (typeof el === "string" ? el : "<dynamic>"))
        .join("/");

      const existing = seen.get(pattern);
      if (existing) {
        // Same module re-using a key is fine (e.g. multiple hooks sharing
        // the same list key), but different modules should not collide.
        const existingModule = existing.split(".")[0];
        const currentModule = obs.source.split(".")[0];
        if (existingModule !== currentModule) {
          // It's acceptable for cross-module invalidation to target the
          // same key, but query definitions should be unique per module.
          // We only flag if both are "query" category — already filtered.
        }
      }
      seen.set(pattern, obs.source);
    }

    // No assertion failure needed — this just ensures we don't have
    // two completely identical static keys from different modules.
    const queryPatterns = queryObservations.map((obs) =>
      obs.queryKey.map((el) => (typeof el === "string" ? el : "<dynamic>")).join("/")
    );
    const duplicates = queryPatterns.filter(
      (p, i) => queryPatterns.indexOf(p) !== i
    );
    // Allow duplicates within the same module — only flag cross-module
    const crossModuleDuplicates: string[] = [];
    for (const dup of new Set(duplicates)) {
      const sources = queryObservations
        .filter(
          (obs) =>
            obs.queryKey.map((el) => (typeof el === "string" ? el : "<dynamic>")).join("/") === dup
        )
        .map((obs) => obs.source.split(".")[0]);
      if (new Set(sources).size > 1) {
        crossModuleDuplicates.push(dup);
      }
    }
    expect(
      crossModuleDuplicates,
      `Cross-module duplicate query keys found: ${crossModuleDuplicates.join(", ")}`
    ).toHaveLength(0);
  });

  it("mutation hooks invalidate query keys within their own scope", () => {
    // Each invalidation key's leading scope should match the module's
    // expected scopes, or be an explicitly allowed cross-module target.
    const crossModuleAllowed: Record<string, string[]> = {
      // useUnmatchMutation also invalidates conversations — that is correct
      useMatches: ["matches", "conversations"],
      // useBoostListing also invalidates dashboard — that is correct
      useProperties: ["properties", "dashboard"],
      // useSendMessage also invalidates conversations list — same scope
      useConversations: ["conversations"],
      // Accepting a like through the swipe endpoint can create a match/chat.
      useSwipes: ["swipes", "incoming-likes", "matches", "conversations"],
    };

    for (const { mod, name } of modules) {
      const observations = extractKeysFromModule(
        mod as Record<string, unknown>,
        name
      );
      const invalidations = observations.filter(
        (o) => o.category === "invalidation"
      );

      const allowedScopes = crossModuleAllowed[name] ?? expectedScopes[name];

      for (const inv of invalidations) {
        const scope = inv.queryKey[0] as string;
        expect(
          allowedScopes.includes(scope),
          `${inv.source} invalidates "${scope}" but allowed scopes for ${name} are ${allowedScopes}`
        ).toBe(true);
      }
    }
  });

  it("invalidation keys are a prefix of or match an existing query key", () => {
    // Every key targeted by invalidation should have a corresponding
    // query key that starts with the same prefix.
    const queryKeyPrefixes = queryObservations.map((o) => String(o.queryKey[0]));
    const uniqueQueryPrefixes = [...new Set(queryKeyPrefixes)];

    for (const inv of invalidationObservations) {
      const scope = String(inv.queryKey[0]);
      expect(
        uniqueQueryPrefixes.includes(scope),
        `${inv.source} invalidates scope "${scope}" but no query hook uses that scope`
      ).toBe(true);
    }
  });
});
