/**
 * The sourced image folders mostly match Category.slug exactly (slugify(canonicalSubcategoryName)).
 * A handful of folders were created with inconsistent casing/typos before the taxonomy slug was
 * finalized. Rather than rename the folders (explicitly told not to), we alias the canonical
 * slug to the actual on-disk folder name here, scoped per bucket since business/badge folders
 * don't always share the same typo.
 */
export const BUSINESS_FOLDER_ALIASES: Record<string, string> = {
  "dessert-store": "desert-store",
};

export const BADGE_FOLDER_ALIASES: Record<string, string> = {
  "dessert-store": "Desert-Store",
  "cancer-care-center": "Cancer_Care",
  "ent-clinic": "ENT Specialist",
  "refrigerator-repair-service": "Refrigator-Repair",
  "tanning-studio": "Tanning Studio",
};

export function resolveFolderName(
  canonicalSlug: string,
  pool: Map<string, string[]>,
  aliases: Record<string, string>,
): string | null {
  if (pool.has(canonicalSlug)) return canonicalSlug;
  const alias = aliases[canonicalSlug];
  if (alias && pool.has(alias)) return alias;
  return null;
}
