"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { geocodeLocalAddress } from "@/app/lib/search-api";

export type LocationPermissionState = "prompt" | "granted" | "denied" | "manual" | "skipped";

export interface UserLocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  addressName: string;
  status: LocationPermissionState;
  error: string | null;
  loading: boolean;
}

const DEFAULT_CENTER = {
  lat: 12.9716,
  lng: 77.5946,
  addressName: "Bangalore",
};

const STORAGE_KEY = "hubigo_nearby_location";
// No expiry — a saved location is trusted indefinitely. A "granted" GPS fix still gets silently
// re-checked/refreshed on every mount (see fetchFreshPosition({ silent: true }) below), so it
// self-corrects if the user has moved; only a "manual"/"skipped" location can go stale indefinitely
// until the user changes it themselves via "Change".
const LOCATION_TTL_MS = Infinity;

interface StoredLocation extends UserLocationState {
  savedAt: number;
}

function persist(loc: UserLocationState) {
  try {
    const record: StoredLocation = { ...loc, savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {}
}

function clearStored() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function useNearbyLocation() {
  const [location, setLocation] = useState<UserLocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    addressName: "Detecting location...",
    status: "prompt",
    error: null,
    loading: false,
  });
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const geocodeRequestId = useRef(0);

  /** Fetches a fresh GPS fix and persists it — `maximumAge: 0` forces the browser to take a new
   * reading rather than handing back a cached one, since a cached browser-level fix can itself be
   * stale (e.g. from before the user travelled to a different city). `silent: true` skips the
   * loading/error UI churn — used to quietly correct a restored cached location on mount without
   * flashing "detecting..." over content that's already showing. */
  const fetchFreshPosition = useCallback((opts: { silent: boolean }) => {
    if (!navigator.geolocation) {
      if (!opts.silent) {
        setLocation((prev) => ({ ...prev, status: "denied", error: "Geolocation is not supported by your browser.", loading: false }));
      }
      return;
    }

    if (!opts.silent) setLocation((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLoc: UserLocationState = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          addressName: "Current GPS Location",
          status: "granted",
          error: null,
          loading: false,
        };
        setLocation(newLoc);
        persist(newLoc);
      },
      (error) => {
        // Silent background refresh failing (e.g. a transient GPS glitch) shouldn't blow away a
        // still-reasonable cached fix or surface an error the user never asked for.
        if (opts.silent) return;

        let msg = "Could not fetch GPS location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied. Enter location manually below.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Location unavailable. Check GPS settings or enter location manually.";
        } else if (error.code === error.TIMEOUT) {
          msg = "GPS request timed out. Try again or enter location manually.";
        }
        // console.warn, not .error — a denied/unavailable/timed-out geolocation request is an
        // expected user choice, not an application bug, and Next's dev overlay promotes any
        // console.error() inside a component/effect to a full-screen crash-style error page.
        console.warn("[useNearbyLocation] geolocation request failed:", msg, error);

        clearStored();
        setLocation((prev) => ({
          ...prev,
          lat: prev.lat ?? DEFAULT_CENTER.lat,
          lng: prev.lng ?? DEFAULT_CENTER.lng,
          addressName: prev.lat != null ? prev.addressName : `${DEFAULT_CENTER.addressName} (default)`,
          status: "denied",
          error: msg,
          loading: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, []);

  const requestGPS = useCallback(() => fetchFreshPosition({ silent: false }), [fetchFreshPosition]);

  // Restore a saved location on mount — but only ever trust it if it's still fresh (TTL) AND, for
  // a "granted" GPS fix specifically, the browser's ACTUAL current permission still says granted.
  // Without this, a revoked or stale permission still silently claims "Current GPS Location".
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      let stored: StoredLocation | null = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) stored = JSON.parse(raw);
      } catch {}
      if (!stored) {
        fetchFreshPosition({ silent: true });
        return;
      }

      const isFresh = typeof stored.savedAt === "number" && Date.now() - stored.savedAt < LOCATION_TTL_MS;
      if (!isFresh) {
        clearStored();
        return;
      }

      if (stored.status === "granted") {
        let actuallyGranted = true;
        if (typeof navigator !== "undefined" && navigator.permissions?.query) {
          try {
            const perm = await navigator.permissions.query({ name: "geolocation" as PermissionName });
            actuallyGranted = perm.state === "granted";
          } catch {
            // Permissions API unsupported for geolocation on this browser — fall back to trusting
            // the TTL alone rather than blocking restoration entirely.
          }
        }
        if (!actuallyGranted) {
          clearStored();
          return;
        }
      }

      if (!cancelled) {
        setLocation({
          lat: stored.lat,
          lng: stored.lng,
          accuracy: stored.accuracy ?? null,
          addressName: stored.addressName || "Saved Location",
          status: stored.status || "granted",
          error: null,
          loading: false,
        });

        // The cached fix paints instantly, but it can be hours (up to the 2hr TTL) out of date —
        // long enough to travel between cities. Silently take a fresh GPS reading right away so
        // "nearby" results correct themselves to the user's actual current position instead of
        // wherever they were the last time they granted permission.
        if (stored.status === "granted") fetchFreshPosition({ silent: true });
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchFreshPosition is a stable useCallback with an empty dep array; omitted to keep this a mount-only effect
  }, []);

  // If the user revokes location access in their browser while the page is already open, reflect
  // that immediately instead of continuing to show a now-stale "granted" state.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return;
    let permissionStatus: PermissionStatus | null = null;

    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        permissionStatus = status;
        status.onchange = () => {
          if (status.state !== "granted") {
            clearStored();
            setLocation((prev) =>
              prev.status === "granted"
                ? { lat: null, lng: null, accuracy: null, addressName: "Detecting location...", status: "prompt", error: null, loading: false }
                : prev,
            );
          }
        };
      })
      .catch(() => {});

    return () => {
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  /** Actually geocodes the typed text against our own city/locality data — never silently falls
   * back to a default city. Returns false (and sets geocodeError) if nothing matched. */
  const setManualAddress = useCallback(async (address: string): Promise<boolean> => {
    const requestId = ++geocodeRequestId.current;
    setGeocoding(true);
    setGeocodeError(null);
    try {
      const resolved = await geocodeLocalAddress(address);
      if (geocodeRequestId.current !== requestId) return false;

      const newLoc: UserLocationState = {
        lat: resolved.lat,
        lng: resolved.lng,
        accuracy: null,
        addressName: resolved.addressName,
        status: "manual",
        error: null,
        loading: false,
      };
      setLocation(newLoc);
      persist(newLoc);
      return true;
    } catch (err) {
      if (geocodeRequestId.current !== requestId) return false;
      setGeocodeError(
        err instanceof Error ? err.message : "We couldn't find that location — try an area name or pincode in Bangalore, Chennai, or Hyderabad.",
      );
      return false;
    } finally {
      if (geocodeRequestId.current === requestId) setGeocoding(false);
    }
  }, []);

  const skipLocation = useCallback(() => {
    const newLoc: UserLocationState = {
      lat: DEFAULT_CENTER.lat,
      lng: DEFAULT_CENTER.lng,
      accuracy: null,
      addressName: DEFAULT_CENTER.addressName,
      status: "skipped",
      error: null,
      loading: false,
    };

    setLocation(newLoc);
    persist(newLoc);
  }, []);

  // True only for a genuine, user-provided location signal (real GPS fix or a manually geocoded
  // address) — false for "denied"/"skipped", which carry the Bangalore DEFAULT_CENTER as a
  // last-resort coordinate for features (like the homepage Nearby section) that want to show
  // *something* rather than nothing. Consumers that must never show a distance without a real
  // location (e.g. /search's per-card distance badge) should gate on this, not on `lat != null`.
  const hasRealFix = location.status === "granted" || location.status === "manual";

  return {
    location,
    hasRealFix,
    requestGPS,
    setManualAddress,
    skipLocation,
    geocoding,
    geocodeError,
  };
}
