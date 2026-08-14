import { mkdirSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";
import type { PendingBusiness } from "../deduplicator/dedup-index";
import type { CategoryResolver } from "../category-mapper/resolve";
import { slugify } from "../category-mapper/taxonomy-slug";

const CLEANED_DATA_DIR = path.join(__dirname, "../../../cleaned-data");

const COLUMNS = [
  "name",
  "address",
  "pincode",
  "city",
  "lat",
  "lng",
  "phone",
  "website",
  "avg_rating",
  "review_count",
  "external_place_id",
  "open_hours_raw",
  "primary_subcategory",
  "additional_subcategories",
  "source_category_text",
] as const;

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsvLine(fields: (string | number | null)[]): string {
  return fields.map((f) => escapeCsvField(f === null ? "" : String(f))).join(",") + "\n";
}

/**
 * Groups deduped/normalized businesses by their primary (first-seen) subcategory and writes
 * one cleaned CSV per subcategory into backend/cleaned-data/<subcategory-slug>.csv. A business
 * that also matched other subcategories still appears exactly once, in its primary
 * subcategory's file — this mirrors BusinessCategory.isPrimary in the DB: the first subcategory
 * a business was found under is primary, every other one it also matched is listed by name in
 * additional_subcategories. This is a pure export step — it never touches the raw scraper CSVs
 * or the database.
 */
export function writeCleanedDataFiles(
  pending: PendingBusiness[],
  categoryResolver: CategoryResolver,
): { filesWritten: number; rowsWritten: number } {
  mkdirSync(CLEANED_DATA_DIR, { recursive: true });

  const groups = new Map<string, PendingBusiness[]>();
  for (const item of pending) {
    const slug = slugify(item.business.sourceSubcategory);
    const group = groups.get(slug) ?? [];
    group.push(item);
    groups.set(slug, group);
  }

  for (const [slug, items] of groups) {
    const lines = [toCsvLine([...COLUMNS])];
    for (const item of items) {
      const b = item.business;
      const categoryIds = [...item.categoryIds];
      const additionalNames = categoryIds.slice(1).map((id) => categoryResolver.nameOf(id));
      lines.push(
        toCsvLine([
          b.name,
          b.address,
          b.pincode,
          b.citySlug,
          b.lat,
          b.lng,
          b.phone,
          b.website,
          b.avgRating,
          b.reviewCount,
          b.externalPlaceId,
          b.openHoursRaw,
          b.sourceSubcategory,
          additionalNames.join("; "),
          b.sourceCategoryText,
        ]),
      );
    }
    // Write to a temp file then rename over the target — an editor/AV holding the destination
    // open for reading (common on Windows) blocks a direct overwrite but not a rename.
    const target = path.join(CLEANED_DATA_DIR, `${slug}.csv`);
    const tmp = `${target}.tmp-${process.pid}`;
    writeFileSync(tmp, lines.join(""), "utf-8");
    renameSync(tmp, target);
  }

  return { filesWritten: groups.size, rowsWritten: pending.length };
}

export { CLEANED_DATA_DIR };
