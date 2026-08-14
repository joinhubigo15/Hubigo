import type { NormalizedBusiness } from "../types";

export interface DedupSignatures {
  /** dedup_key from the CSV (place_id | cid | data_id) — the most reliable, tier 1. */
  primaryKey: string | null;
  /** normalized phone + coordinates (rounded to ~11m) — tier 2 fallback. */
  phoneCoordKey: string | null;
}

/** Rounds to 4 decimal places (~11m precision) so near-identical float coordinates from repeated scrapes still match. */
function roundCoord(n: number): string {
  return n.toFixed(4);
}

export function computeDedupSignatures(business: NormalizedBusiness): DedupSignatures {
  const primaryKey = business.externalPlaceId || null;

  let phoneCoordKey: string | null = null;
  if (business.phone && business.lat !== null && business.lng !== null) {
    phoneCoordKey = `${business.phone}|${roundCoord(business.lat)}|${roundCoord(business.lng)}`;
  }

  return { primaryKey, phoneCoordKey };
}
