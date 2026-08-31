import "dotenv/config";
import { readFileSync, writeFileSync, existsSync, renameSync } from "node:fs";
import { resolve } from "node:path";

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const DEFAULT_INPUT = resolve(__dirname, "../Bangalore_pincode.txt");
const DEFAULT_OUTPUT = resolve(__dirname, "../google-place-ids-bangalore.json");
const DEFAULT_STATE = resolve(__dirname, "../google-place-ids-healthcare-state.json");
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

function parseArgs(argv: string[]) {
  const options = {
    input: DEFAULT_INPUT,
    output: DEFAULT_OUTPUT,
    stateFile: DEFAULT_STATE,
    concurrency: 5,
    delayMs: 200,
    maxQpm: 550,
    maxQueries: undefined as number | undefined,
    startQuery: 0,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const [flag, inlineVal] = arg.split("=", 2);
    const getVal = () => inlineVal ?? argv[++i];

    if (flag === "--input") options.input = resolve(getVal());
    else if (flag === "--output") options.output = resolve(getVal());
    else if (flag === "--state-file") options.stateFile = resolve(getVal());
    else if (flag === "--concurrency") options.concurrency = Number(getVal());
    else if (flag === "--delay-ms") options.delayMs = Number(getVal());
    else if (flag === "--max-qpm" || flag === "--queries-per-min") options.maxQpm = Number(getVal());
    else if (flag === "--max-queries") options.maxQueries = Number(getVal());
    else if (flag === "--start-query") options.startQuery = Number(getVal());
    else if (flag === "--dry-run") options.dryRun = true;
    else if (flag === "--help" || flag === "-h") {
      console.log(`
Usage: npx tsx scripts/scrape-healthcare-place-ids.ts [options]

Options:
  --input <path>        Path to pincodes file (default: backend/Bangalore_pincode.txt)
  --output <path>       Path to output JSON file (default: backend/google-place-ids-bangalore.json)
  --state-file <path>   Path to state file for resume capability (default: backend/google-place-ids-healthcare-state.json)
  --concurrency <n>     Number of parallel worker tasks (default: 5)
  --delay-ms <n>        Delay between paginations/retries in ms (default: 200)
  --max-qpm <n>         Max queries per minute limit (default: 550)
  --max-queries <n>     Stop after n queries
  --dry-run             Run test queries without saving full output
      `);
      process.exit(0);
    }
  }

  return options;
}

