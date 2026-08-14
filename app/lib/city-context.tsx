"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { reverseGeocodeCity } from "./geocoding";

export interface CityOption {
  name: string;
  slug: string;
}

// Hardcoded to the 3 cities Hubigo actually operates in (see CompareNearbyPanel.tsx,
// nearby/page.tsx — same "Bangalore, Chennai, Hyderabad" constraint stated there).
export const SUPPORTED_CITIES: CityOption[] = [
  { name: "Bangalore", slug: "bangalore" },
  { name: "Chennai", slug: "chennai" },
  { name: "Hyderabad", slug: "hyderabad" },
];

const DEFAULT_CITY = SUPPORTED_CITIES[0];

const STORAGE_KEY = "hubigo_selected_city";

export type CityLocationStatus = "idle" | "detecting" | "granted" | "denied" | "unsupported";

interface CityContextValue {
  cities: CityOption[];
  selectedCity: CityOption;
  setSelectedCity: (city: CityOption) => void;
  /** Current state of the homepage's auto-detection — drives the city pill's "Turn on location"
   * prompt vs. a plain detected-city label. */
  locationStatus: CityLocationStatus;
  /** Explicitly triggers the browser's geolocation permission prompt + a fresh detection. Used by
   * the city pill to retry detection on demand. */
  requestLocation: () => void;
  /** Lets the user type any city name directly (not limited to cities in our DB) — display-only,
   * doesn't affect search/results. */
  setManualCityName: (name: string) => void;
}

const CityContext = createContext<CityContextValue | null>(null);

/** True if `text` mentions one of our supported cities by name, and it's a DIFFERENT city than
 * `current` — used to detect "Bangalore selected but query says 'schools in chennai'" conflicts. */
export function findConflictingCityInQuery(text: string, current: CityOption): CityOption | null {
  const lower = text.toLowerCase();
  const match = SUPPORTED_CITIES.find((c) => c.slug !== current.slug && lower.includes(c.name.toLowerCase()));
  return match ?? null;
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CityProvider({ children }: { children: ReactNode }) {
  const [selectedCity, setSelectedCityState] = useState<CityOption>(DEFAULT_CITY);
  const [locationStatus, setLocationStatus] = useState<CityLocationStatus>("idle");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const match = stored ? SUPPORTED_CITIES.find((c) => c.slug === stored) : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a synchronous localStorage snapshot on mount is intentional
    if (match) setSelectedCityState(match);
  }, []);

  const setSelectedCity = useCallback((city: CityOption) => {
    setSelectedCityState(city);
    localStorage.setItem(STORAGE_KEY, city.slug);
  }, []);

  const setManualCityName = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setSelectedCity({ name: trimmed, slug: slugify(trimmed) });
    },
    [setSelectedCity]
  );

  /** Reverse-geocodes lat/lng to the real city name via OpenStreetMap — any city in the world,
   * not just the 3 Hubigo currently operates in, since this pill is display-only. */
  const applyRealCity = useCallback(
    async (lat: number, lng: number) => {
      try {
        const result = await reverseGeocodeCity(lat, lng);
        if (result) setSelectedCity({ name: result.name, slug: slugify(result.name) });
      } catch {
        // Lookup failed (offline, rate-limited) — keep whatever city is currently shown.
      }
    },
    [setSelectedCity]
  );

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }
    setLocationStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus("granted");
        applyRealCity(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setLocationStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, [applyRealCity]);

  // Deliberately NOT auto-fired on mount — CityProvider wraps the entire app (every page,
  // including "/"), so firing here means the native location prompt pops up on first paint of
  // ANY page, not specifically when the user is searching. The native prompt should only ever be
  // triggered by: (1) the user explicitly clicking "Detect Location" in the city pill below, or
  // (2) app/(main)/search/page.tsx's own on-mount effect, which only fires on the /search route.
  return (
    <CityContext.Provider
      value={{ cities: SUPPORTED_CITIES, selectedCity, setSelectedCity, locationStatus, requestLocation, setManualCityName }}
    >
      {children}
    </CityContext.Provider>
  );
}

export function useCity(): CityContextValue {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error("useCity must be used within a CityProvider");
  return ctx;
}
