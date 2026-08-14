/**
 * India-aware phone normalization for matching purposes. Keeps the raw value untouched
 * elsewhere (callers should store `raw`, not this) — this is only for dedup comparison.
 * Returns null when there aren't enough digits to be a real phone number.
 */
export function normalizePhoneForMatching(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;

  // Strip a leading country code (91) or trunk prefix (0), keep the last 10 digits —
  // Indian mobile/landline subscriber numbers are 10 digits.
  const last10 = digits.slice(-10);
  return last10;
}
