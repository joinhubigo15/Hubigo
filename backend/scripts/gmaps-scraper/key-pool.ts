import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Pro plan allows unlimited API keys, but they all draw from ONE shared account credit balance —
 * rotating keys does not multiply available credits. What IS per-key is the daily request-count
 * cap (1000/day observed on this plan), so rotation exists purely to work around that, not to
 * extend the credit budget.
 */
export interface KeyEntry {
  /** The numeric suffix from GMAPSSCRAPER_API_KEY<label> in .env — used for human-readable logging. */
  label: number;
  key: string;
}

const CURSOR_PATH = path.join(__dirname, "state", "key-cursor.json");

export class KeyPool {
  private entries: KeyEntry[];
  private index: number;
  /** Rotations since the last successful query. A full lap (== entries.length) with zero
   * successes means every key is genuinely dead right now, not just "we reached the end of the
   * array" — that distinction matters because the array end is not special, keys near the start
   * regain quota (daily reset) or were never actually exhausted (rotated past due to a
   * misclassified transient error), so wrapping back to key 0 is the correct behavior. */
  private consecutiveRotations = 0;
  /** Every key label actually attempted this run — lets a caller that abandons a block early
   * (see cli.ts's fast-abandon threshold) report which keys in the block were never even tried,
   * so they can be swept up into a leftover block later instead of being silently skipped. */
  private visited: Set<number> = new Set();
  /** Distinct key labels confirmed rate-limited/blocked at least once. Deliberately NOT reset by
   * noteSuccess() — under concurrency>1, several workers share one pool, so an unrelated worker's
   * success on a different key must not erase the fact that key #X was confirmed dead. Counting
   * distinct dead keys (rather than consecutiveRotations, which one interleaved success anywhere
   * resets to 0) is what actually answers "how many keys in this block have we confirmed bad" —
   * consecutiveRotations was found to under-count badly here, letting 9 dead keys slip through
   * before anything triggered. */
  private deadKeys: Set<number> = new Set();

  constructor(entries: KeyEntry[], startLabel?: number) {
    if (entries.length === 0) {
      throw new Error("No GMAPSSCRAPER_API_KEY* values found in backend/.env");
    }
    this.entries = entries;
    const idx = startLabel !== undefined ? entries.findIndex((e) => e.label === startLabel) : 0;
    this.index = idx >= 0 ? idx : 0;
    this.visited.add(this.entries[this.index].label);
  }

  current(): string {
    return this.entries[this.index].key;
  }

  /** Key labels in this pool that were never rotated onto (or started on) this run — i.e. never
   * actually confirmed rate-limited, just skipped because the block was abandoned early. */
  untestedLabels(): number[] {
    return this.entries.filter((e) => !this.visited.has(e.label)).map((e) => e.label);
  }

  currentLabelNumber(): number {
    return this.entries[this.index].label;
  }

  currentLabel(): string {
    return `key #${this.entries[this.index].label} (${this.index + 1}/${this.entries.length} in rotation)`;
  }

  /** Call after any successful query so a later dead stretch doesn't get confused with genuine
   * full-pool exhaustion. */
  noteSuccess(): void {
    this.consecutiveRotations = 0;
  }

  /** Advances to the next key, wrapping back to the start of the pool at the end. Returns false
   * only once a full lap has passed with no successful query in between — i.e. every key is
   * currently dead, not merely "we hit the end of the array". */
  rotate(): boolean {
    this.consecutiveRotations += 1;
    if (this.consecutiveRotations >= this.entries.length) return false;
    this.index = (this.index + 1) % this.entries.length;
    this.visited.add(this.entries[this.index].label);
    return true;
  }

  hasMore(): boolean {
    return this.consecutiveRotations < this.entries.length;
  }

  /** Rotations since the last successful query — how many keys in a row have been dead. */
  consecutiveRotationCount(): number {
    return this.consecutiveRotations;
  }

  size(): number {
    return this.entries.length;
  }

  /** Marks the given key label as confirmed rate-limited/blocked at least once this run. */
  markDead(label: number): void {
    this.deadKeys.add(label);
  }

  /** How many distinct keys in this pool have been confirmed dead so far — robust under
   * concurrency, unlike consecutiveRotationCount(). */
  deadKeyCount(): number {
    return this.deadKeys.size;
  }

  /** Labels marked dead this run — note these got only 1-2 attempts before being written off
   * (that's the whole point of the fast-abandon threshold), nowhere near their real 1000/day
   * budget. Distinct from untestedLabels() (never even tried) but equally worth revisiting in a
   * dedicated block later, since neither group is actually exhausted. */
  deadKeyLabels(): number[] {
    return Array.from(this.deadKeys);
  }
}

export function loadKeysFromEnv(env: NodeJS.ProcessEnv): KeyEntry[] {
  const numbered = Object.keys(env)
    .filter((k) => /^GMAPSSCRAPER_API_KEY\d+$/.test(k))
    .map((k) => ({ label: Number(k.replace("GMAPSSCRAPER_API_KEY", "")), key: env[k]?.trim() }))
    .filter((e): e is KeyEntry => Boolean(e.key))
    .sort((a, b) => a.label - b.label);

  if (numbered.length > 0) return numbered;

  // Fall back to the single unsuffixed key for backward compatibility.
  const single = env.GMAPSSCRAPER_API_KEY?.trim();
  return single ? [{ label: 0, key: single }] : [];
}

