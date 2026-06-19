/**
 * Approximate geographic centers for the cities supported on the platform.
 *
 * Used by the Explore page to seed the map viewport from the user's profile
 * city instead of defaulting to New Delhi (which produced an empty pin layer
 * for users who actually live in Bengaluru, Gurugram, etc.). These are
 * coarse-grained by design - the map zooms in once the user pans, and a
 * pan/zoom overrides the default until they navigate away.
 *
 * Add new cities here as the platform expands; the lookup is case- and
 * whitespace-insensitive so the keys can match the backend's `city` field
 * without special casing.
 */
export interface CityCenter {
  /** Display name (matches the backend's `city` field) */
  readonly name: string;
  /** Lowercase lookup key */
  readonly key: string;
  readonly lat: number;
  readonly lng: number;
  /** Suggested default zoom level - closer cities zoom in more. */
  readonly defaultZoom: number;
}

export const CITY_CENTERS: readonly CityCenter[] = [
  { name: "Gurgaon", key: "gurgaon", lat: 28.4595, lng: 77.0266, defaultZoom: 12 },
  { name: "Gurugram", key: "gurugram", lat: 28.4595, lng: 77.0266, defaultZoom: 12 },
  { name: "Delhi", key: "delhi", lat: 28.6139, lng: 77.209, defaultZoom: 12 },
  { name: "New Delhi", key: "new delhi", lat: 28.6139, lng: 77.209, defaultZoom: 12 },
  { name: "Noida", key: "noida", lat: 28.5355, lng: 77.391, defaultZoom: 12 },
  { name: "Bengaluru", key: "bengaluru", lat: 12.9716, lng: 77.5946, defaultZoom: 12 },
  { name: "Bangalore", key: "bangalore", lat: 12.9716, lng: 77.5946, defaultZoom: 12 },
  { name: "Mumbai", key: "mumbai", lat: 19.076, lng: 72.8777, defaultZoom: 12 },
  { name: "Pune", key: "pune", lat: 18.5204, lng: 73.8567, defaultZoom: 12 },
  { name: "Hyderabad", key: "hyderabad", lat: 17.385, lng: 78.4867, defaultZoom: 12 },
  { name: "Chennai", key: "chennai", lat: 13.0827, lng: 80.2707, defaultZoom: 12 },
  { name: "Kolkata", key: "kolkata", lat: 22.5726, lng: 88.3639, defaultZoom: 12 },
  { name: "Ahmedabad", key: "ahmedabad", lat: 23.0225, lng: 72.5714, defaultZoom: 12 }
];

/**
 * Resolve a city name (as it appears on the backend) to its map center.
 * The lookup is whitespace-trimmed and case-insensitive, so `Gurgaon`,
 * `gurgaon`, and ` Gurgaon ` all resolve. Unknown cities fall back to
 * the Delhi default - the user can pan/zoom from there.
 */
export function getCityCenter(city: string | null | undefined): CityCenter {
  const fallback = CITY_CENTERS.find((c) => c.key === "delhi")!;
  if (!city) return fallback;
  const normalized = city.trim().toLowerCase();
  if (!normalized) return fallback;
  return CITY_CENTERS.find((c) => c.key === normalized) ?? fallback;
}
