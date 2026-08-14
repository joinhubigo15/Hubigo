import { canonicalSubcategoryName, slugify } from "../category-mapper/taxonomy-slug";
import { DescriptionPool } from "./description-pool";
import { BUSINESS_FOLDER_ALIASES, BADGE_FOLDER_ALIASES, resolveFolderName } from "./folder-aliases";

export const ENRICHMENT_COLUMNS = [
  "resolved_subcategory_slug",
  "description",
  "cover_image_key",
  "gallery_image_keys",
  "badge_image_key",
  "enrichment_warning",
] as const;

export interface EnrichmentPools {
  descriptions: DescriptionPool;
  businessImagesByFolder: Map<string, string[]>;
  badgeImagesByFolder: Map<string, string[]>;
  /** Mutable: next badge-pool index to hand out per badge folder, for stable round-robin assignment. */
  badgeCursorByFolder: Map<string, number>;
}

export interface EnrichedFields {
  resolved_subcategory_slug: string;
  description: string;
  cover_image_key: string;
  gallery_image_keys: string;
  badge_image_key: string;
  enrichment_warning: string;
}

const GALLERY_SIZE = 3;
const GALLERY_KEY_SEPARATOR = "|";

function pickUniqueRandom(pool: string[], count: number, exclude?: string): string[] {
  const candidates = exclude ? pool.filter((k) => k !== exclude) : [...pool];
  const picked: string[] = [];
  while (picked.length < count && candidates.length > 0) {
    const i = Math.floor(Math.random() * candidates.length);
    picked.push(candidates.splice(i, 1)[0]);
  }
  return picked;
}

/**
 * Assigns a description + storage KEYS (never full URLs — the storage provider is not the
 * enrichment step's concern; whatever resolves keys into public URLs later, e.g. an R2
 * adapter, is a separate concern) to one staging CSV row, keyed off its source_subcategory.
 */
export function enrichRow(sourceSubcategory: string, pools: EnrichmentPools): EnrichedFields {
  const canonicalSlug = slugify(canonicalSubcategoryName(sourceSubcategory));
  const warnings: string[] = [];

  const description = pools.descriptions.pickRandom(canonicalSlug);
  if (!description) warnings.push("no description pool for subcategory");

  const businessFolder = resolveFolderName(canonicalSlug, pools.businessImagesByFolder, BUSINESS_FOLDER_ALIASES);
  const businessPool = businessFolder ? pools.businessImagesByFolder.get(businessFolder)! : [];
  if (!businessFolder) warnings.push("no cover/gallery image folder for subcategory");

  const badgeFolder = resolveFolderName(canonicalSlug, pools.badgeImagesByFolder, BADGE_FOLDER_ALIASES);
  const badgePool = badgeFolder ? pools.badgeImagesByFolder.get(badgeFolder)! : [];
  if (!badgeFolder) warnings.push("no badge image folder for subcategory");

  const coverImageKey = businessPool.length > 0 ? businessPool[Math.floor(Math.random() * businessPool.length)] : "";
  const galleryImageKeys = pickUniqueRandom(businessPool, GALLERY_SIZE, coverImageKey || undefined);

  // Badges: stable round-robin across the subcategory's pool (not random), so all available
  // badge images get distributed roughly evenly across every business in that subcategory.
  let badgeImageKey = "";
  if (badgeFolder && badgePool.length > 0) {
    const cursor = pools.badgeCursorByFolder.get(badgeFolder) ?? 0;
    badgeImageKey = badgePool[cursor % badgePool.length];
    pools.badgeCursorByFolder.set(badgeFolder, cursor + 1);
  }

  return {
    resolved_subcategory_slug: canonicalSlug,
    description: description ?? "",
    cover_image_key: coverImageKey,
    gallery_image_keys: galleryImageKeys.join(GALLERY_KEY_SEPARATOR),
    badge_image_key: badgeImageKey,
    enrichment_warning: warnings.join("; "),
  };
}
