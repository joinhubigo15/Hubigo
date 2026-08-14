import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolveSelection, listTiers, listSectors } from "./category-source";
import { CITIES, CITY_LABEL, MODE_CREDIT_COST, taskKey } from "./types";
import type { City, QueryTask, SearchMode } from "./types";
import { getCredits, submitScrape, pollUntilComplete, downloadJobCsv, RateLimitError, ConcurrencyLimitError, DailyLimitError, InvalidKeyError, GmapsScraperApiError } from "./api-client";
import { loadState, isCompleted, recordCompletion } from "./state";
import { appendLeadsToStaging, appendRunSummary, stagingPaths } from "./staging";
import { KeyPool, loadKeysFromEnv, loadCursor, saveCursor, recordLeftoverKeys, recordExhaustedKey, loadExhaustedKeysToday, recordRevokedKey, loadRevokedKeys } from "./key-pool";

const HELP = `
Hubigo Google Maps scraper — stages raw leads for later dedup/import. Never writes to production tables.

Usage:
  npx tsx scripts/gmaps-scraper/cli.ts [selection] --city <cities> --mode <plain|area> --max-credits <n> [options]

Selection (choose exactly one):
  --subcategory "Restaurant Database,Cafe Database"   Exact subcategory name(s), comma-separated
  --sector "Food & Beverage"                          One or more sectors, comma-separated (combines with --tier if both given)
  --tier "High,Medium"                                One or more density tiers, comma-separated. Known tiers: ${listTiers().join(", ")}
  --all-subcategories                                 Every subcategory in the sheet

Required:
  --city <bangalore|chennai|mumbai|hyderabad|all>[,...] Comma-separated, or "all"
  --mode <plain|area>                                 plain = 2 credits/query, area = 10 credits/query
  --max-credits <n>                                   Safety cap: this run stops before spending more than n credits

Options:
  --location "Koramangala, Bangalore"                 Location text appended to every query this run.
                                                        If omitted, defaults to the city name per selected city
                                                        (i.e. city-level granularity).
  --location-file <path>                               File of comma/newline-separated location strings (e.g. a
                                                        pincode list). One query per subcategory × city × location
                                                        in the file. Mutually exclusive with --location. If you pass
                                                        multiple --city values with a location file, every location
                                                        is queried against every city — use a single matching --city
                                                        for a city-specific list (e.g. a Bangalore pincode file).
  --depth <1-3>                                        Search depth per query, default 2 (docs cap this at 3 on
                                                        every plan — there is no higher "level").
  --start-key <n>                                       Start rotation at GMAPSSCRAPER_API_KEY<n> instead of key 1
                                                        (e.g. to skip a key you know is already rate-limited).
                                                        Without this, resumes wherever the last run left off.
  --key-range <start>-<end>                             Restrict rotation to only GMAPSSCRAPER_API_KEY<start>
                                                        through <end> inclusive (e.g. "801-810"), instead of the
                                                        full pool. Useful for testing concurrency against a known
                                                        block of fresh keys without touching the rest.
  --key-list <a,b,c,...>                                Restrict rotation to exactly these (non-contiguous) key
                                                        labels, e.g. "441,478,502". Mutually exclusive with
                                                        --key-range. See list-leftover-keys.ts for barely-used
                                                        keys worth sweeping into a dedicated block this way.
  --concurrency <n>                                      Run up to n queries in flight at once, default 1
                                                        (sequential). Pro plan's Batch Queue supports up to 10.
  --force                                              Re-run subcategory+city+location+mode combos already staged
  --dry-run                                            Print the planned queries and total credit cost, call nothing
  --help                                                Show this message

Multiple API keys: if GMAPSSCRAPER_API_KEY1, _KEY2, ... are set in backend/.env, a 429 rotates to
the next key automatically instead of stopping the run (falls back to a single GMAPSSCRAPER_API_KEY
if no numbered keys are set).

Location-file entries that look like a bare pincode get ", <City>, India" appended automatically
before being sent as the search query, to avoid the query resolving to a same-numbered postal code
in another country (this happened with a handful of Bangalore pincodes that also exist in Singapore).

Known sectors: ${listSectors().join(", ")}

Examples:
  --tier Low --city all --mode plain --max-credits 500 --dry-run
  --sector "Food & Beverage" --tier High --city bangalore --mode plain --max-credits 200
  --subcategory "Restaurant Database" --city bangalore --location "Koramangala, Bangalore" --mode area --max-credits 50
  --subcategory "Movie Theater Database" --city bangalore --location-file Bangalore_pincode.txt --mode plain --max-credits 300
`;

