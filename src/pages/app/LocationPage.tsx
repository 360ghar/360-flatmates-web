import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { MapPin, Crosshair, Loader2 } from "lucide-react";
import {
  useMyProfile,
  useUpdateProfile,
  useReverseGeocode,
  useCities
} from "@/hooks/queries";
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
  const { data: catalogCities } = useCities();
  const [city, setCity] = useState(profile?.city ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [typeaheadOpen, setTypeaheadOpen] = useState(false);
  const { geocode, geoLoading } = useReverseGeocode();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Seed the field from the saved profile once it loads. The useState
  // initializer ran before `profile` resolved, so it would otherwise stay
  // empty for a returning user. Don't overwrite an in-progress edit.
  const syncedFromProfile = useRef(false);
  useEffect(() => {
    if (profile?.city && !syncedFromProfile.current) {
      syncedFromProfile.current = true;
      setCity((prev) => (prev.trim() ? prev : profile.city ?? ""));
    }
  }, [profile?.city]);

  // Focus the heading only on first render so subsequent re-renders (e.g.
  // isLoading flips, typeahead opens) don't steal focus from the input.
  const hasFocusedHeading = useRef(false);
  useEffect(() => {
    if (isLoading || hasFocusedHeading.current) return;
    hasFocusedHeading.current = true;
    headingRef.current?.focus();
  }, [isLoading]);

  // Dismiss the typeahead when clicking outside the input.
  useEffect(() => {
    if (!typeaheadOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!inputWrapperRef.current?.contains(e.target as Node)) {
        setTypeaheadOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [typeaheadOpen]);

  const suggestions = useMemo(() => {
    const query = city.trim().toLowerCase();
    const source: string[] = catalogCities && catalogCities.length > 0
      ? catalogCities.reduce<string[]>((acc, c) => {
          if (c.is_active) acc.push(c.name);
          return acc;
        }, [])
      : [...POPULAR_CITIES];
    if (!query) return source.slice(0, 5);
    return source
      .filter((name) => name.toLowerCase().includes(query))
      .slice(0, 5);
  }, [city, catalogCities]);

  function handleUseMyLocation() {
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

  async function handleContinue(e?: React.FormEvent) {
    e?.preventDefault();
    if (!city.trim() || submitting) return;
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
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-8" />
          <Skeleton variant="searchBar" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton variant="filterChips" count={6} />
        </div>
        <Skeleton className="h-[52px] w-full rounded-[8px]" />
        <Skeleton className="h-[52px] w-full rounded-[8px]" />
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5 page-fade mx-auto max-w-lg" onSubmit={handleContinue}>
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-h1 outline-none">
          Where are you looking?
        </h1>
        <p className="mt-2 text-body-md text-ink-2">
          Select your city to see relevant listings and flatmates nearby.
        </p>
      </div>

      <div ref={inputWrapperRef} className="relative">
        <Input
          label="City"
          placeholder="Type your city..."
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setTypeaheadOpen(true);
          }}
          onFocus={() => setTypeaheadOpen(true)}
          leadingIcon={<MapPin aria-hidden="true" className="h-4 w-4 text-ink-3" />}
          role="combobox"
          aria-expanded={typeaheadOpen && suggestions.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          autoFocus
        />
        {typeaheadOpen && suggestions.length > 0 && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-[var(--z-overlay)] mt-1 flex flex-col overflow-hidden rounded-[8px] border border-line bg-surface shadow-md"
          >
            {suggestions.map((name) => (
              <li
                key={name}
                role="option"
                aria-selected={city === name}
              >
                <button
                  type="button"
                  onClick={() => {
                    setCity(name);
                    setTypeaheadOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-md text-ink hover:bg-accent-soft"
                >
                  <MapPin aria-hidden="true" className="h-4 w-4 text-ink-3" />
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

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
        type="submit"
        fullWidth
        disabled={!city.trim()}
        loading={submitting}
      >
        Continue
      </Button>
    </form>
  );
}
