import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PINCODES_PATH = resolve(__dirname, "../Bangalore_pincode.txt");
const OUTPUT_PATH = resolve(__dirname, "../google-place-ids-bangalore.json");
const STATE_PATH = resolve(__dirname, "../google-place-ids-healthcare-state.json");
const TAXONOMY_PATH = resolve(__dirname, "healthcare-taxonomy.json");

type PlaceIdLead = {
  category: string;
  subcategory: string;
  place_id: string;
};

type TaxonomyItem = {
  category: string;
  subcategory: string;
  pdf_section?: string;
};

type PlacesResponse = {
  places?: Array<{ id?: string }>;
  nextPageToken?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

class RateLimiter {
  private timestamps: number[] = [];
  private maxPerMinute: number;

  constructor(maxPerMinute: number) {
    this.maxPerMinute = maxPerMinute;
  }

  async acquire(): Promise<void> {
    if (this.maxPerMinute <= 0) return;
    while (true) {
      const now = Date.now();
      this.timestamps = this.timestamps.filter((t) => now - t < 60000);
      if (this.timestamps.length < this.maxPerMinute) {
        this.timestamps.push(now);
        return;
      }
      const oldest = this.timestamps[0];
      const waitMs = Math.max(50, 60000 - (now - oldest) + 10);
      await sleep(waitMs);
    }
  }
}

function parsePincodes(inputPath: string): string[] {
  const contents = readFileSync(inputPath, "utf8");
  return [...new Set(contents.split(/[\s,]+/).map((v) => v.trim()).filter(Boolean))];
}

// Target subcategory search terms requested by user
const TARGET_PATTERNS = [
  "Psychiatry Clinic",
  "Counseling Center",
  "Mental Health Clinic",
  "Child Psychologist",
  "Alcohol Rehabilitation Center",
  "IVF Center",
  "IVF Clinic",
  "IVF Hospital",
  "Women's Hospital",
  "Women’s Hospital",
  "Women's Health Clinic",
  "Women’s Health Clinic",
  "Prenatal Care Center",
  "Postnatal Care Center",
  "High Risk Pregnancy Center",
  "Eye Clinic",
  "Cataract Surgery Center",
  "Eye Laser Center",
  "Pediatric Eye Clinic",
  "Diabetic Eye Clinic"
];

async function searchPlaceIds(apiKey: string, query: string, rateLimiter: RateLimiter): Promise<string[]> {
  let pageToken: string | undefined;
  const placeIds: string[] = [];

  do {
    let attempts = 0;
    let response: Response;
    while (true) {
      await rateLimiter.acquire();
      try {
        response = await fetch(SEARCH_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "places.id,nextPageToken",
          },
          body: JSON.stringify({
            textQuery: query,
            ...(pageToken ? { pageToken } : {}),
          }),
        });

        if (response.status === 429 || response.status >= 500) {
          attempts++;
          const backoff = Math.min(2000 * 2 ** attempts, 30000);
          console.warn(`[Places API] Status ${response.status} for query "${query}". Retrying in ${backoff}ms (attempt ${attempts})...`);
          await sleep(backoff);
          continue;
        }
        break;
      } catch (err) {
        attempts++;
        const backoff = Math.min(2000 * 2 ** attempts, 30000);
        console.warn(`[Fetch error] ${err}. Retrying in ${backoff}ms (attempt ${attempts})...`);
        await sleep(backoff);
      }
    }

    if (!response.ok) {
      const message = await response.text();
      console.error(`[Error ${response.status}] ${message}`);
      break;
    }

    const body = (await response.json()) as PlacesResponse;
    if (body.places) {
      for (const p of body.places) {
        if (p.id) placeIds.push(p.id);
      }
    }
    pageToken = body.nextPageToken;
    if (pageToken) await sleep(300);
  } while (pageToken);

  return placeIds;
}

