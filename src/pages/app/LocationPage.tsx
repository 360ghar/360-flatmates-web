import { useState } from "react";
import { useNavigate } from "react-router";
import { MapPin, Crosshair, Loader2 } from "lucide-react";
import { useMyProfile, useUpdateProfile } from "@/hooks/queries";
import { useReverseGeocode } from "@/hooks/useReverseGeocode";
import { searchStore } from "@/lib/stores/search-store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";
import { uiStore } from "@/lib/stores/ui-store";
import { POPULAR_CITIES } from "@/lib/data";

export function LocationPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const [city, setCity] = useState(profile?.city ?? "");
  const [submitting, setSubmitting] = useState(false);
  const { geocode, geoLoading } = useReverseGeocode();

  async function handleUseMyLocation() {
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
            setCity(result.city);
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
  }

  async function handleContinue() {
    if (!city.trim()) return;
    setSubmitting(true);
    try {
      await updateProfile.mutateAsync({ city: city.trim() });
      searchStore.getState().setFilters({ city: city.trim() });
      navigate("/home");
    } catch {
      uiStore.getState().pushToast({
        type: "error",
        title: "Could not save location",
        description: "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 p-4 md:p-6 mx-auto max-w-lg">
        {/* Title + description */}
        <div className="flex flex-col gap-2">
          <div className="h-7 w-3/4 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
          <div className="h-4 w-full rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
        </div>
        {/* Input field with label */}
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-8 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
          <Skeleton variant="searchBar" />
        </div>
        {/* Popular cities chips */}
        <div className="flex flex-col gap-2">
          <div className="h-3 w-20 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
          <Skeleton variant="filterChips" count={6} />
        </div>
        {/* Two buttons */}
        <div className="h-[52px] w-full rounded-[10px] border border-line shimmer animate-shimmer motion-reduce:animate-none" />
        <div className="h-[52px] w-full rounded-[10px] shimmer animate-shimmer motion-reduce:animate-none" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 page-fade mx-auto max-w-lg">
      <div>
        <h1 className="text-h1">Where are you looking?</h1>
        <p className="mt-2 text-body-md text-ink-2">
          Select your city to see relevant listings and flatmates nearby.
        </p>
      </div>

      <Input
        label="City"
        placeholder="Type your city..."
        value={city}
        onChange={(e) => setCity(e.target.value)}
        leadingIcon={<MapPin aria-hidden="true" className="h-4 w-4 text-ink-3" />}
        autoFocus
      />

      <div>
        <p className="text-label-md text-ink-3 mb-2">Popular cities</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_CITIES.map((c) => (
            <Chip
              key={c}
              selected={city === c}
              onClick={() => setCity(c)}
            >
              {c}
            </Chip>
          ))}
        </div>
      </div>

      <Button
        variant="secondary"
        fullWidth
        onClick={handleUseMyLocation}
        disabled={geoLoading}
      >
        {geoLoading ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Crosshair aria-hidden="true" className="h-4 w-4" />
        )}
        {geoLoading ? "Detecting location..." : "Use My Location"}
      </Button>

      <Button
        fullWidth
        disabled={!city.trim()}
        loading={submitting}
        onClick={handleContinue}
      >
        Continue
      </Button>
    </div>
  );
}
