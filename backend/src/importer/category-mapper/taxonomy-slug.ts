/**
 * Same slug/name logic as scripts/pixabay-image-sourcing/run.ts, duplicated deliberately
 * (separate concern, separate part of the codebase) so Category.slug lines up exactly with
 * the Pixabay placeholder-image folder names — useful for a future auto-cover-image job.
 */

const NAME_CORRECTIONS: Record<string, string> = {
  "interior designe databaser": "Interior Design",
  "interior designer": "Interior Design",
  "desert store": "Dessert Store",
};

export const SKIP_SUBCATEGORIES = new Set<string>([
  "desert store", // typo for the existing "Dessert Store"
]);

export function stripDatabaseSuffix(subcategory: string): string {
  return subcategory.replace(/\s*database\s*$/i, "").trim();
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Cleans a raw Subcategory sheet value into its canonical display name (typos corrected, "Database" suffix stripped). */
export function canonicalSubcategoryName(raw: string): string {
  const stripped = stripDatabaseSuffix(raw);
  const key = stripped.toLowerCase();
  return NAME_CORRECTIONS[key] ?? stripped;
}
