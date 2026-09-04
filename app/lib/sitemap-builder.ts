import { getCategories, getCities, getPseoSitemapCandidates, getBusinessSitemapSlugs } from "@/app/lib/search-api";
import { evaluatePseoGate } from "@/app/lib/pseo-thresholds";
import { SITE_URL } from "@/app/lib/json-ld";

export const CHUNK_SIZE = 5000;

export interface SitemapUrlEntry {
  url: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function buildSitemapXml(entries: SitemapUrlEntry[]): string {
  const urlsXml = entries
    .map((e) => {
      const loc = `<loc>${escapeXml(e.url)}</loc>`;
      const lastmod = `<lastmod>${formatDate(e.lastmod)}</lastmod>`;
      const changefreq = e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : "";
      const priority = e.priority != null ? `<priority>${e.priority.toFixed(1)}</priority>` : "";
      return `  <url>\n    ${loc}\n    ${lastmod}\n    ${changefreq}\n    ${priority}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`;
}

export function buildSitemapIndexXml(sitemaps: { url: string; lastmod?: string }[]): string {
  const sitemapsXml = sitemaps
    .map((s) => {
      const loc = `<loc>${escapeXml(s.url)}</loc>`;
      const lastmod = `<lastmod>${formatDate(s.lastmod)}</lastmod>`;
      return `  <sitemap>\n    ${loc}\n    ${lastmod}\n  </sitemap>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapsXml}\n</sitemapindex>`;
}

const STATIC_PATHS = ["/", "/city", "/category", "/search", "/nearby"];

export async function getStaticSitemapEntries(): Promise<SitemapUrlEntry[]> {
  const nowISO = new Date().toISOString();
  return STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastmod: nowISO,
    changefreq: (path === "/" ? "daily" : "weekly") as "daily" | "weekly",
    priority: path === "/" ? 1.0 : 0.7,
  }));
}

function isHealthcareItem(nameOrSlug: string): boolean {
  const lower = nameOrSlug.toLowerCase();
  return (
    lower.includes("health") ||
    lower.includes("medical") ||
    lower.includes("hospital") ||
    lower.includes("clinic") ||
    lower.includes("lab") ||
    lower.includes("pharmacy") ||
    lower.includes("doctor") ||
    lower.includes("dental") ||
    lower.includes("dentist") ||
    lower.includes("patholog") ||
    lower.includes("eye") ||
    lower.includes("optometr") ||
    lower.includes("pediatric") ||
    lower.includes("derma") ||
    lower.includes("physio")
  );
}

export async function getCategorySitemapEntries(): Promise<SitemapUrlEntry[]> {
  const [cities, categories] = await Promise.all([getCities(), getCategories()]);
  const nowISO = new Date().toISOString();

  const cityEntries: SitemapUrlEntry[] = cities
    .filter((c) => (c.businessCount ?? 1) > 0)
    .map((c) => ({
      url: `${SITE_URL}/city/${c.slug}`,
      lastmod: nowISO,
      changefreq: "weekly" as const,
      priority: 0.6,
    }));

  const categoryEntries: SitemapUrlEntry[] = categories
    .filter((c) => isHealthcareItem(c.slug) || isHealthcareItem(c.name) || (c.businessCount ?? 0) > 0)
    .flatMap((c) => {
      const isCatHealthcare = isHealthcareItem(c.slug) || isHealthcareItem(c.name);
      const priority = isCatHealthcare ? 0.9 : 0.8;

      return [
        {
          url: `${SITE_URL}/category/${c.slug}`,
          lastmod: nowISO,
          changefreq: "daily" as const,
          priority: priority,
        },
        ...c.subcategories.map((s) => {
          const isSubcatHealthcare = isCatHealthcare || isHealthcareItem(s.slug) || isHealthcareItem(s.name);
          return {
            url: `${SITE_URL}/category/${s.slug}`,
            lastmod: nowISO,
            changefreq: "daily" as const,
            priority: isSubcatHealthcare ? 0.85 : 0.7,
          };
        }),
      ];
    });

  return [...cityEntries, ...categoryEntries];
}

export async function getPseoSitemapEntries(): Promise<SitemapUrlEntry[]> {
  const candidates = await getPseoSitemapCandidates();
  const sorted = candidates
    .filter((c) => {
      const gate = evaluatePseoGate(c.count);
      return gate.exists && gate.indexable;
    })
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.path.localeCompare(b.path);
    });

