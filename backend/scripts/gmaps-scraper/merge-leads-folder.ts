/** One-off: merges the 21 usable manually-downloaded files from C:/Hubigo/Leads into staging. Delete after use. */
import { readFileSync } from "node:fs";
import { appendLeadsToStaging, appendRunSummary } from "./staging";
import { loadState, isCompleted, recordCompletion } from "./state";
import { taskKey } from "./types";
import type { QueryTask } from "./types";

const LEADS_DIR = "C:/Hubigo/Leads";

// One file per pincode, preferring the plain (non-"(1)" duplicate) copy. The one file that
// covers three pincodes in a single combined search is used for all three — its rows can't be
// split back out per-pincode, so all three are marked complete against that one job/file.
const PLAN: { file: string; pincodes: string[] }[] = [
  { file: "leads-movie_theatre_-_560068.csv", pincodes: ["560068"] },
  { file: "leads-Movie_Theater_-_560069.csv", pincodes: ["560069"] },
  { file: "leads-movie_theatre_-_560070.csv", pincodes: ["560070"] },
  { file: "leads-movie_theatre_-_560071.csv", pincodes: ["560071"] },
  { file: "leads-movie_theatre_-_560072.csv", pincodes: ["560072"] },
  { file: "leads-movie_theatre_-_560073.csv", pincodes: ["560073"] },
  { file: "leads-movie_theatre_-_560074_560075_560076_.csv", pincodes: ["560074", "560075", "560076"] },
  { file: "leads-Movie_Theater_-_560102.csv", pincodes: ["560102"] },
  { file: "leads-Movie_Theater_-_560103.csv", pincodes: ["560103"] },
  { file: "leads-Movie_Theater_-_560104.csv", pincodes: ["560104"] },
  { file: "leads-Movie_Theater_-_560105.csv", pincodes: ["560105"] },
  { file: "leads-Movie_Theater_-_560106.csv", pincodes: ["560106"] },
  { file: "leads-Movie_Theater_-_560107.csv", pincodes: ["560107"] },
  { file: "leads-Movie_Theater_-_560108.csv", pincodes: ["560108"] },
  { file: "leads-Movie_Theater_-_560109.csv", pincodes: ["560109"] },
  { file: "leads-Movie_Theater_-_560110.csv", pincodes: ["560110"] },
  { file: "leads-Movie_Theater_-_560111.csv", pincodes: ["560111"] },
  { file: "leads-Movie_Theater_-_560112.csv", pincodes: ["560112"] },
  { file: "leads-Movie_Theater_-_562114.csv", pincodes: ["562114"] },
];

let totalLeads = 0;
let merged = 0;
let skipped = 0;

for (const { file, pincodes } of PLAN) {
  const csvText = readFileSync(`${LEADS_DIR}/${file}`, "utf-8");
  for (const pincode of pincodes) {
    const task: QueryTask = { subcategory: "Movie Theater Database", city: "bangalore", location: pincode, mode: "plain" };
    const key = taskKey(task);
    const state = loadState();
    if (isCompleted(state, key)) {
      console.log(`Already staged: ${key} — skipping.`);
      skipped++;
      continue;
    }
    const searchQuery = `Movie Theater in ${pincodes.join(", ")}`;
    const leadCount = appendLeadsToStaging(task, searchQuery, csvText);
    const timestamp = new Date().toISOString();
    recordCompletion(state, key, { timestamp, leadCount, creditsSpent: 0, jobId: `manual-gui-download:${file}` });
    appendRunSummary({
      timestamp,
      subcategory: task.subcategory,
      city: task.city,
      location: pincode,
      mode: task.mode,
      creditsSpent: 0,
      leadCount,
      status: "complete",
      note: `manually downloaded via gmapsscraper.io GUI (${file}), merged from Leads folder`,
    });
    console.log(`Merged ${leadCount} leads for ${key} from ${file}.`);
    totalLeads += leadCount;
    merged++;
  }
}

console.log(`\nDone. ${merged} pincodes merged (${totalLeads} leads), ${skipped} already staged.`);
