import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const API_KEY = process.env.PIXABAY_API_KEY?.trim();
if (!API_KEY) {
  throw new Error("PIXABAY_API_KEY missing from backend/.env");
}

const XLSX_PATH = path.join(__dirname, "../../../Categories_Updated.xlsx");
const OUTPUT_DIR = path.join(__dirname, "output");
const IMAGES_DIR = path.join(OUTPUT_DIR, "images");
const SUMMARY_CSV = path.join(OUTPUT_DIR, "summary.csv");

const PER_PAGE = 200;
const TARGET_COUNT = 300;
const MAX_PAGES = 3; // Pixabay caps totalHits at ~500; 3*200 comfortably covers that
const FLAG_THRESHOLD = 50;
const MAX_REQUESTS_PER_WINDOW = 90; // buffer under the documented 100/60s cap
const WINDOW_MS = 60_000;
const DOWNLOAD_CONCURRENCY = 4;

// Some bare subcategory names read as product/ingredient categories on Pixabay rather
// than the business/storefront itself (e.g. "bakery" -> mostly bread/pastry close-ups).
// A qualifier steers results toward the shop/place. Only override cases verified live
// against the API — blindly appending "shop" to every term makes other terms worse
// (e.g. "pharmacy shop" returns e-commerce/wallpaper junk instead of pharmacy interiors).
const SEARCH_TERM_OVERRIDES: Record<string, string> = {
  bakery: "bakery shop",
  farmstay: "farm stay", // "farmstay" as one word returns 0 hits
  ca: "ca coaching institute", // bare "ca" matches unrelated tags (carrot, Sacramento, apple)
  hall: "banquet hall", // bare "hall" pulls Pantheon/hall-of-fame/forest-path noise
  "tution and s.english service": "tuition and spoken english classes", // messy source term
  tuition: "tutor student", // "tuition" alone only has 3 hits on Pixabay; this term is well-covered and relevant
};

// A few source names are outright data-entry glitches (typos, truncation). Fix the
// display name itself so both the folder slug and the search term come out sane —
// e.g. "Interior Designe Databaser" is "Interior Design" with a mangled suffix.
const NAME_CORRECTIONS: Record<string, string> = {
  "interior designe databaser": "Interior Design",
};

// Subcategories that are typos/duplicates of an existing category, confirmed with the
// user, and should not get their own folder.
const SKIP_SUBCATEGORIES = new Set<string>([
  "desert store", // typo for the existing "Dessert Store" (arid-landscape photos, not sweets)
]);

function resolveSearchTerm(subcategory: string): string {
  // Pixabay's tag search returns 0 hits for literal "&" (e.g. "Fruit & Vegetable Store"
  // -> "fruit & vegetable store" matches nothing; "fruit and vegetable store" works fine).
  const base = subcategory
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim();
  return SEARCH_TERM_OVERRIDES[base] ?? base;
}

interface CategoryRow {
  subcategory: string;
  sector: string;
}

interface PixabayHit {
  id: number;
  pageURL: string;
  webformatURL: string;
  user: string;
  userURL: string;
  tags: string;
}

interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: PixabayHit[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripDatabaseSuffix(subcategory: string): string {
  return subcategory.replace(/\s*database\s*$/i, "").trim();
}

function loadCategories(): CategoryRow[] {
  const wb = XLSX.readFile(XLSX_PATH);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const header = (rows[0] ?? []).map((h) => String(h ?? "").trim().toLowerCase());
  const subcategoryCol = header.findIndex((h) => h === "subcategory");
  const sectorCol = header.findIndex((h) => h === "sector");
  if (subcategoryCol === -1) {
    throw new Error(`Could not find a "Subcategory" column in ${XLSX_PATH}`);
  }

  const seen = new Set<string>();
  const out: CategoryRow[] = [];
  for (const row of rows.slice(1)) {
    const rawSubcategory = row?.[subcategoryCol];
    const rawSector = sectorCol === -1 ? "" : row?.[sectorCol];
    if (!rawSubcategory || typeof rawSubcategory !== "string") continue;
    let name = stripDatabaseSuffix(rawSubcategory);
    const key = name.toLowerCase();
    if (SKIP_SUBCATEGORIES.has(key)) continue;
    name = NAME_CORRECTIONS[key] ?? name;
    const dedupeKey = name.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    out.push({ subcategory: name, sector: String(rawSector ?? "").trim() });
  }
  return out;
}

class RateLimiter {
  private timestamps: number[] = [];

  async wait(): Promise<void> {
    for (;;) {
      const now = Date.now();
      this.timestamps = this.timestamps.filter((t) => now - t < WINDOW_MS);
      if (this.timestamps.length < MAX_REQUESTS_PER_WINDOW) {
        this.timestamps.push(now);
        return;
      }
      const oldest = this.timestamps[0];
      const waitMs = WINDOW_MS - (now - oldest) + 50;
      await sleep(waitMs);
    }
  }
}

const limiter = new RateLimiter();

async function searchPixabay(term: string, page: number): Promise<PixabayResponse | null> {
  const url =
    `https://pixabay.com/api/?key=${encodeURIComponent(API_KEY!)}` +
    `&q=${encodeURIComponent(term)}` +
    `&image_type=photo&safesearch=true&per_page=${PER_PAGE}&page=${page}`;

  for (let attempt = 1; attempt <= 4; attempt++) {
    await limiter.wait();
    const res = await fetch(url);

    const remaining = Number(res.headers.get("x-ratelimit-remaining") ?? "");
    const resetSec = Number(res.headers.get("x-ratelimit-reset") ?? "");
    if (Number.isFinite(remaining) && remaining <= 2 && Number.isFinite(resetSec)) {
      await sleep((resetSec + 1) * 1000);
    }

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after") ?? resetSec ?? 60);
      console.warn(`  [429] rate limited, backing off ${retryAfter}s (attempt ${attempt})`);
      await sleep((retryAfter + 1) * 1000);
      continue;
    }

    if (!res.ok) {
      console.error(`  [error] Pixabay returned ${res.status} for term "${term}"`);
      return null;
    }

    return (await res.json()) as PixabayResponse;
  }
  console.error(`  [error] gave up after retries for term "${term}"`);
  return null;
}

interface FetchResult {
  newHits: PixabayHit[];
  totalHits: number;
}

/** Paginates a search term, returning up to `needed` hits whose ids aren't in `excludeIds`. */
async function fetchNewHits(term: string, needed: number, excludeIds: Set<number>): Promise<FetchResult> {
  const collected: PixabayHit[] = [];
  const collectedIds = new Set<number>();
  let totalHits = 0;

  for (let page = 1; page <= MAX_PAGES && collected.length < needed; page++) {
    const result = await searchPixabay(term, page);
    if (!result) break;
    totalHits = result.totalHits;

    for (const hit of result.hits) {
      if (excludeIds.has(hit.id) || collectedIds.has(hit.id)) continue;
      collectedIds.add(hit.id);
      collected.push(hit);
      if (collected.length >= needed) break;
    }

    if (result.hits.length < PER_PAGE) break; // no more pages available
  }

  return { newHits: collected, totalHits };
}

async function downloadImage(hit: PixabayHit, destDir: string): Promise<boolean> {
  const ext = path.extname(new URL(hit.webformatURL).pathname) || ".jpg";
  const dest = path.join(destDir, `${hit.id}${ext}`);
  if (existsSync(dest)) return true;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(hit.webformatURL);
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("retry-after") ?? "");
        const waitSec = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 5 * attempt;
        await sleep((waitSec + 1) * 1000);
        continue;
      }
      if (!res.ok) {
        console.error(`    [warn] failed to download image ${hit.id}: HTTP ${res.status}`);
        return false;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(dest, buf);
      return true;
    } catch (err) {
      if (attempt === 5) {
        console.error(`    [warn] failed to download image ${hit.id}: ${(err as Error).message}`);
        return false;
      }
      await sleep(1000 * attempt);
    }
  }
  console.error(`    [warn] gave up downloading image ${hit.id} after retries`);
  return false;
}

async function downloadAll(hits: PixabayHit[], destDir: string): Promise<PixabayHit[]> {
  const succeeded: PixabayHit[] = [];
  for (let i = 0; i < hits.length; i += DOWNLOAD_CONCURRENCY) {
    const batch = hits.slice(i, i + DOWNLOAD_CONCURRENCY);
    const results = await Promise.all(batch.map((hit) => downloadImage(hit, destDir)));
    batch.forEach((hit, idx) => {
      if (results[idx]) succeeded.push(hit);
    });
    await sleep(400);
  }
  return succeeded;
}

interface SummaryRow {
  subcategory: string;
  sector: string;
  searchTerm: string;
  slug: string;
  imagesCollected: number;
  totalHitsAvailable: number;
  folderPath: string;
  flaggedLowCount: boolean;
}

