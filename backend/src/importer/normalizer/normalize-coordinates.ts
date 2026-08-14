/** Parses+range-validates lat/lng. Returns null (rather than 0/NaN) when absent or out of range. */
export function normalizeCoordinates(rawLat: string, rawLng: string): { lat: number | null; lng: number | null } {
  const lat = parseFloat(rawLat);
  const lng = parseFloat(rawLng);

  const validLat = Number.isFinite(lat) && lat >= -90 && lat <= 90 ? lat : null;
  const validLng = Number.isFinite(lng) && lng >= -180 && lng <= 180 ? lng : null;

  // A coordinate pair is only meaningful together.
  if (validLat === null || validLng === null) return { lat: null, lng: null };
  return { lat: validLat, lng: validLng };
}
