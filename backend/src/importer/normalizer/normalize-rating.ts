/** Trivial numeric parse — defaults to 0 when blank/invalid, matching Business's column defaults. */
export function normalizeRating(rawRating: string, rawCount: string): { avgRating: number; reviewCount: number } {
  const rating = parseFloat(rawRating);
  const count = parseInt(rawCount, 10);

  return {
    avgRating: Number.isFinite(rating) && rating >= 0 && rating <= 5 ? rating : 0,
    reviewCount: Number.isFinite(count) && count >= 0 ? count : 0,
  };
}
