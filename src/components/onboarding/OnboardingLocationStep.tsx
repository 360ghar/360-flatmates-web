import { useCallback } from "react";
import { Crosshair, Loader2 } from "lucide-react";
import { useReverseGeocode } from "@/hooks/queries";
import { uiStore } from "@/lib/stores/ui-store";
import { Input } from "@/components/ui/Input";
import type { OnboardingDraft } from "@/lib/schemas/onboarding";

export function OnboardingLocationStep({
  location,
  patchDraft
}: {
  location: OnboardingDraft["location"];
  patchDraft: (patch: Partial<OnboardingDraft>) => void;
}) {
  const { geocode, geoLoading } = useReverseGeocode();

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      uiStore.getState().pushToast({
        type: "error",
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const result = await geocode(latitude, longitude);

          if (result.city) {
            patchDraft({
              location: {
                ...location,
                city: result.city,
                locality: result.locality || location?.locality,
                lat: latitude,
                lng: longitude,
              },
            });
          } else {
            uiStore.getState().pushToast({
              type: "error",
              title: "Could not determine city",
              description: "We couldn't find a city name for your location.",
            });
          }
        } catch {
          uiStore.getState().pushToast({
            type: "error",
            title: "Reverse geocoding failed",
            description: "Could not resolve your location to a city.",
          });
        }
      },
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. Please enable it in your browser settings."
            : "Could not get your location. Please try again.";
        uiStore.getState().pushToast({
          type: "error",
          title: "Location unavailable",
          description: message,
        });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [location, patchDraft, geocode]);

  return (
    <>
      <h2 className="text-h2">Where are you looking?</h2>
      <div className="flex flex-col gap-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="City"
              placeholder="City (e.g. Gurugram)"
              value={location?.city ?? ""}
              onChange={(e) =>
                patchDraft({ location: { ...location, city: e.target.value } })
              }
            />
          </div>
          <button
            type="button"
            className="flex h-12 items-center gap-1.5 rounded-[8px] border border-line bg-surface px-3 text-label-md text-accent transition-colors hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleUseMyLocation}
            disabled={geoLoading}
            aria-label="Use my current location"
          >
            {geoLoading ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Crosshair aria-hidden="true" className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {geoLoading ? "Detecting..." : "Locate"}
            </span>
          </button>
        </div>
        <Input
          label="Locality"
          placeholder="Locality (e.g. DLF Phase 1)"
          value={location?.locality ?? ""}
          onChange={(e) =>
            patchDraft({ location: { ...location, locality: e.target.value } })
          }
        />
      </div>
    </>
  );
}
