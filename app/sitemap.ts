import type { MetadataRoute } from "next";
import { getCategories, getCities, getPseoSitemapCandidates } from "@/app/lib/search-api";
import { evaluatePseoGate } from "@/app/lib/pseo-thresholds";
import { SITE_URL } from "@/app/lib/json-ld";

// Google/Next both cap a single sitemap file at 50,000 URLs. Real indexable pSEO volume today is
// ~12,385 URLs (well under that), so this stays a single file rather than using generateSitemaps()
// chunking — that API has a confirmed bug in this Next.js 16.2.12 + Turbopack build (both `next
// dev` and `next build` silently produced an empty sitemap with it; a plain single-array default
// export works correctly). buildAllEntries() below is factored so a future chunked version only
// needs to slice its already-assembled array — revisit if indexable volume approaches ~40,000.
export const revalidate = 3600;

const STATIC_PATHS = ["/", "/city", "/category", "/search", "/nearby"];

// No reliable per-path "last meaningfully changed" signal exists for these (they're static
// routes, not DB-backed content) — omitted rather than faked, per the lastmod rule below.
async function buildStaticEntries(): Promise<MetadataRoute.Sitemap> {
  return STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}

// Same reasoning as buildStaticEntries — City has no updatedAt column, and the public categories
// API doesn't currently expose Category.updatedAt, so there's no reliable per-page lastmod source
// here either. Omitted rather than faked.
async function buildCityAndCategoryEntries(): Promise<MetadataRoute.Sitemap> {
  // No .catch() — a failed fetch must propagate rather than silently producing a truncated
  // sitemap that then gets cached for an hour, which reads to Google as thousands of URLs having
  // disappeared.
  const [cities, categories] = await Promise.all([getCities(), getCategories()]);

  const cityEntries: MetadataRoute.Sitemap = cities.map((c) => ({
    url: `${SITE_URL}/city/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.flatMap((c) => [
    { url: `${SITE_URL}/category/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.6 },
    ...c.subcategories.map((s) => ({
      url: `${SITE_URL}/category/${s.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ]);

  return [...cityEntries, ...categoryEntries];
}

interface PseoSitemapEntry {
  url: string;
  count: number;
  lastModified?: string;
  changeFrequency: "weekly";
  priority: number;
}

/** Only the INDEXABLE tier (>15 businesses — see evaluatePseoGate, the single source of truth
 * for this decision, shared with the page templates themselves) of the 4 pSEO templates goes
 * into the sitemap — pages in the 1-15 exists-but-noindex band are real, crawlable pages
 * (internal links still reach them, robots meta says follow), just not sitemap-submitted. */
async function buildPseoEntries(): Promise<PseoSitemapEntry[]> {
  // No .catch() here either — same reasoning as buildCityAndCategoryEntries above.
  const candidates = await getPseoSitemapCandidates();
  return candidates
    .filter((c) => {
      const gate = evaluatePseoGate(c.count);
      return gate.exists && gate.indexable;
    })
    .map((c) => ({
      url: `${SITE_URL}${c.path}`,
      count: c.count,
      // Real data-derived value (MAX of the page's businesses' updatedAt) — never a fabricated
      // "now". Only omitted if the backend genuinely had nothing (shouldn't happen for a
      // non-empty group, but the API allows it).
      lastModified: c.lastmod ?? undefined,
      changeFrequency: "weekly" as const,
      priority: c.count >= 50 ? 0.6 : 0.5,
    }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [staticEntries, cityAndCategory, pseoEntries] = await Promise.all([
    buildStaticEntries(),
    buildCityAndCategoryEntries(),
    buildPseoEntries(),
  ]);

  // Descending by real business count, URL ascending as a deterministic tiebreak — for
  // organization/inspection only. Sitemap order is not a crawl-priority mechanism; Googlebot
  // does not guarantee crawling in listed order.
  const sortedPseo = [...pseoEntries].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.url.localeCompare(b.url);
  });

  const pseoSitemapEntries: MetadataRoute.Sitemap = sortedPseo.map(({ url, lastModified, changeFrequency, priority }) => ({
    url,
    ...(lastModified ? { lastModified } : {}),
    changeFrequency,
    priority,
  }));

  return [...staticEntries, ...cityAndCategory, ...pseoSitemapEntries];
}