interface ParsedArgs {
  subcategory?: string;
  sector?: string;
  tier?: string;
  allSubcategories: boolean;
  city?: string;
  mode?: string;
  location?: string;
  locationFile?: string;
  maxCredits?: string;
  depth?: string;
  startKey?: string;
  keyRange?: string;
  keyList?: string;
  concurrency?: string;
  force: boolean;
  dryRun: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = { allSubcategories: false, force: false, dryRun: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const eqIndex = arg.indexOf("=");
    const flag = eqIndex !== -1 ? arg.slice(0, eqIndex) : arg;
    const inlineValue = eqIndex !== -1 ? arg.slice(eqIndex + 1) : undefined;
    const takeValue = () => (inlineValue !== undefined ? inlineValue : argv[++i]);

    switch (flag) {
      case "--subcategory":
        args.subcategory = takeValue();
        break;
      case "--sector":
        args.sector = takeValue();
        break;
      case "--tier":
        args.tier = takeValue();
        break;
      case "--all-subcategories":
        args.allSubcategories = true;
        break;
      case "--city":
        args.city = takeValue();
        break;
      case "--mode":
        args.mode = takeValue();
        break;
      case "--location":
        args.location = takeValue();
        break;
      case "--location-file":
        args.locationFile = takeValue();
        break;
      case "--max-credits":
        args.maxCredits = takeValue();
        break;
      case "--depth":
        args.depth = takeValue();
        break;
      case "--start-key":
        args.startKey = takeValue();
        break;
      case "--key-range":
        args.keyRange = takeValue();
        break;
      case "--key-list":
        args.keyList = takeValue();
        break;
      case "--concurrency":
        args.concurrency = takeValue();
        break;
      case "--force":
        args.force = true;
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${flag}`);
    }
  }
  return args;
}

/**
 * Splits on commas/newlines only (not all whitespace) so a multi-word location string
 * would survive intact if this is ever pointed at something other than a flat pincode list.
 */
function loadLocationsFromFile(filePath: string): string[] {
  const text = readFileSync(filePath, "utf-8");
  const locations = text
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (locations.length === 0) {
    throw new Error(`--location-file "${filePath}" contained no usable location entries.`);
  }
  return locations;
}

/**
 * A bare pincode is ambiguous across countries (a handful of Bangalore pincodes also exist in
 * Singapore, which caused a real contamination incident) — qualify it with city + country so the
 * search resolves unambiguously. Named locations (e.g. "Koramangala, Bangalore") already carry
 * their own context and are left as-is.
 */
function qualifyLocation(task: QueryTask): string {
  const isBarePincode = /^\d{4,7}$/.test(task.location);
  return isBarePincode ? `${task.location}, ${CITY_LABEL[task.city]}, India` : task.location;
}

function resolveCities(input: string): City[] {
  if (input.trim().toLowerCase() === "all") return CITIES;
  const requested = input.split(",").map((s) => s.trim().toLowerCase());
  const invalid = requested.filter((c) => !CITIES.includes(c as City));
  if (invalid.length > 0) {
    throw new Error(`Unknown city/cities: ${invalid.join(", ")}. Valid: ${CITIES.join(", ")}, or "all"`);
  }
  return requested as City[];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || process.argv.length <= 2) {
    console.log(HELP);
    return;
  }

  let keys = loadKeysFromEnv(process.env);

  if (args.keyRange !== undefined) {
    const match = /^(\d+)-(\d+)$/.exec(args.keyRange.trim());
    if (!match) {
      throw new Error(`--key-range must look like "801-810" (got "${args.keyRange}").`);
    }
    const rangeStart = Number(match[1]);
    const rangeEnd = Number(match[2]);
    if (rangeStart > rangeEnd) {
      throw new Error(`--key-range start (${rangeStart}) must be <= end (${rangeEnd}).`);
    }
    keys = keys.filter((k) => k.label >= rangeStart && k.label <= rangeEnd);
    if (keys.length === 0) {
      throw new Error(`--key-range ${args.keyRange} matched no loaded GMAPSSCRAPER_API_KEY<n>.`);
    }
    console.log(`Restricting rotation to keys #${rangeStart}-#${rangeEnd} (${keys.length} found).`);
  }

  if (args.keyList !== undefined) {
    if (args.keyRange !== undefined) {
      throw new Error("--key-range and --key-list are mutually exclusive — pick one.");
    }
    const labels = args.keyList
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => {
        const n = Number(s);
        if (!Number.isInteger(n)) throw new Error(`--key-list contains a non-integer label: "${s}"`);
        return n;
      });
    const labelSet = new Set(labels);
    keys = keys.filter((k) => labelSet.has(k.label));
    if (keys.length === 0) {
      throw new Error(`--key-list matched no loaded GMAPSSCRAPER_API_KEY<n>.`);
    }
    console.log(`Restricting rotation to keys ${labels.join(", ")} (${keys.length} found).`);
  }

