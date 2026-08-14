const PINCODE_RE = /\b(\d{6})\b/;

/** Whitespace cleanup only — address text itself is preserved, never rewritten. */
export function normalizeAddress(rawAddress: string): string {
  return rawAddress.replace(/\s+/g, " ").trim();
}

/**
 * Extracts a 6-digit Indian PIN code. Tries the full/complete address first (most reliable,
 * embedded in Google's own text), then falls back to source_location — which in "plain"
 * scrape mode is literally the pincode from the location file — if it looks like one.
 */
export function extractPincode(address: string, completeAddress: string, sourceLocation?: string): string | null {
  const fromAddress = address.match(PINCODE_RE)?.[1];
  if (fromAddress) return fromAddress;

  const fromComplete = completeAddress?.match(PINCODE_RE)?.[1];
  if (fromComplete) return fromComplete;

  const trimmedLocation = (sourceLocation ?? "").trim();
  if (/^\d{6}$/.test(trimmedLocation)) return trimmedLocation;

  return null;
}