  return sorted.map((c) => ({
    url: `${SITE_URL}${c.path}`,
    lastmod: c.lastmod ?? new Date().toISOString(),
    changefreq: "weekly" as const,
    priority: c.count >= 50 ? 0.6 : 0.5,
  }));
}

const NON_HEALTHCARE_SLUG_EXCLUSIONS = [
  "hotel", "restaurant", "resort", "cafe", "bakery", "saree", "textile", "jewell",
  "electronics", "auto", "motors", "travels", "cabs", "real estate", "furniture",
  "footwear", "tailor", "bar", "pub", "wine", "liquor", "supermarket", "grocery",
  "hair-fixing", "hair-weaving", "wig", "karnataka", "narachi", "proposed-sub-centre"
];

export async function getBusinessChunkSitemapEntries(chunkIndex: number): Promise<SitemapUrlEntry[]> {
  const allSlugs = await getBusinessSitemapSlugs();
  const filtered = allSlugs.filter((b) => {
    const s = b.slug.toLowerCase();
    return !NON_HEALTHCARE_SLUG_EXCLUSIONS.some((kw) => s.includes(kw));
  });

  const start = chunkIndex * CHUNK_SIZE;
  const end = start + CHUNK_SIZE;
  const chunk = filtered.slice(start, end);

  return chunk.map((b) => ({
    url: `${SITE_URL}/business/${b.slug}`,
    lastmod: b.lastmod ?? new Date().toISOString(),
    changefreq: "weekly" as const,
    priority: 0.7,
  }));
}

export async function getSitemapIndexEntries(): Promise<{ url: string; lastmod: string }[]> {
  const allSlugs = await getBusinessSitemapSlugs();
  const filtered = allSlugs.filter((b) => {
    const s = b.slug.toLowerCase();
    return !NON_HEALTHCARE_SLUG_EXCLUSIONS.some((kw) => s.includes(kw));
  });

  const totalBusinesses = filtered.length;
  const businessChunksCount = Math.max(1, Math.ceil(totalBusinesses / CHUNK_SIZE));
  const nowISO = new Date().toISOString();

  const indexEntries = [
    { url: `${SITE_URL}/sitemap-static.xml`, lastmod: nowISO },
    { url: `${SITE_URL}/sitemap-categories.xml`, lastmod: nowISO },
    { url: `${SITE_URL}/sitemap-pseo.xml`, lastmod: nowISO },
  ];

  for (let i = 1; i <= businessChunksCount; i++) {
    const chunkStart = (i - 1) * CHUNK_SIZE;
    const firstItemInChunk = filtered[chunkStart];
    const chunkLastMod = firstItemInChunk?.lastmod ?? nowISO;
    indexEntries.push({
      url: `${SITE_URL}/sitemap-businesses-${i}.xml`,
      lastmod: chunkLastMod,
    });
  }

  return indexEntries;
}

export function createBusinessChunkHandler(chunkIndex: number) {
  return async function GET() {
    try {
      const entries = await getBusinessChunkSitemapEntries(chunkIndex);
      const xml = buildSitemapXml(entries);
      return new Response(xml, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
        },
      });
    } catch (err: any) {
      console.error(`Error generating business sitemap chunk ${chunkIndex + 1}:`, err);
      return new Response("Internal Server Error", { status: 500 });
    }
  };
}