  // Skip keys confirmed genuinely invalid/revoked (HTTP 401) — permanent until someone replaces
  // the key in .env, so unlike the daily cap this never expires and applies to every run.
  const revoked = new Set(loadRevokedKeys());
  if (revoked.size > 0) {
    const before = keys.length;
    const filtered = keys.filter((k) => !revoked.has(k.label));
    if (filtered.length > 0) {
      keys = filtered;
      console.log(`Skipping ${before - filtered.length} key(s) previously confirmed invalid/revoked.`);
    }
  }

  // Skip keys already confirmed genuinely out of their 1000/day quota today — no point spending an
  // attempt re-confirming what a prior process already found out. Keys only caught by transient
  // account-wide congestion are NOT in this list (that tracking is deliberately not persisted),
  // so this never wrongly skips a key that's actually still usable.
  const exhaustedToday = new Set(loadExhaustedKeysToday());
  if (exhaustedToday.size > 0) {
    const before = keys.length;
    const filtered = keys.filter((k) => !exhaustedToday.has(k.label));
    // Don't empty the pool over this — if every candidate key is marked exhausted (e.g. a small
    // --key-range that's entirely spent), proceed with the original list and let it fail/rotate
    // naturally rather than throwing "no keys found".
    if (filtered.length > 0) {
      keys = filtered;
      console.log(`Skipping ${before - filtered.length} key(s) already confirmed at their 1000/day cap today.`);
    }
  }

  // --start-key pins the starting point explicitly (and resets the saved cursor); otherwise resume
  // from wherever the last invocation left off, so a fresh process per city/subcategory doesn't
  // restart rotation at key 1 every time. With --key-range and no explicit --start-key, start at
  // the bottom of the range rather than resuming an unrelated cursor position from outside it.
  const explicitStartKey = args.startKey !== undefined ? Number(args.startKey) : undefined;
  if (explicitStartKey !== undefined && (!Number.isInteger(explicitStartKey) || !keys.some((k) => k.label === explicitStartKey))) {
    throw new Error(`--start-key ${args.startKey} does not match any loaded GMAPSSCRAPER_API_KEY<n>${args.keyRange ? " within --key-range" : ""}.`);
  }
  const cursorLabel = loadCursor();
  const cursorInRange = cursorLabel !== undefined && cursorLabel !== null && keys.some((k) => k.label === cursorLabel);
  const startLabel = explicitStartKey ?? (cursorInRange ? cursorLabel! : keys[0].label);
  const pool = new KeyPool(keys, startLabel);
  console.log(`Loaded ${keys.length} API key${keys.length === 1 ? "" : "s"} (starting on ${pool.currentLabel()}).`);

