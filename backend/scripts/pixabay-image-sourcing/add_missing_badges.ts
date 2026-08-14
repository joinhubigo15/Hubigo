import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const API_KEY = process.env.PIXABAY_API_KEY?.trim();
if (!API_KEY) {
  throw new Error("PIXABAY_API_KEY missing from backend/.env");
}

const BASE_OUTPUT_DIR = path.join(__dirname, "output", "Final Images");

const TARGET_EARLIER_SLUGS: { slug: string; name: string; terms: string[] }[] = [
  {
    slug: "driving-school",
    name: "Driving School",
    terms: ["driving school logo badge", "steering wheel badge icon", "driving instructor logo"],
  },
  {
    slug: "computer-repair-shop",
    name: "Computer Repair Shop",
    terms: ["computer repair badge", "laptop service logo icon", "pc repair logo"],
  },
  {
    slug: "refrigerator-repair-service",
    name: "Refrigerator Repair Service",
    terms: ["fridge repair badge", "refrigerator service logo", "appliance repair icon"],
  },
  {
    slug: "ro-and-geyser-repair-service",
    name: "RO and Geyser Repair Service",
    terms: ["water filter repair logo", "geyser repair badge", "water purifier icon"],
  },
  {
    slug: "nutritionist",
    name: "Nutritionist",
    terms: ["nutritionist badge logo", "dietician icon logo", "healthy food badge"],
  },
];

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
  webformatURL: string;
  tags: string;
}

interface PixabayResponse {
  hits: PixabayHit[];
}

async function searchPixabayBadge(term: string): Promise<PixabayHit[]> {
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

async function main() {
  console.log(`🚀 Adding Badge Images (badge_1, badge_2, badge_3) to earlier subcategories...\n`);

  for (const item of TARGET_EARLIER_SLUGS) {
    const catDir = path.join(BASE_OUTPUT_DIR, item.slug);
    const badgesDir = path.join(catDir, "badges");
    if (!existsSync(catDir)) {
      console.warn(`  ⚠️ Directory missing: ${catDir}`);
      continue;
    }
    if (!existsSync(badgesDir)) mkdirSync(badgesDir, { recursive: true });

    console.log(`Processing Badges for: ${item.name} (${item.slug})...`);

    const badgeHits: PixabayHit[] = [];
    const seenIds = new Set<number>();

    for (const term of item.terms) {
      if (badgeHits.length >= 3) break;
      const hits = await searchPixabayBadge(term);
      for (const h of hits) {
        if (!seenIds.has(h.id)) {
          seenIds.add(h.id);
          badgeHits.push(h);
          if (badgeHits.length >= 3) break;
        }
      }
    }

    let saved = 0;
    for (let i = 0; i < Math.min(3, badgeHits.length); i++) {
      const hit = badgeHits[i];
      const extMatch = hit.webformatURL.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i);
      const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
      const badgePathInRoot = path.join(catDir, `badge_${i + 1}.${ext}`);
      const badgePathInSub = path.join(badgesDir, `badge_${i + 1}.${ext}`);

      const ok1 = await downloadFile(hit.webformatURL, badgePathInRoot);
      await downloadFile(hit.webformatURL, badgePathInSub);
      if (ok1) saved++;
    }

    // Update manifest if it exists
    const manifestPath = path.join(catDir, "manifest.json");
    let manifestData: any = {};
    if (existsSync(manifestPath)) {
      try {
        manifestData = JSON.parse(readFileSync(manifestPath, "utf8"));
      } catch (e) {}
    }
    manifestData.subcategory = manifestData.subcategory || item.name;
    manifestData.slug = manifestData.slug || item.slug;
    manifestData.totalBadges = saved;
    manifestData.badges = badgeHits.slice(0, 3).map((h, idx) => ({
      badgeNumber: idx + 1,
      id: h.id,
      url: h.webformatURL,
      tags: h.tags,
    }));
    manifestData.updatedAt = new Date().toISOString();
    writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), "utf8");

    console.log(`  🏅 Saved ${saved} badge images in ${item.slug} (badge_1, badge_2, badge_3)\n`);
  }

  console.log(`🎉 Badges successfully added to all earlier subcategories!`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