function writeSummaryCsv(rows: SummaryRow[]): void {
  const header = [
    "subcategory",
    "sector",
    "search_term",
    "slug",
    "images_collected",
    "total_hits_available",
    "folder_path",
    "flagged_low_count",
  ];
  const escape = (v: string | number | boolean) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        escape(r.subcategory),
        escape(r.sector),
        escape(r.searchTerm),
        escape(r.slug),
        escape(r.imagesCollected),
        escape(r.totalHitsAvailable),
        escape(r.folderPath),
        escape(r.flaggedLowCount),
      ].join(","),
    );
  }
  writeFileSync(SUMMARY_CSV, lines.join("\n") + "\n");
}

async function main() {
  mkdirSync(IMAGES_DIR, { recursive: true });
  let categories = loadCategories();
  console.log(`Loaded ${categories.length} unique subcategories from ${XLSX_PATH}`);

  const testLimit = Number(process.env.PIXABAY_TEST_LIMIT ?? "");
  if (Number.isFinite(testLimit) && testLimit > 0) {
    categories = categories.slice(0, testLimit);
    console.log(`PIXABAY_TEST_LIMIT set: running only the first ${categories.length} subcategories`);
  }

  const summary: SummaryRow[] = [];
  const flagged: string[] = [];

  for (let i = 0; i < categories.length; i++) {
    const { subcategory, sector } = categories[i];
    const slug = slugify(subcategory);
    const destDir = path.join(IMAGES_DIR, slug);
    const manifestPath = path.join(destDir, "manifest.json");

    console.log(`[${i + 1}/${categories.length}] ${subcategory} -> "${slug}"`);

    const searchTerm = resolveSearchTerm(subcategory);
    let existingHits: Array<{ id: number; pageURL: string; user: string; userURL: string; tags: string }> = [];
    let existingTotalHits = 0;

    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      existingHits = manifest.hits;
      existingTotalHits = manifest.totalHits ?? existingHits.length;
    }

    const needed = TARGET_COUNT - existingHits.length;
    if (needed <= 0) {
      console.log(`  already have ${existingHits.length} images (target ${TARGET_COUNT}), skipping`);
      const flaggedLow = existingHits.length < FLAG_THRESHOLD;
      if (flaggedLow) flagged.push(subcategory);
      summary.push({
        subcategory,
        sector,
        searchTerm,
        slug,
        imagesCollected: existingHits.length,
        totalHitsAvailable: existingTotalHits,
        folderPath: destDir,
        flaggedLowCount: flaggedLow,
      });
      continue;
    }

    mkdirSync(destDir, { recursive: true });

    const excludeIds = new Set(existingHits.map((h) => h.id));
    const { newHits, totalHits } = await fetchNewHits(searchTerm, needed, excludeIds);

    if (existingHits.length === 0 && newHits.length === 0) {
      console.warn(`  [warn] zero results for term "${searchTerm}" — needs a manual search-term override`);
    } else if (newHits.length < needed) {
      console.log(`  only ${newHits.length}/${needed} additional distinct images available (totalHits: ${totalHits})`);
    }

    const downloadedHitsRaw = await downloadAll(newHits, destDir);
    console.log(
      `  downloaded ${downloadedHitsRaw.length}/${newHits.length} new (had ${existingHits.length}, total now ${existingHits.length + downloadedHitsRaw.length})`,
    );

    const downloadedHits = downloadedHitsRaw.map((h) => ({
      id: h.id,
      pageURL: h.pageURL,
      user: h.user,
      userURL: h.userURL,
      tags: h.tags,
    }));
    const mergedHits = [...existingHits, ...downloadedHits];

    writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          subcategory,
          sector,
          searchTerm,
          totalHits: Math.max(totalHits, existingTotalHits),
          hits: mergedHits,
        },
        null,
        2,
      ),
    );

    const flaggedLow = mergedHits.length < FLAG_THRESHOLD;
    if (flaggedLow) flagged.push(subcategory);

    summary.push({
      subcategory,
      sector,
      searchTerm,
      slug,
      imagesCollected: mergedHits.length,
      totalHitsAvailable: Math.max(totalHits, existingTotalHits),
      folderPath: destDir,
      flaggedLowCount: flaggedLow,
    });

    writeSummaryCsv(summary);
  }

  writeSummaryCsv(summary);
  console.log(`\nDone. Summary written to ${SUMMARY_CSV}`);
  if (flagged.length > 0) {
    console.log(`\nFlagged (< ${FLAG_THRESHOLD} images collected): ${flagged.length}`);
    flagged.forEach((f) => console.log(`  - ${f}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
