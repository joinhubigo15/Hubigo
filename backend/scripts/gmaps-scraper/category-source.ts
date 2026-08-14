import { readFileSync } from "node:fs";
import path from "node:path";
import type { CategoryRecord } from "./types";

const DATA_PATH = path.join(__dirname, "data", "category-priority.json");

let cached: CategoryRecord[] | null = null;

export function loadCategories(): CategoryRecord[] {
  if (!cached) {
    cached = JSON.parse(readFileSync(DATA_PATH, "utf-8")) as CategoryRecord[];
  }
  return cached;
}

export function listTiers(): string[] {
  return [...new Set(loadCategories().map((c) => c.densityTier))].sort();
}

export function listSectors(): string[] {
  return [...new Set(loadCategories().map((c) => c.sector))].sort();
}

export interface SelectionFilters {
  subcategories?: string[];
  sectors?: string[];
  tiers?: string[];
  all?: boolean;
}

/**
 * Resolves a selection into concrete rows. --subcategory (exact names) is exclusive and
 * bypasses sector/tier. --sector and --tier combine as an AND filter. --all ignores
 * everything else. Throws on unknown names so typos fail loudly instead of silently
 * selecting zero/wrong rows.
 */
export function resolveSelection(filters: SelectionFilters): CategoryRecord[] {
  const all = loadCategories();

  if (filters.all) {
    return all;
  }

  if (filters.subcategories && filters.subcategories.length > 0) {
    const wanted = new Set(filters.subcategories.map((s) => s.trim().toLowerCase()));
    const matched = all.filter((c) => wanted.has(c.subcategory.toLowerCase()));
    const matchedNames = new Set(matched.map((c) => c.subcategory.toLowerCase()));
    const missing = [...wanted].filter((w) => !matchedNames.has(w));
    if (missing.length > 0) {
      throw new Error(`Unknown subcategory name(s): ${missing.join(", ")}`);
    }
    return matched;
  }

  if ((filters.sectors && filters.sectors.length > 0) || (filters.tiers && filters.tiers.length > 0)) {
    let rows = all;
    if (filters.sectors && filters.sectors.length > 0) {
      const wanted = new Set(filters.sectors.map((s) => s.trim().toLowerCase()));
      const knownSectors = new Set(listSectors().map((s) => s.toLowerCase()));
      const missing = [...wanted].filter((w) => !knownSectors.has(w));
      if (missing.length > 0) {
        throw new Error(`Unknown sector(s): ${missing.join(", ")}`);
      }
      rows = rows.filter((c) => wanted.has(c.sector.toLowerCase()));
    }
    if (filters.tiers && filters.tiers.length > 0) {
      const wanted = new Set(filters.tiers.map((s) => s.trim().toLowerCase()));
      const knownTiers = new Set(listTiers().map((s) => s.toLowerCase()));
      const missing = [...wanted].filter((w) => !knownTiers.has(w));
      if (missing.length > 0) {
        throw new Error(`Unknown density tier(s): ${missing.join(", ")}. Known tiers: ${listTiers().join(", ")}`);
      }
      rows = rows.filter((c) => wanted.has(c.densityTier.toLowerCase()));
    }
    return rows;
  }

  throw new Error("No selection given: pass --subcategory, --sector, --tier, or --all-subcategories.");
}
