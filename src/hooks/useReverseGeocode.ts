import { useState, useCallback } from "react";

interface ReverseGeocodeResult {
  city: string;
  locality: string;
}

async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
    { headers: { "User-Agent": "360FlatmatesWeb/1.0" } }
  );
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

export function useReverseGeocode() {
  const [loading, setLoading] = useState(false);

  const geocode = useCallback(
    (latitude: number, longitude: number): Promise<ReverseGeocodeResult> => {
      setLoading(true);
      return reverseGeocode(latitude, longitude).finally(() => setLoading(false));
    },
    []
  );

  return { geocode, geoLoading: loading };
}