  let depth: number | undefined;
  if (args.depth !== undefined) {
    depth = Number(args.depth);
    if (!Number.isInteger(depth) || depth < 1 || depth > 3) {
      throw new Error('--depth must be an integer 1-3 (the API caps depth at 3 on every plan; there is no "level 5").');
    }
  }

  if (!args.mode || (args.mode !== "plain" && args.mode !== "area")) {
    throw new Error('--mode is required and must be "plain" or "area"');
  }
  const mode = args.mode as SearchMode;

  if (!args.city) {
    throw new Error("--city is required (bangalore/chennai/mumbai/hyderabad, comma-separated, or 'all')");
  }
  const cities = resolveCities(args.city);

  if (!args.maxCredits || Number.isNaN(Number(args.maxCredits)) || Number(args.maxCredits) <= 0) {
    throw new Error("--max-credits is required and must be a positive number");
  }
  const maxCredits = Number(args.maxCredits);

  const selectionCount = [args.subcategory, args.sector || args.tier, args.allSubcategories ? "x" : undefined].filter(
    Boolean,
  ).length;
  if (selectionCount === 0) {
    throw new Error("Pass one of --subcategory, --sector/--tier, or --all-subcategories. See --help.");
  }
  if (args.subcategory && (args.sector || args.tier)) {
    throw new Error("--subcategory can't be combined with --sector/--tier — pick one selection method.");
  }

  const categories = resolveSelection({
    subcategories: args.subcategory?.split(",").map((s) => s.trim()),
    sectors: args.sector?.split(",").map((s) => s.trim()),
    tiers: args.tier?.split(",").map((s) => s.trim()),
    all: args.allSubcategories,
  });

  if (categories.length === 0) {
    throw new Error("Selection matched 0 subcategories.");
  }

  if (args.location && args.locationFile) {
    throw new Error("--location and --location-file are mutually exclusive.");
  }
  const fileLocations = args.locationFile ? loadLocationsFromFile(args.locationFile) : null;

  // Build the full task list: every matched subcategory × every selected city × every location.
  const tasks: QueryTask[] = [];
  for (const category of categories) {
    for (const city of cities) {
      const locations = fileLocations ?? [args.location?.trim() || CITY_LABEL[city]];
      for (const location of locations) {
        tasks.push({ subcategory: category.subcategory, city, location, mode });
      }
    }
  }

  const creditCost = MODE_CREDIT_COST[mode];
  const state = loadState();
  const pending = tasks.filter((t) => args.force || !isCompleted(state, taskKey(t)));
  const skippedCount = tasks.length - pending.length;

  const locationsDesc = fileLocations ? ` × ${fileLocations.length} location(s) from file` : "";
  console.log(`Matched ${categories.length} subcategor${categories.length === 1 ? "y" : "ies"} × ${cities.length} cit${cities.length === 1 ? "y" : "ies"}${locationsDesc} = ${tasks.length} queries.`);
  if (skippedCount > 0) {
    console.log(`${skippedCount} already staged, skipping (pass --force to redo). ${pending.length} pending.`);
  }

  const plannedCost = pending.length * creditCost;
  console.log(`Mode: ${mode} (${creditCost} credits/query). Planned spend: ${plannedCost} credits.`);
  console.log(`Ledger total spent so far (all runs): ${state.totalCreditsSpent} credits.`);

  if (plannedCost > maxCredits) {
    const affordable = Math.floor(maxCredits / creditCost);
    console.log(
      `Planned spend (${plannedCost}) exceeds --max-credits (${maxCredits}). Only the first ${affordable} of ${pending.length} pending queries will run this pass. Re-run to continue — completed ones are skipped automatically.`,
    );
  }

  if (args.dryRun) {
    console.log("\n--dry-run: no API calls made. Planned queries:");
    for (const t of pending.slice(0, Math.floor(maxCredits / creditCost))) {
      console.log(`  [${t.mode}] "${t.subcategory}" in "${qualifyLocation(t)}" (${t.city})`);
    }
    return;
  }

