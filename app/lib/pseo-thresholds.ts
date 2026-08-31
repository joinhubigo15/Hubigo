// pSEO indexing framework (finalized): every combination with at least 1 business gets a page;
// every combination with MORE THAN 15 businesses is indexable. Three independent decisions,
// never conflated:
//   1. EXIST     — does the page render at all, or 404? (MIN_EXIST floor — a 0-business combo
//      does not exist; a 1-15 combo DOES exist, it's just not indexable)
//   2. INDEXABLE — is it allowed into search engines + the sitemap? (MIN_INDEXABLE floor +
//      noindex,follow meta below it — never robots.txt, which can't do per-page logic and would
//      also block crawling/link-equity flow). Threshold is ">15", implemented as ">=16" so the
//      comparison stays a plain `>=` throughout.
//   3. DISPLAY    — how many businesses render on the page (PSEO_DISPLAY_LIMIT) — deliberately
//      unrelated to either threshold above; a page can exist/be indexable while still only
//      displaying a capped number of listings.
// All three are env-configurable so they can be tuned without a code change. highDensityAt (50)
// is an informational density tier only — it is NOT an additional indexing requirement.
export const PSEO_THRESHOLDS = {
  minExist: Number(process.env.PSEO_MIN_EXIST ?? 1),
  minIndexable: Number(process.env.PSEO_MIN_INDEXABLE ?? 1),
  highDensityAt: Number(process.env.PSEO_HIGH_DENSITY_AT ?? 20),
} as const;

export const PSEO_DISPLAY_LIMIT = Number(process.env.PSEO_DISPLAY_LIMIT ?? 20);

// Hard ceiling on how many businesses a single pSEO page will ever load in total (initial SSR
// batch + every subsequent "Load More" click combined) — independent of PSEO_DISPLAY_LIMIT, which
// only controls the FIRST batch size. A page with fewer real businesses than this exposes all of
// them; a page with more silently caps at this number rather than ever loading everything.
export const PSEO_MAX_EXPOSED = Number(process.env.PSEO_MAX_EXPOSED ?? 200);

export type PseoDensityTier = "high" | "low";

export type PseoGate =
  | { exists: false }
  | { exists: true; indexable: boolean; tier: PseoDensityTier };

/** Applies uniformly to all 4 pSEO templates (Area/City x Category/Subcategory) — the gate only
 * ever looks at the real business count, never the template type. */
export function evaluatePseoGate(count: number): PseoGate {
  if (count < PSEO_THRESHOLDS.minExist) return { exists: false };
  return {
    exists: true,
    indexable: count >= PSEO_THRESHOLDS.minIndexable,
    tier: count >= PSEO_THRESHOLDS.highDensityAt ? "high" : "low",
  };
}

/** Next.js Metadata `robots` field for a pSEO page — undefined lets the site-wide default
 * (indexable) apply; explicit noindex,follow for the 1-15 (exists but not yet indexable) band. */
export function pseoRobotsMeta(indexable: boolean): { index: boolean; follow: boolean } | undefined {
  return indexable ? undefined : { index: false, follow: true };
}
