import path from "node:path";
import { DescriptionPool } from "./description-pool";
import { buildImageKeyPoolsByFolder } from "./walk-local-images";
import type { EnrichmentPools } from "./enrich-row";

export const BUSINESS_IMAGES_ROOT = path.join(
  __dirname,
  "../../../scripts/pixabay-image-sourcing/output/Final Images",
);
export const BADGE_IMAGES_ROOT = path.join(__dirname, "../../../scripts/pixabay-badge-images/output/badges");

/** Fresh pools with a clean badge round-robin cursor — call once per batch run, not per file. */
export function loadEnrichmentPools(): EnrichmentPools {
  return {
    descriptions: DescriptionPool.load(),
    businessImagesByFolder: buildImageKeyPoolsByFolder(BUSINESS_IMAGES_ROOT),
    badgeImagesByFolder: buildImageKeyPoolsByFolder(BADGE_IMAGES_ROOT),
    badgeCursorByFolder: new Map(),
  };
}