  let liveCredits: number;
  while (true) {
    try {
      liveCredits = await getCredits(pool.current());
      break;
    } catch (err) {
      if (err instanceof InvalidKeyError) {
        recordRevokedKey(pool.currentLabelNumber());
        console.log(`${pool.currentLabel()} is invalid/revoked, recorded and rotating...`);
        if (pool.rotate()) continue;
      }
      if (err instanceof RateLimitError && pool.rotate()) {
        console.log(`Rate-limited on /credits, rotating to ${pool.currentLabel()}...`);
        continue;
      }
      saveCursor(pool.currentLabelNumber());
      throw err;
    }
  }
  console.log(`Live account balance on ${pool.currentLabel()}: ${liveCredits} credits.\n`);

  let spentThisRun = 0;
  let completedThisRun = 0;
  let nextIndex = 0;
  let stopRequested = false;
  let stopReason = "";

  const concurrency = Math.max(1, Math.min(Number(args.concurrency ?? 1) || 1, pending.length || 1));
  if (concurrency > 1) {
    console.log(`Running with concurrency ${concurrency} (up to ${concurrency} queries in flight at once).\n`);
  }

  async function runOne(task: QueryTask): Promise<void> {
    const searchQuery = `${task.subcategory.replace(/ Database$/, "")} in ${qualifyLocation(task)}`;
    const key = taskKey(task);
    console.log(`Querying: "${searchQuery}" [${task.mode}, ${task.city}] on ${pool.currentLabel()}...`);

    try {
      let jobId: string | undefined;
      let status;
      let csvText: string | undefined;
      // Covers submit, poll, AND download in one retry loop — a Cloudflare hiccup on the download
      // step is just as transient as one on submit, and deserves the same rotate-and-retry rather
      // than killing the whole run. A previously submitted jobId is reused across retries (no need
      // to resubmit) unless the retry happened before jobId was ever assigned.
      while (true) {
        try {
          if (jobId === undefined) {
            ({ jobId } = await submitScrape(pool.current(), { keyword: searchQuery, mode: task.mode, depth }));
          }
          if (status === undefined) {
            status = await pollUntilComplete(pool.current(), jobId);
          }
          if (status.status === "complete" && csvText === undefined) {
            csvText = await downloadJobCsv(pool.current(), jobId);
          }
          break;
        } catch (err) {
          if (err instanceof InvalidKeyError) {
            // Genuinely bad key (401), not a transient rejection — permanent until someone swaps
            // it in .env, so record it and rotate away rather than retrying or crashing the run.
            recordRevokedKey(pool.currentLabelNumber());
            console.log(`  ${pool.currentLabel()} is invalid/revoked, recorded and rotating...`);
            if (pool.rotate()) continue;
            throw err;
          }
          if (err instanceof DailyLimitError) {
            // Genuinely out of quota for today — confirmed via the exact "Daily request limit
            // exceeded" message, not a generic/account-wide rejection. Safe to write off for the
            // rest of today (unlike markDead(), which just means "got rejected once, probably
            // account-wide congestion, still has its full budget").
            recordExhaustedKey(pool.currentLabelNumber());
            console.log(`  ${pool.currentLabel()} genuinely hit its 1000/day cap — recorded, rotating.`);
            if (pool.rotate()) continue;
            throw err;
          }
          if (err instanceof RateLimitError || err instanceof ConcurrencyLimitError) {
            // Mark the key we were JUST on as dead before rotating off it. Distinct-dead-key
            // count (not consecutiveRotationCount) is what we abandon on — under concurrency>1,
            // several workers share one pool, so an unrelated worker's success on a different key
            // resets consecutiveRotations to 0 and can mask a block that's actually mostly dead
            // (observed: 9 of 10 keys confirmed dead yet consecutiveRotations never crossed 3).
            pool.markDead(pool.currentLabelNumber());

            // Don't grind through EVERY key in a small restricted block (e.g. --key-range 10
            // keys) one dead key at a time — but don't bail too early either, since a couple of
            // dead keys near the start of a block doesn't mean the whole block is bad. Check at
            // least 7 keys; if most of a 10-key block is confirmed dead, abandon the rest rather
            // than confirming every last one. The keys marked dead here got only 1-2 attempts
            // before being written off (that's the whole point of the fast-abandon threshold) —
            // nowhere near their real 1000/day quota — so record them (along with any never even
            // tried) into a leftover pool for a dedicated revisit block later, instead of letting
            // barely-touched keys quietly go unused.
            const abandonThreshold = pool.size() <= 20 ? Math.min(7, pool.size()) : Infinity;
            if (pool.deadKeyCount() >= abandonThreshold) {
              const barelyUsed = Array.from(new Set([...pool.deadKeyLabels(), ...pool.untestedLabels()])).sort((a, b) => a - b);
              if (barelyUsed.length > 0) {
                recordLeftoverKeys(barelyUsed);
                console.log(`  Barely-used keys in this block (rejected after only 1-2 tries, or never tried — saved for a later dedicated block): ${barelyUsed.join(", ")}`);
              }
              throw new RateLimitError(
                `${pool.deadKeyCount()} distinct keys in this block confirmed blocked/rate-limited — abandoning the rest instead of checking one by one.`,
              );
            }
            if (pool.rotate()) {
              console.log(`  ${pool.currentLabel()} ${err instanceof ConcurrencyLimitError ? "hit the concurrency cap" : "rate-limited"}, rotating to next key and retrying...`);
              continue;
            }
          }
          throw err;
        }
      }

      if (status!.status !== "complete") {
        appendRunSummary({
          timestamp: new Date().toISOString(),
          subcategory: task.subcategory,
          city: task.city,
          location: task.location,
          mode: task.mode,
          creditsSpent: creditCost,
          leadCount: 0,
          status: "failed",
          note: `Job ended with status "${status!.status}"`,
        });
        spentThisRun += creditCost;
        console.log(`  Job did not complete (status: ${status!.status}). Logged as failed, moving on.`);
        return;
      }

      const leadCount = appendLeadsToStaging(task, searchQuery, csvText!);
      pool.noteSuccess();

      recordCompletion(state, key, {
        timestamp: new Date().toISOString(),
        leadCount,
        creditsSpent: creditCost,
        jobId: jobId!,
      });
      appendRunSummary({
        timestamp: new Date().toISOString(),
        subcategory: task.subcategory,
        city: task.city,
        location: task.location,
        mode: task.mode,
        creditsSpent: creditCost,
        leadCount,
        status: "complete",
        note: `job ${jobId} via key #${pool.currentLabelNumber()}`,
      });

      spentThisRun += creditCost;
      completedThisRun++;
      console.log(`  Staged ${leadCount} leads. Credits spent this run: ${spentThisRun}/${maxCredits}.`);
    } catch (err) {
      if (err instanceof RateLimitError || err instanceof ConcurrencyLimitError || err instanceof InvalidKeyError) {
        stopRequested = true;
        stopReason = err.message;
        return;
      }
      const message = err instanceof GmapsScraperApiError ? err.message : String(err);
      appendRunSummary({
        timestamp: new Date().toISOString(),
        subcategory: task.subcategory,
        city: task.city,
        location: task.location,
        mode: task.mode,
        creditsSpent: 0,
        leadCount: 0,
        status: "failed",
        note: message,
      });
      console.error(`  Failed: ${message}. Logged and continuing.`);
    }
  }

  async function worker(): Promise<void> {
    while (true) {
      if (stopRequested) return;
      if (spentThisRun + creditCost > maxCredits) {
        stopRequested = true;
        stopReason = `next query would exceed --max-credits (${maxCredits})`;
        return;
      }
      const index = nextIndex;
      if (index >= pending.length) return;
      nextIndex += 1;
      await runOne(pending[index]);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  if (stopRequested) {
    console.log(`\nStopping: ${stopReason}. ${pending.length - completedThisRun} queries remain for a future run.`);
  }

  saveCursor(pool.currentLabelNumber());
  const paths = stagingPaths();
  console.log(`\nDone. ${completedThisRun} queries completed this run, ${spentThisRun} credits spent.`);
  console.log(`Cumulative ledger total (all runs): ${state.totalCreditsSpent} credits.`);
  console.log(`Staging CSV: ${paths.businessesCsv}`);
  console.log(`Run summary: ${paths.runSummaryCsv}`);
}

main().catch((err) => {
  console.error("\nFatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
