import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const API_KEY = process.env.PIXABAY_API_KEY?.trim();
if (!API_KEY) {
  throw new Error("PIXABAY_API_KEY missing from backend/.env");
}

const BASE_OUTPUT_DIR = path.join(
  __dirname,
  "output",
  "Final Images"
);

const TARGET_IMAGE_COUNT = 200;
const BADGE_COUNT = 3;

interface CategoryConfig {
  name: string;
  slug: string;
  sector: string;
  searchTerms: string[];
  badgeTerms: string[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    name: "Marketing Agency",
    slug: "marketing-agency",
    sector: "Professional Services",
    searchTerms: ["marketing agency", "digital marketing", "advertising agency", "marketing team office"],
    badgeTerms: ["marketing logo", "advertising badge", "digital marketing icon"],
  },
  {
    name: "Import and Export Service",
    slug: "import-and-export-service",
    sector: "Professional Services",
    searchTerms: ["import export", "freight cargo", "shipping container", "logistics trade"],
    badgeTerms: ["logistics badge", "cargo logo", "shipping icon"],
  },
  {
    name: "Borewell Contractor",
    slug: "borewell-contractor",
    sector: "Home Services",
    searchTerms: ["borewell drilling", "water well drilling", "drilling rig machine", "well contractor"],
    badgeTerms: ["drilling logo", "water well icon", "contractor badge"],
  },
  {
    name: "Security Service",
    slug: "security-service",
    sector: "Home Services",
    searchTerms: ["security guard", "security service", "surveillance security", "guard protection"],
    badgeTerms: ["security shield badge", "security guard icon", "protection badge"],
  },
  {
    name: "Packers and Movers",
    slug: "packers-and-movers",
    sector: "Home Services",
    searchTerms: ["moving truck", "moving company", "packers movers", "relocation packing boxes"],
    badgeTerms: ["moving company logo", "packers movers badge", "delivery truck icon"],
  },
  {
    name: "Civil Contractor",
    slug: "civil-contractor",
    sector: "Home Services",
    searchTerms: ["civil construction", "construction contractor", "building construction", "civil engineer site"],
    badgeTerms: ["construction logo", "builder badge", "civil engineering icon"],
  },
  {
    name: "Water Suppliers",
    slug: "water-suppliers",
    sector: "Home Services",
    searchTerms: ["water tanker truck", "water delivery", "water supply truck", "mineral water bottle supply"],
    badgeTerms: ["water drop badge", "water supply logo", "pure water icon"],
  },
  {
    name: "Doctor",
    slug: "doctor",
    sector: "Healthcare & Medical",
    searchTerms: ["doctor consultation", "medical doctor", "physician clinic", "doctor stethoscope"],
    badgeTerms: ["caduceus medical badge", "doctor clinic logo", "healthcare icon"],
  },
  {
    name: "Agricultural Products",
    slug: "agricultural-products",
    sector: "Retail Stores",
    searchTerms: ["agricultural products", "farm crops produce", "fertilizers seeds", "agriculture harvest"],
    badgeTerms: ["agriculture organic badge", "farm produce logo", "green leaf icon"],
  },
  {
    name: "Towing Service",
    slug: "towing-service",
    sector: "Automotive Services",
    searchTerms: ["tow truck", "towing service", "car towing truck", "roadside assistance tow"],
    badgeTerms: ["towing service logo", "tow truck badge", "roadside assistance icon"],
  },
];

const PER_PAGE = 200;
const DOWNLOAD_CONCURRENCY = 6;
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 90;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function searchPixabay(term: string, page: number): Promise<PixabayResponse | null> {
  const url =
    `https://pixabay.com/api/?key=${encodeURIComponent(API_KEY!)}` +
    `&q=${encodeURIComponent(term)}` +
    `&image_type=photo&safesearch=true&per_page=${PER_PAGE}&page=${page}`;

  for (let attempt = 1; attempt <= 6; attempt++) {
    await limiter.wait();
    try {
      const res = await fetch(url);
      if (res.status === 429 || res.status >= 500) {
        console.warn(`  [${res.status}] Server busy for "${term}", retrying in ${attempt * 3}s (attempt ${attempt})`);
        await sleep(3000 * attempt);
        continue;
      }
      if (!res.ok) {
        console.error(`  [error] Pixabay returned HTTP ${res.status} for term "${term}"`);
        return null;
      }
      return (await res.json()) as PixabayResponse;
    } catch (err) {
      console.error(`  [error] fetch failed: ${(err as Error).message}`);
      await sleep(3000 * attempt);
    }
  }
  return null;
}

async function searchPixabayVectorOrPhoto(term: string): Promise<PixabayHit[]> {
  const url =
    `https://pixabay.com/api/?key=${encodeURIComponent(API_KEY!)}` +
    `&q=${encodeURIComponent(term)}` +
    `&image_type=all&safesearch=true&per_page=50`;

  for (let attempt = 1; attempt <= 4; attempt++) {
    await limiter.wait();
    try {
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = (await res.json()) as PixabayResponse;
      return data.hits || [];
    } catch (err) {
      await sleep(2000 * attempt);
    }
  }
  return [];
}

