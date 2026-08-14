/** Whitespace-only cleanup — never rewrites the business name itself. */
export function normalizeName(rawTitle: string): string {
  return rawTitle.replace(/\s+/g, " ").trim();
}

/** Lowercased/collapsed form used only for dedup/matching, never for display. */
export function normalizeNameForMatching(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
