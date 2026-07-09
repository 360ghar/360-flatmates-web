/**
 * nuqs parser definitions for URL search params.
 *
 * These parsers define the shape of query-string state for /search and /discover.
 * They enable deep-linking (visiting /search?city=Delhi pre-fills filters) and
 * shareable URLs out of the box.
 *
 * Usage:
 *   import { searchPageParams, discoverPageParams } from "@/lib/schemas/search-params";
 *   const [params, setParams] = useQueryStates(searchPageParams);
 */
import {
  parseAsString,
  parseAsInteger,
  parseAsArrayOf,
  parseAsFloat,
  createParser,
} from "nuqs";

const parseAsLatitude = createParser({
  parse: (v) => {
    const n = v.trim() === "" ? NaN : Number(v);
    if (isNaN(n) || n < -90 || n > 90) return null;
    return Number(n.toFixed(4));
  },
  serialize: (v) => v.toString()
});

const parseAsLongitude = createParser({
  parse: (v) => {
    const n = v.trim() === "" ? NaN : Number(v);
    if (isNaN(n) || n < -180 || n > 180) return null;
    return Number(n.toFixed(4));
  },
  serialize: (v) => v.toString()
});

// ── Search page params ─────────────────────────────────────────
// URL: /search?q=Delhi&city=1&bedrooms=2&amenities=WiFi,Parking&priceMin=3000&priceMax=15000&cursor=<opaque>
//
// Note: the `page` URL param is intentionally NOT included. Backend list
// endpoints now accept an opaque `cursor` only; passing `page=` no longer
// matches the wire protocol. For backwards-compat, callers that still receive
// a deep link with `page=` should treat it as a hint to reset to the first
// page (handled in SearchPage / DiscoverPage useEffects).

export const searchPageParams = {
  q: parseAsString.withDefault(""),
  city: parseAsInteger.withDefault(0),
  bedrooms: parseAsString.withDefault(""),
  amenities: parseAsArrayOf(parseAsString, ",").withDefault([]),
  priceMin: parseAsInteger,
  priceMax: parseAsInteger,
  cursor: parseAsString.withDefault(""),
};

// ── Discover page params ───────────────────────────────────────
// URL: /discover?city=2&filter=Nearby&cursor=<opaque>

export const discoverPageParams = {
  city: parseAsInteger.withDefault(0),
  filter: parseAsString.withDefault("Nearby"),
  cursor: parseAsString.withDefault(""),
  latitude: parseAsLatitude,
  longitude: parseAsLongitude,
};
