export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

/**
 * The only rejection rule for this pipeline: address missing/empty. Every other field
 * (phone, website, email, rating, reviews, hours, coordinates) is enrichable later and
 * must never block an import.
 */
export function validateBusiness(cleanedAddress: string): ValidationResult {
  if (!cleanedAddress) {
    return { ok: false, reason: "missing_address" };
  }
  return { ok: true };
}
