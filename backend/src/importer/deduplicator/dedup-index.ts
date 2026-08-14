import type { NormalizedBusiness } from "../types";
import { computeDedupSignatures } from "./dedup-key";

/** A business found once, plus every subcategory it's been seen under across the whole import. */
export interface PendingBusiness {
  business: NormalizedBusiness; // first-seen data — never mutated by later duplicates
  categoryIds: Set<string>;
}

/**
 * Builds a full in-memory dedup index across the ENTIRE input (all files), so the same
 * business appearing under different subcategories/pincodes/CSVs is always merged into one
 * record before anything is written to the DB. Two tiers only, in priority order:
 *   1. dedup_key (place_id | cid | data_id)
 *   2. normalized phone + coordinates
 * Rows with neither signal are never matched against anything and are always inserted as-is.
 */
export class DedupIndex {
  private byPrimaryKey = new Map<string, PendingBusiness>();
  private byPhoneCoordKey = new Map<string, PendingBusiness>();
  private pendingInOrder: PendingBusiness[] = [];
  duplicatesMerged = 0;

  /**
   * Adds a normalized row's resolved category (may be null) to the index, merging with an
   * existing match if found.
   *
   * `sectorId` (the category's top-level sector, from CategoryResolver.topLevelSectorOf) scopes
   * the weaker phone+coordinates signal: businesses co-located in the same building/complex
   * often share a front-desk phone number and near-identical geocoded coordinates (Google Maps
   * frequently pins an entire building to one point), and merging across sectors on that signal
   * alone previously produced businesses tagged as e.g. both "Chartered Accountant" AND
   * "Restaurant" AND "Hotel" — a real production bug traced back to exactly this. place_id/cid/
   * data_id (primaryKey) is Google's own identifier for the exact listing, so it's still trusted
   * across sectors unscoped — only the fallback signal needs this guard.
   */
  add(business: NormalizedBusiness, categoryId: string | null, sectorId: string | null): void {
    const { primaryKey, phoneCoordKey: basePhoneCoordKey } = computeDedupSignatures(business);
    const phoneCoordKey = basePhoneCoordKey && sectorId ? `${basePhoneCoordKey}|${sectorId}` : basePhoneCoordKey;

    const existing =
      (primaryKey && this.byPrimaryKey.get(primaryKey)) ||
      (phoneCoordKey && this.byPhoneCoordKey.get(phoneCoordKey)) ||
      null;

    if (existing) {
      if (categoryId) existing.categoryIds.add(categoryId);
      this.duplicatesMerged++;
      return;
    }

    const pending: PendingBusiness = {
      business,
      categoryIds: new Set(categoryId ? [categoryId] : []),
    };
    if (primaryKey) this.byPrimaryKey.set(primaryKey, pending);
    if (phoneCoordKey) this.byPhoneCoordKey.set(phoneCoordKey, pending);
    this.pendingInOrder.push(pending);
  }

  get all(): PendingBusiness[] {
    return this.pendingInOrder;
  }

  get uniqueCount(): number {
    return this.pendingInOrder.length;
  }
}