async function downloadFile(urlStr: string, filepath: string): Promise<boolean> {
  if (existsSync(filepath)) return true;

  for (let attempt = 1; attempt <= 4; attempt++) {
    await limiter.wait();
    try {
      const res = await fetch(urlStr);
      if (!res.ok) return false;
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      writeFileSync(filepath, buffer);
      return true;
    } catch (err) {
      await sleep(1000 * attempt);
    }
  }
  return false;
}

async function runPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function processCategory(cat: CategoryConfig) {
  const catDir = path.join(BASE_OUTPUT_DIR, cat.slug);
  const badgesDir = path.join(catDir, "badges");
  
  if (!existsSync(catDir)) mkdirSync(catDir, { recursive: true });
  if (!existsSync(badgesDir)) mkdirSync(badgesDir, { recursive: true });

  console.log(`\n========================================`);
  console.log(`Processing: ${cat.name} (${cat.slug}) -> ${catDir}`);
  console.log(`========================================`);

  // 1. Fetch 200 Main Images
  const hitMap = new Map<number, PixabayHit>();

  for (const term of cat.searchTerms) {
    if (hitMap.size >= TARGET_IMAGE_COUNT * 2) break;
    console.log(`  Searching main term: "${term}"...`);

    for (let page = 1; page <= 3; page++) {
      const data = await searchPixabay(term, page);
      if (!data || !data.hits || data.hits.length === 0) break;

      for (const hit of data.hits) {
        if (!hitMap.has(hit.id)) {
          hitMap.set(hit.id, hit);
        }
      }

      if (data.hits.length < PER_PAGE) break;
      if (hitMap.size >= TARGET_IMAGE_COUNT * 2) break;
    }
  }

  const hits = Array.from(hitMap.values());
  const selectedHits = hits.slice(0, TARGET_IMAGE_COUNT);
  console.log(`  Found ${hits.length} candidates. Downloading up to ${TARGET_IMAGE_COUNT} images...`);

  let downloadedImages = 0;
  const downloadedHits: PixabayHit[] = [];

  await runPool(selectedHits, DOWNLOAD_CONCURRENCY, async (hit) => {
    const extMatch = hit.webformatURL.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
    const filepath = path.join(catDir, `${hit.id}.${ext}`);
    const success = await downloadFile(hit.webformatURL, filepath);
    if (success) {
      downloadedImages++;
      downloadedHits.push(hit);
    }
  });

  console.log(`  ✅ Saved ${downloadedImages} main images in ${cat.slug}`);

  // 2. Fetch 3 Badge Images
  console.log(`  Fetching ${BADGE_COUNT} badge images...`);
  const badgeHits: PixabayHit[] = [];
  const badgeIds = new Set<number>();

  for (const bTerm of cat.badgeTerms) {
    if (badgeHits.length >= BADGE_COUNT) break;
    const bHits = await searchPixabayVectorOrPhoto(bTerm);
    for (const bh of bHits) {
      if (!badgeIds.has(bh.id)) {
        badgeIds.add(bh.id);
        badgeHits.push(bh);
        if (badgeHits.length >= BADGE_COUNT) break;
      }
    }
  }

  let savedBadges = 0;
  for (let i = 0; i < Math.min(BADGE_COUNT, badgeHits.length); i++) {
    const bHit = badgeHits[i];
    const extMatch = bHit.webformatURL.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
    const badgePathInRoot = path.join(catDir, `badge_${i + 1}.${ext}`);
    const badgePathInSub = path.join(badgesDir, `badge_${i + 1}.${ext}`);
    
    const s1 = await downloadFile(bHit.webformatURL, badgePathInRoot);
    await downloadFile(bHit.webformatURL, badgePathInSub);
    if (s1) savedBadges++;
  }

  console.log(`  🏅 Saved ${savedBadges} badge images in ${cat.slug} (badge_1, badge_2, badge_3)`);

  // 3. Write manifest.json
  const manifestPath = path.join(catDir, "manifest.json");
  const manifestData = {
    subcategory: cat.name,
    slug: cat.slug,
    sector: cat.sector,
    totalImages: downloadedImages,
    totalBadges: savedBadges,
    searchTermsUsed: cat.searchTerms,
    images: downloadedHits.map((h) => ({ id: h.id, url: h.webformatURL, tags: h.tags })),
    badges: badgeHits.slice(0, BADGE_COUNT).map((h, i) => ({
      badgeNumber: i + 1,
      id: h.id,
      url: h.webformatURL,
      tags: h.tags,
    })),
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), "utf8");
}

async function main() {
  console.log(`🚀 Starting Pixabay Image Sourcing for 10 Requested Subcategories...`);
  console.log(`Target: 200 images + 3 badges per subcategory\n`);

  for (const cat of CATEGORIES) {
    try {
      await processCategory(cat);
    } catch (err) {
      console.error(`❌ Error processing category ${cat.name}:`, err);
    }
  }

  console.log(`\n🎉 All 10 Subcategories Sourced and Saved Successfully!`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