async function main(): Promise<void> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAP_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY not found in environment.");
  }

  const pincodes = parsePincodes(PINCODES_PATH);
  const taxonomy: TaxonomyItem[] = JSON.parse(readFileSync(TAXONOMY_PATH, "utf8"));

  // Identify taxonomy subcategories matching target patterns
  const targetSubcatItems = taxonomy.filter((item) =>
    TARGET_PATTERNS.some(
      (pat) => item.subcategory.toLowerCase() === pat.toLowerCase() || item.subcategory.toLowerCase().includes(pat.toLowerCase())
    )
  );

  const targetSubcatNames = [...new Set(targetSubcatItems.map((item) => item.subcategory))];
  console.log(`Matched ${targetSubcatNames.length} target subcategories for rescraping:`);
  targetSubcatNames.forEach((name, i) => console.log(`  ${i + 1}. ${name}`));

  // Load existing leads
  const leadsMap = new Map<string, PlaceIdLead>();
  if (existsSync(OUTPUT_PATH)) {
    const existing: PlaceIdLead[] = JSON.parse(readFileSync(OUTPUT_PATH, "utf8"));
    for (const lead of existing) {
      leadsMap.set(`${lead.category}\u0000${lead.subcategory}\u0000${lead.place_id}`, lead);
    }
    console.log(`Loaded ${leadsMap.size} existing leads from ${OUTPUT_PATH}`);
  }

  // Load state ledger
  let stateSet = new Set<string>();
  if (existsSync(STATE_PATH)) {
    const stateList: string[] = JSON.parse(readFileSync(STATE_PATH, "utf8"));
    stateSet = new Set(stateList);
    console.log(`Loaded ${stateSet.size} completed state queries.`);
  }

  // Remove target subcategories from state set to force rescraping
  let removedStateCount = 0;
  targetSubcatNames.forEach((subName) => {
    pincodes.forEach((pincode) => {
      const key = `${subName}::${pincode}`;
      if (stateSet.has(key)) {
        stateSet.delete(key);
        removedStateCount++;
      }
    });
  });
  console.log(`Cleared ${removedStateCount} state entries for target subcategories to re-enable scraping.`);

  // Build work items
  type WorkItem = {
    category: string;
    subcategory: string;
    pincode: string;
    queryKey: string;
    queryString: string;
  };

  const workItems: WorkItem[] = [];
  for (const item of targetSubcatItems) {
    for (const pincode of pincodes) {
      const queryKey = `${item.subcategory}::${pincode}`;
      workItems.push({
        category: item.category,
        subcategory: item.subcategory,
        pincode,
        queryKey,
        queryString: `${item.subcategory} in ${pincode}, Bangalore, Karnataka, India`,
      });
    }
  }

  console.log(`\nTotal queries to execute: ${workItems.length} (${targetSubcatNames.length} subcategories × ${pincodes.length} pincodes)`);

  const rateLimiter = new RateLimiter(500); // 500 QPM
  const concurrency = 8;
  let completedCount = 0;
  const initialLeadsSize = leadsMap.size;

  const saveIntervalMs = 15000;
  let lastSaveTime = Date.now();

  function flushState() {
    writeFileSync(OUTPUT_PATH, JSON.stringify(Array.from(leadsMap.values()), null, 2));
    writeFileSync(STATE_PATH, JSON.stringify(Array.from(stateSet), null, 2));
  }

  // Process work items in parallel queue
  async function worker(queue: WorkItem[]) {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;

      try {
        const placeIds = await searchPlaceIds(apiKey, item.queryString, rateLimiter);
        for (const pid of placeIds) {
          const key = `${item.category}\u0000${item.subcategory}\u0000${pid}`;
          if (!leadsMap.has(key)) {
            leadsMap.set(key, {
              category: item.category,
              subcategory: item.subcategory,
              place_id: pid,
            });
          }
        }
        stateSet.add(item.queryKey);
      } catch (err) {
        console.error(`Error executing ${item.queryKey}:`, err);
      }

      completedCount++;
      if (completedCount % 50 === 0 || completedCount === workItems.length) {
        console.log(`Progress: ${completedCount}/${workItems.length} queries completed | Total Leads: ${leadsMap.size} (+${leadsMap.size - initialLeadsSize} new)`);
      }

      if (Date.now() - lastSaveTime > saveIntervalMs) {
        flushState();
        lastSaveTime = Date.now();
      }
    }
  }

  const queue = [...workItems];
  const workers = Array.from({ length: concurrency }, () => worker(queue));
  await Promise.all(workers);

  flushState();

  console.log(`\n==============================================`);
  console.log(`RE-SCRAPING COMPLETE!`);
  console.log(`Queries processed: ${completedCount}/${workItems.length}`);
  console.log(`Initial leads count: ${initialLeadsSize}`);
  console.log(`Final leads count: ${leadsMap.size}`);
  console.log(`New leads added: ${leadsMap.size - initialLeadsSize}`);
  console.log(`==============================================\n`);

  // Print results per target subcategory
  const subcatCounts: Record<string, number> = {};
  for (const lead of leadsMap.values()) {
    subcatCounts[lead.subcategory] = (subcatCounts[lead.subcategory] || 0) + 1;
  }

  console.log(`--- Rescraped Subcategories Lead Summary ---`);
  targetSubcatNames.forEach((name, i) => {
    console.log(`${i + 1}. ${name}: ${subcatCounts[name] || 0} leads`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