/** Which key label the previous invocation ended on, so a fresh process (next city/subcategory) resumes there instead of restarting rotation from the beginning. */
export function loadCursor(): number | null {
  if (!existsSync(CURSOR_PATH)) return null;
  try {
    return (JSON.parse(readFileSync(CURSOR_PATH, "utf-8")) as { activeLabel: number }).activeLabel;
  } catch {
    return null;
  }
}

export function saveCursor(label: number): void {
  mkdirSync(path.dirname(CURSOR_PATH), { recursive: true });
  writeFileSync(CURSOR_PATH, JSON.stringify({ activeLabel: label, updatedAt: new Date().toISOString() }, null, 2), "utf-8");
}

const LEFTOVER_KEYS_PATH = path.join(__dirname, "state", "leftover-keys.json");

/** Records key labels that were skipped when a restricted block was abandoned early (most of the
 * block was dead, so the rest were never actually tried) — so they can be swept up into a
 * dedicated block later, once every fresh sequential block has been used. */
export function recordLeftoverKeys(labels: number[]): void {
  if (labels.length === 0) return;
  mkdirSync(path.dirname(LEFTOVER_KEYS_PATH), { recursive: true });
  let existing: number[] = [];
  if (existsSync(LEFTOVER_KEYS_PATH)) {
    try {
      existing = JSON.parse(readFileSync(LEFTOVER_KEYS_PATH, "utf-8")) as number[];
    } catch {
      existing = [];
    }
  }
  const merged = Array.from(new Set([...existing, ...labels])).sort((a, b) => a - b);
  writeFileSync(LEFTOVER_KEYS_PATH, JSON.stringify(merged, null, 2), "utf-8");
}

export function loadLeftoverKeys(): number[] {
  if (!existsSync(LEFTOVER_KEYS_PATH)) return [];
  try {
    return JSON.parse(readFileSync(LEFTOVER_KEYS_PATH, "utf-8")) as number[];
  } catch {
    return [];
  }
}

const EXHAUSTED_KEYS_PATH = path.join(__dirname, "state", "exhausted-keys.json");

interface ExhaustedKeysFile {
  /** YYYY-MM-DD — the daily cap resets once a day, so a record from a prior date is stale. */
  date: string;
  labels: number[];
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Records a key label as GENUINELY out of its 1000/day request quota (confirmed via the exact
 * "Daily request limit exceeded" API message, not just a generic/account-wide rejection) — so a
 * later pass can skip it instead of wasting an attempt re-confirming what's already known. Kept
 * separate from the account-wide-congestion "dead" tracking in KeyPool, which is per-process and
 * deliberately NOT persisted (those keys are still fully usable, just unlucky in that moment). */
export function recordExhaustedKey(label: number): void {
  mkdirSync(path.dirname(EXHAUSTED_KEYS_PATH), { recursive: true });
  const today = todayDateString();
  let existing: ExhaustedKeysFile = { date: today, labels: [] };
  if (existsSync(EXHAUSTED_KEYS_PATH)) {
    try {
      const parsed = JSON.parse(readFileSync(EXHAUSTED_KEYS_PATH, "utf-8")) as ExhaustedKeysFile;
      if (parsed.date === today) existing = parsed;
    } catch {
      // fall through to fresh file for today
    }
  }
  if (!existing.labels.includes(label)) existing.labels.push(label);
  existing.labels.sort((a, b) => a - b);
  writeFileSync(EXHAUSTED_KEYS_PATH, JSON.stringify(existing, null, 2), "utf-8");
}

/** Key labels confirmed to have genuinely hit their 1000/day cap TODAY (auto-stale once the date
 * rolls over, since the provider's daily cap resets — no manual cleanup needed). */
export function loadExhaustedKeysToday(): number[] {
  if (!existsSync(EXHAUSTED_KEYS_PATH)) return [];
  try {
    const parsed = JSON.parse(readFileSync(EXHAUSTED_KEYS_PATH, "utf-8")) as ExhaustedKeysFile;
    return parsed.date === todayDateString() ? parsed.labels : [];
  } catch {
    return [];
  }
}

const REVOKED_KEYS_PATH = path.join(__dirname, "state", "revoked-keys.json");

/** Records a key label as genuinely invalid/revoked (HTTP 401) — unlike the daily cap, this never
 * expires on its own, so it's skipped on every future run until someone replaces the key in .env. */
export function recordRevokedKey(label: number): void {
  mkdirSync(path.dirname(REVOKED_KEYS_PATH), { recursive: true });
  let existing: number[] = [];
  if (existsSync(REVOKED_KEYS_PATH)) {
    try {
      existing = JSON.parse(readFileSync(REVOKED_KEYS_PATH, "utf-8")) as number[];
    } catch {
      existing = [];
    }
  }
  if (!existing.includes(label)) existing.push(label);
  existing.sort((a, b) => a - b);
  writeFileSync(REVOKED_KEYS_PATH, JSON.stringify(existing, null, 2), "utf-8");
}

export function loadRevokedKeys(): number[] {
  if (!existsSync(REVOKED_KEYS_PATH)) return [];
  try {
    return JSON.parse(readFileSync(REVOKED_KEYS_PATH, "utf-8")) as number[];
  } catch {
    return [];
  }
}
