/**
 * Reports the shared account credit balance (all keys draw from ONE pool — never sum per-key
 * balances, that would multiply-count the same money) plus which keys are currently
 * request-rate-limited. Exits 1 if the shared balance has dropped below --threshold.
 * Usage: tsx check-credit-headroom.ts --start-key 2 --fresh-key-baseline 150000 --threshold-pct 15
 */
import "dotenv/config";
import { loadKeysFromEnv, loadCursor } from "./key-pool";

const BASE_URL = "https://gmapsscraper.io/api/v1";

function argValue(flag: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : fallback;
}

async function main() {
  const startKeyArg = argValue("--start-key");
  const freshBaseline = Number(argValue("--fresh-key-baseline", "150000"));
  const thresholdPct = Number(argValue("--threshold-pct", "15"));
  const threshold = freshBaseline * (thresholdPct / 100);

  const allKeys = loadKeysFromEnv(process.env);
  const startLabel = startKeyArg ? Number(startKeyArg) : undefined;
  const activeKeys = startLabel !== undefined ? allKeys.filter((k) => k.label >= startLabel) : allKeys;

  let sharedBalance: number | null = null;
  const statuses: { label: number; status: "ok" | "rate-limited" | "error"; credits?: number }[] = [];

  for (const { label, key } of activeKeys) {
    try {
      const res = await fetch(`${BASE_URL}/credits`, { headers: { Authorization: `Bearer ${key}` } });
      if (res.status === 429) {
        statuses.push({ label, status: "rate-limited" });
        continue;
      }
      if (!res.ok) {
        statuses.push({ label, status: "error" });
        continue;
      }
      const body = (await res.json()) as { credits: number };
      if (sharedBalance === null) sharedBalance = body.credits;
      statuses.push({ label, status: "ok", credits: body.credits });
    } catch {
      statuses.push({ label, status: "error" });
    }
  }

  const cursor = loadCursor();
  const currentlyActiveLabel = cursor ?? activeKeys[0]?.label;
  const availableKeyCount = statuses.filter((s) => s.status === "ok").length;
  const belowThreshold = sharedBalance !== null && sharedBalance < threshold;

  console.log(
    JSON.stringify(
      {
        sharedBalance,
        freshKeyBaseline: freshBaseline,
        thresholdPct,
        thresholdCredits: threshold,
        belowThreshold,
        currentlyActiveKeyLabel: currentlyActiveLabel,
        availableKeyCount,
        totalKeysInRotation: activeKeys.length,
        perKeyStatus: statuses,
      },
      null,
      2,
    ),
  );

  process.exit(belowThreshold || availableKeyCount === 0 ? 1 : 0);
}

main();
