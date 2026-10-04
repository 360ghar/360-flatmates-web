import { useMutation } from "@tanstack/react-query";
import { reverseGeocode } from "@/features/onboarding/lib/nominatim";
import type { ReverseGeocodeResult } from "@/features/onboarding/lib/nominatim";

export type { ReverseGeocodeResult };

export function useReverseGeocode() {
  const mutation = useMutation<
    ReverseGeocodeResult,
    Error,
    { latitude: number; longitude: number }
  >({
    mutationFn: ({ latitude, longitude }) =>
      reverseGeocode(latitude, longitude),
  });

  const geocode = (latitude: number, longitude: number) =>
    mutation.mutateAsync({ latitude, longitude });

  return {
    geocode,
    geoLoading: mutation.isPending,
    geoError: mutation.error,
    geoData: mutation.data,
  };
}