async function searchPlaceIds(apiKey: string, query: string, delayMs: number): Promise<string[]> {
  let pageToken: string | undefined;
  const placeIds: string[] = [];

  do {
    let attempts = 0;
    let response: Response;
    while (true) {
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
        console.warn(`[Places API] Rate limit/Server error (${response.status}). Retrying in ${backoff}ms...`);
        await sleep(backoff);
        continue;
      }
      break;
    }

    if (!response.ok) {
      const message = await response.text();
      const error = new Error(`Google Places API error (${response.status}): ${message}`);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    const body = (await response.json()) as PlacesResponse;
    if (body.places) {
      for (const p of body.places) {
        if (p.id) placeIds.push(p.id);
      }
    }
    pageToken = body.nextPageToken;
    if (pageToken) await sleep(delayMs);
  } while (pageToken);

  return placeIds;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  const rawApiKey = process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_MAP_API_KEY;
  if (!rawApiKey) {
    throw new Error("Set GOOGLE_MAPS_API_KEY in backend/.env before running.");
  }
  const apiKey: string = rawApiKey;

  if (!existsSync(opts.input)) throw new Error(`Input pincodes file not found: ${opts.input}`);
  if (!existsSync(TAXONOMY_PATH)) throw new Error(`Taxonomy file not found: ${TAXONOMY_PATH}`);

  const pincodes = parsePincodes(opts.input);
  const taxonomy: TaxonomyItem[] = JSON.parse(readFileSync(TAXONOMY_PATH, "utf8"));

  console.log(`Loaded ${taxonomy.length} healthcare subcategories and ${pincodes.length} pincodes.`);
  const totalWorkload = taxonomy.length * pincodes.length;
  console.log(`Total workload: ${totalWorkload} queries.`);

  // Load existing output leads
  const leadsMap = new Map<string, PlaceIdLead>();
  if (existsSync(opts.output)) {
    try {
      const existing: PlaceIdLead[] = JSON.parse(readFileSync(opts.output, "utf8"));
      for (const lead of existing) {
        leadsMap.set(`${lead.category}\u0000${lead.subcategory}\u0000${lead.place_id}`, lead);
      }
      console.log(`Loaded ${leadsMap.size} existing leads from ${opts.output}`);
    } catch (e) {
      console.warn(`Failed to parse existing output file; starting fresh:`, e);
    }
  }

  // Load state ledger (completed queries)
  const completedQueries = new Set<string>();
  if (existsSync(opts.stateFile)) {
    try {
      const stateList: string[] = JSON.parse(readFileSync(opts.stateFile, "utf8"));
      for (const q of stateList) completedQueries.add(q);
      console.log(`Loaded ${completedQueries.size} completed queries from state file.`);
    } catch (e) {
      console.warn(`Failed to parse state file; starting fresh state.`);
    }
  }

  // Build query list
  type WorkItem = {
    category: string;
    subcategory: string;
    pincode: string;
    queryKey: string;
    queryString: string;
  };

  const workItems: WorkItem[] = [];
  for (const item of taxonomy) {
    for (const pincode of pincodes) {
      const queryKey = `${item.subcategory}::${pincode}`;
      if (!completedQueries.has(queryKey)) {
        workItems.push({
          category: item.category,
          subcategory: item.subcategory,
          pincode,
          queryKey,
          queryString: `${item.subcategory} in ${pincode}, Bangalore, Karnataka, India`,
        });
      }
    }
  }

  console.log(`Remaining queries to execute: ${workItems.length} (Skipped ${totalWorkload - workItems.length} already completed).`);

  if (opts.dryRun) {
    console.log("DRY RUN MODE: Testing first 5 queries...");
    const sample = workItems.slice(0, 5);
    for (const item of sample) {
      console.log(`[DRY RUN] Executing query: "${item.queryString}"`);
      const ids = await searchPlaceIds(apiKey, item.queryString, opts.delayMs);
      console.log(` -> Found ${ids.length} place IDs:`, ids.slice(0, 3));
    }
    console.log("Dry run finished successfully.");
    return;
  }

  if (workItems.length === 0) {
    console.log("All queries are already complete!");
    return;
  }

  const itemsToProcess = opts.maxQueries ? workItems.slice(0, opts.maxQueries) : workItems;
  let finishedCount = 0;
  let newLeadsFound = 0;
  const startTime = Date.now();

  const saveProgress = () => {
    const leadsArray = Array.from(leadsMap.values());
    const tempOutput = `${opts.output}.tmp`;
    const tempState = `${opts.stateFile}.tmp`;

    writeFileSync(tempOutput, JSON.stringify(leadsArray, null, 2) + "\n");
    renameSync(tempOutput, opts.output);

    writeFileSync(tempState, JSON.stringify(Array.from(completedQueries), null, 2) + "\n");
    renameSync(tempState, opts.stateFile);
  };

  const rateLimiter = new RateLimiter(opts.maxQpm);
  if (opts.maxQpm > 0) {
    console.log(`Rate limit set to max ${opts.maxQpm} queries per minute.`);
  }

  // Run with concurrency worker queue
  let currentIndex = 0;

  async function worker(workerId: number): Promise<void> {
    while (currentIndex < itemsToProcess.length) {
      const idx = currentIndex++;
      const item = itemsToProcess[idx];

      let attempts = 0;
      while (true) {
        try {
          await rateLimiter.acquire();
          const placeIds = await searchPlaceIds(apiKey, item.queryString, opts.delayMs);
          for (const pid of placeIds) {
            const lead: PlaceIdLead = {
              category: item.category,
              subcategory: item.subcategory,
              place_id: pid,
            };
            const key = `${lead.category}\u0000${lead.subcategory}\u0000${lead.place_id}`;
            if (!leadsMap.has(key)) {
              leadsMap.set(key, lead);
              newLeadsFound++;
            }
          }

          completedQueries.add(item.queryKey);
          finishedCount++;

          if (finishedCount % 50 === 0 || finishedCount === itemsToProcess.length) {
            saveProgress();
            const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
            const qps = (finishedCount / (Date.now() - startTime) * 1000).toFixed(2);
            console.log(
              `[Progress] ${finishedCount}/${itemsToProcess.length} queries finished (${elapsedSec}s, ${qps} QPS) | Total unique leads: ${leadsMap.size} (+${newLeadsFound} new)`
            );
          }
          break;
        } catch (err) {
          const status = (err as Error & { status?: number }).status;
          attempts++;
          if (status === 429 || (status !== undefined && status >= 500)) {
            const backoff = Math.min(opts.delayMs * 2 ** attempts, 15000);
            console.warn(`[Worker ${workerId}] Rate limit/Server error (${status}). Retrying in ${backoff}ms...`);
            await sleep(backoff);
          } else {
            console.error(`[Worker ${workerId}] Permanent error on query "${item.queryString}":`, err);
            completedQueries.add(item.queryKey);
            finishedCount++;
            break;
          }
        }
      }

      await sleep(opts.delayMs);
    }
  }

  const workers: Promise<void>[] = [];
  const activeWorkers = Math.min(opts.concurrency, itemsToProcess.length);
  console.log(`Starting ${activeWorkers} concurrent workers...`);
  for (let w = 0; w < activeWorkers; w++) {
    workers.push(worker(w + 1));
  }

  await Promise.all(workers);
  saveProgress();

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Scraping finished in ${totalTimeSec}s! Total saved leads in output: ${leadsMap.size}`);
}

main().catch((err) => {
  console.error("Fatal scraper error:", err);
  process.exit(1);
});
