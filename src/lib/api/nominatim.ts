export interface ReverseGeocodeResult {
  city: string;
  locality: string;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
    { headers: { "User-Agent": "360FlatmatesWeb/1.0" } }
  );
  if (!res.ok) throw new Error("Reverse geocoding request failed");
  const data = await res.json();
  const city =
    data.address?.city ||
    data.address?.town ||
    data.address?.city_district ||
    data.address?.state_district ||
    "";
  const locality =
    data.address?.suburb ||
    data.address?.neighbourhood ||
    data.address?.quarter ||
    "";
  return { city, locality };
}
