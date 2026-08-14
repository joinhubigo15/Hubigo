// Free, no-API-key place lookup via OpenStreetMap Nominatim — used only for the homepage's
// cosmetic city pill (auto-detect + manual search), never for actual search filtering/results,
// so approximate matches are fine and no paid geocoding provider is needed.

export interface GeocodedCity {
  name: string;
  /** State/country, for disambiguating same-named cities in the suggestion list. */
  subtitle: string;
  lat: number;
  lng: number;
}

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
}

function extractCityName(address: NominatimAddress | undefined, fallback: string): string {
  return address?.city || address?.town || address?.village || address?.municipality || address?.county || fallback;
}

/** Debounced by the caller — this just does the actual lookup for whatever the current query is. */
export async function searchCities(query: string, signal?: AbortSignal): Promise<GeocodedCity[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    q: trimmed,
    format: "jsonv2",
    addressdetails: "1",
    limit: "6",
  });

  const res = await fetch(`${NOMINATIM_BASE}/search?${params.toString()}`, { signal });
  if (!res.ok) return [];
  const rows = (await res.json()) as Array<{ display_name?: string; lat: string; lon: string; address?: NominatimAddress }>;

  const seen = new Set<string>();
  const results: GeocodedCity[] = [];
  for (const row of rows) {
    const name = extractCityName(row.address, row.display_name?.split(",")[0] ?? trimmed);
    const subtitle = [row.address?.state, row.address?.country].filter(Boolean).join(", ");
    const key = `${name}|${subtitle}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ name, subtitle, lat: Number(row.lat), lng: Number(row.lon) });
  }
  return results;
}

export async function reverseGeocodeCity(lat: number, lng: number): Promise<GeocodedCity | null> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lng), format: "jsonv2", addressdetails: "1" });
  const res = await fetch(`${NOMINATIM_BASE}/reverse?${params.toString()}`);
  if (!res.ok) return null;
  const row = (await res.json()) as { display_name?: string; error?: string; address?: NominatimAddress };
  if (!row || row.error) return null;

  const name = extractCityName(row.address, row.display_name?.split(",")[0] ?? "");
  if (!name) return null;
  const subtitle = [row.address?.state, row.address?.country].filter(Boolean).join(", ");
  return { name, subtitle, lat, lng };
}
