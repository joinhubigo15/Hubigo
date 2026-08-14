import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const STATE_DIR = path.join(__dirname, "state");
const STATE_PATH = path.join(STATE_DIR, "state.json");

export interface CompletedEntry {
  timestamp: string;
  leadCount: number;
  creditsSpent: number;
  jobId: string;
}

export interface ScraperState {
  totalCreditsSpent: number;
  completed: Record<string, CompletedEntry>;
}

function defaultState(): ScraperState {
  return { totalCreditsSpent: 0, completed: {} };
}

export function loadState(): ScraperState {
  if (!existsSync(STATE_PATH)) {
    return defaultState();
  }
  const raw = readFileSync(STATE_PATH, "utf-8");
  return JSON.parse(raw) as ScraperState;
}

/**
 * Concurrent workers within one process can each call saveState around the same time — a shared
 * fixed tmp filename let two of them collide on the same rename target, which Windows reports as
 * EPERM. A unique tmp path per call removes the collision; the retry loop absorbs the remaining
 * Windows flakiness where antivirus/indexing briefly holds a file handle during rename.
 */
export function saveState(state: ScraperState): void {
  mkdirSync(STATE_DIR, { recursive: true });
  const tmpPath = `${STATE_PATH}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  writeFileSync(tmpPath, JSON.stringify(state, null, 2), "utf-8");

  for (let attempt = 0; ; attempt++) {
    try {
      renameSync(tmpPath, STATE_PATH);
      return;
    } catch (err) {
      if (attempt >= 4) throw err;
      const waitMs = 20 * 2 ** attempt;
      const until = Date.now() + waitMs;
      while (Date.now() < until) {
        /* brief synchronous busy-wait — renameSync has no async variant available here */
      }
    }
  }
}

export function isCompleted(state: ScraperState, key: string): boolean {
  return key in state.completed;
}

export function recordCompletion(state: ScraperState, key: string, entry: CompletedEntry): void {
  state.completed[key] = entry;
  state.totalCreditsSpent += entry.creditsSpent;
  saveState(state);
}
