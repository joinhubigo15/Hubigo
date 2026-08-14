function slugifyPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Business.slug is @unique. Rather than round-tripping to the DB to check for collisions
 * across a run that may insert hundreds of thousands of rows, a short random suffix is
 * appended — cheap, and collision-proof for all practical purposes.
 */
export function generateBusinessSlug(name: string, citySlug: string): string {
  const base = [slugifyPart(name), slugifyPart(citySlug)].filter(Boolean).join("-") || "business";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}
