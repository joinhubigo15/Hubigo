import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { resolveSelection } from "./gmaps-scraper/category-source";

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const DEFAULT_INPUT = resolve(__dirname, "../Bangalore_pincode.txt");
const DEFAULT_OUTPUT = resolve(__dirname, "../google-place-ids-bangalore.json");
const DEFAULT_DELAY_MS = 1_000;
const DEFAULT_CATEGORY_OUTPUT = resolve(__dirname, "../google-place-ids-bangalore.json");

type PlacesResponse = {
  places?: Array<{ id?: string }>;
  nextPageToken?: string;
};

type PlaceIdLead = {
  category: string;
  subcategory: string;
  place_id: string;
};

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function parsePincodes(inputPath: string): string[] {
  const contents = readFileSync(inputPath, "utf8");
  return [...new Set(contents.split(/[\s,]+/).map((value) => value.trim()).filter(Boolean))];
}

function parseArgs(argv: string[]): { input: string; output: string; delayMs: number; maxPincodes?: number; startQuery: number; maxQueries?: number; subcategory?: string; allSubcategories: boolean } {
  const options = {
    input: DEFAULT_INPUT,
    output: DEFAULT_CATEGORY_OUTPUT,
    delayMs: DEFAULT_DELAY_MS,
    maxPincodes: undefined as number | undefined,
    maxQueries: undefined as number | undefined,
    startQuery: 0,
    subcategory: undefined as string | undefined,
    allSubcategories: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const [flag, inlineValue] = argument.split("=", 2);
    const valueFor = () => inlineValue ?? argv[++index];
    if (flag === "--input") options.input = resolve(valueFor());
    else if (flag === "--output") options.output = resolve(valueFor());
    else if (flag === "--delay-ms") options.delayMs = Number(valueFor());
    else if (flag === "--max-pincodes") options.maxPincodes = Number(valueFor());
    else if (flag === "--max-queries") options.maxQueries = Number(valueFor());
    else if (flag === "--start-query") options.startQuery = Number(valueFor());
    else if (flag === "--subcategory") options.subcategory = valueFor();
    else if (flag === "--all-subcategories") options.allSubcategories = true;
    else if (flag === "--help" || flag === "-h") {
      console.log("Usage: npm run scrape:google-place-ids -- --all-subcategories [--input path] [--output path] [--delay-ms 1000] [--max-pincodes n]");
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!Number.isFinite(options.delayMs) || options.delayMs < 1_000) {
    throw new Error("--delay-ms must be at least 1000 ms to keep requests below 1 QPS.");
  }
  if (options.maxPincodes !== undefined && (!Number.isInteger(options.maxPincodes) || options.maxPincodes < 1)) {
    throw new Error("--max-pincodes must be a positive integer.");
  }
  if (options.maxQueries !== undefined && (!Number.isInteger(options.maxQueries) || options.maxQueries < 1)) {
    throw new Error("--max-queries must be a positive integer.");
  }
  if (!Number.isInteger(options.startQuery) || options.startQuery < 0) {
    throw new Error("--start-query must be a non-negative integer.");
  }
  if (!options.allSubcategories && !options.subcategory) {
    throw new Error("Choose --all-subcategories or pass --subcategory.");
  }
  return options;
}

async function searchPlaceIds(apiKey: string, query: string, delayMs: number): Promise<string[]> {
  let pageToken: string | undefined;
  const placeIds: string[] = [];

  do {
    const response = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,nextPageToken",
      },
      body: JSON.stringify({ textQuery: query, ...(pageToken ? { pageToken } : {}) }),
    });

    if (!response.ok) {
      const message = await response.text();
      const error = new Error(`Google Places request failed (${response.status}): ${message}`);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    const body = (await response.json()) as PlacesResponse;
    for (const place of body.places ?? []) {
      if (place.id) placeIds.push(place.id);
    }
    pageToken = body.nextPageToken;
    if (pageToken) await sleep(delayMs);
  } while (pageToken);

  return placeIds;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_MAP_API_KEY;
  if (!apiKey) throw new Error("Set GOOGLE_MAPS_API_KEY in backend/.env before running this script.");
  if (!existsSync(options.input)) throw new Error(`Input file not found: ${options.input}`);

  const pincodes = parsePincodes(options.input).slice(0, options.maxPincodes);
  const categories = resolveSelection({
    all: options.allSubcategories,
    subcategories: options.subcategory?.split(","),
  });
  const leads = new Map<string, PlaceIdLead>();
  if (existsSync(options.output)) {
    const existing = JSON.parse(readFileSync(options.output, "utf8")) as PlaceIdLead[];
    for (const lead of existing) {
      leads.set(`${lead.category}\u0000${lead.subcategory}\u0000${lead.place_id}`, lead);
    }
  }
  let completed = options.startQuery;
  let queryIndex = 0;

  for (const category of categories) {
    for (const pincode of pincodes) {
      if (queryIndex < options.startQuery) {
        queryIndex += 1;
        continue;
      }
      if (options.maxQueries !== undefined && completed >= options.maxQueries) {
        writeFileSync(options.output, `${JSON.stringify([...leads.values()], null, 2)}\n`);
        console.log(`Reached query limit of ${options.maxQueries}; ${leads.size} leads saved.`);
        return;
      }
      let attempt = 0;
      while (true) {
        try {
          const ids = await searchPlaceIds(apiKey, `${category.subcategory} in ${pincode}, Bangalore, Karnataka, India`, options.delayMs);
          for (const placeId of ids) {
            const lead = { category: category.sector, subcategory: category.subcategory, place_id: placeId };
            leads.set(`${lead.category}\u0000${lead.subcategory}\u0000${lead.place_id}`, lead);
          }
          completed += 1;
          writeFileSync(options.output, `${JSON.stringify([...leads.values()], null, 2)}\n`);
          console.log(`${completed}/${categories.length * pincodes.length} queries; ${leads.size} leads`);
          break;
        } catch (error) {
          const status = (error as Error & { status?: number }).status;
          if ((status !== 429 && (status === undefined || status < 500)) || attempt >= 6) throw error;
          const waitMs = Math.min(options.delayMs * 2 ** attempt, 60_000);
          attempt += 1;
          console.warn(`Google rate limit/server error; retrying in ${waitMs} ms.`);
          await sleep(waitMs);
        }
      }
      queryIndex += 1;
      await sleep(options.delayMs);
    }
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});