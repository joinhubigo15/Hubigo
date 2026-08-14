/**
 * Fast credit check for sector-boundary gating: queries only the currently-active key (per the
 * persisted cursor) since the balance is shared across all keys — no need to loop through
 * hundreds of them like check-credit-headroom.ts does (that one is for a one-off full audit).
 */
import "dotenv/config";
import { loadKeysFromEnv, loadCursor } from "./key-pool";

const BASE_URL = "https://gmapsscraper.io/api/v1";

function argValue(flag: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : fallback;
}

async function main() {
  const freshBaseline = Number(argValue("--fresh-key-baseline", "150000"));
  const thresholdPct = Number(argValue("--threshold-pct", "15"));
  const threshold = freshBaseline * (thresholdPct / 100);

  const keys = loadKeysFromEnv(process.env);
  const cursorLabel = loadCursor();
  const active = cursorLabel !== undefined ? keys.find((k) => k.label === cursorLabel) : keys[0];
  if (!active) {
    console.log(JSON.stringify({ error: "no active key found" }));
    process.exit(1);
  }

  const res = await fetch(`${BASE_URL}/credits`, { headers: { Authorization: `Bearer ${active.key}` } });
  if (!res.ok) {
    // Active key itself is rate-limited right now — not a credit problem, just report unknown
    // and let the run continue (the scraper's own rotation will find a working key).
    console.log(JSON.stringify({ activeKeyLabel: active.label, status: res.status, balanceUnknown: true, belowThreshold: false }));
    process.exit(0);
  }
  const body = (await res.json()) as { credits: number };
  const belowThreshold = body.credits < threshold;
  console.log(JSON.stringify({ activeKeyLabel: active.label, sharedBalance: body.credits, thresholdCredits: threshold, belowThreshold }));
  process.exit(belowThreshold ? 1 : 0);
}

main();
