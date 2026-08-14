#!/usr/bin/env bash
# Runs the rest of Retail Stores continuously using the FULL key pool (no --key-range) at a
# moderate concurrency (default 5, not 10) — fewer simultaneous submissions means less chance of
# instantly tripping the account-wide "max 10 concurrent jobs" cap than a fresh 10-key block does,
# while still being faster than pure single-key (concurrency 1). Natural full-pool rotation means
# there's no block to "exhaust" and hop away from — cli.ts already retries/rotates within a run,
# so this script just repeats subcategory by subcategory until Retail Stores is done.
set -uo pipefail
cd "$(dirname "$0")/../.."  # backend/

CONCURRENCY="${FNB_CONCURRENCY:-5}"
START_KEY="${FNB_START_KEY:-}"
# If set, restricts the pool to this comma-separated key-label list for the FIRST loop iteration
# only (one full pass across all 3 cities for whichever subcategory is currently stuck) — lets a
# caller prioritize a specific set of barely-used/untouched keys before falling back to the
# unrestricted full pool for every iteration after. Cleared after first use.
KEY_LIST_ONCE="${FNB_KEY_LIST_ONCE:-}"
# If set, restricts the pool to this comma-separated key-label list for EVERY loop iteration
# (persists, unlike KEY_LIST_ONCE) — used when the caller wants to stay confined to a specific
# known-good key set rather than falling back to the full pool after one pass.
KEY_LIST_PERSIST="${FNB_KEY_LIST:-}"
FIRST=true

while true; do
  STUCK_SUB=$(npx tsx scripts/gmaps-scraper/find-stuck-subcategory.ts 2>/dev/null)
  if [ -z "$STUCK_SUB" ]; then
    echo "ALL_SUBCATEGORIES_COMPLETE"
    exit 0
  fi

  echo ""
  echo "--- $STUCK_SUB (full pool, concurrency $CONCURRENCY) ---"

  for CITY_SPEC in "bangalore:Bangalore_pincode.txt" "chennai:../Chennai_Pincode.txt" "hyderabad:../Hyderabad_Pincode.txt"; do
    CITY="${CITY_SPEC%%:*}"
    FILE="${CITY_SPEC##*:}"
    START_KEY_ARG=""
    if [ -n "$START_KEY" ] && [ "$FIRST" = true ]; then
      START_KEY_ARG="--start-key $START_KEY"
      FIRST=false
    fi
    KEY_LIST_ARG=""
    if [ -n "$KEY_LIST_PERSIST" ]; then
      KEY_LIST_ARG="--key-list $KEY_LIST_PERSIST"
    elif [ -n "$KEY_LIST_ONCE" ]; then
      KEY_LIST_ARG="--key-list $KEY_LIST_ONCE"
    fi
    npx tsx scripts/gmaps-scraper/cli.ts --subcategory "$STUCK_SUB" --city "$CITY" --location-file "$FILE" --mode plain --depth 3 --max-credits 100000 --concurrency "$CONCURRENCY" $START_KEY_ARG $KEY_LIST_ARG
    if [ $? -ne 0 ]; then
      echo "FATAL: cli.ts exited non-zero for $STUCK_SUB / $CITY. Stopping."
      exit 1
    fi
  done
  KEY_LIST_ONCE=""

  SLUG=$(echo "$STUCK_SUB" | sed 's/ Database$//' | tr '[:upper:] ' '[:lower:]_' | tr -cd '[:alnum:]_')
  npx tsx scripts/gmaps-scraper/build-subcategory-csv.ts "$STUCK_SUB" "${SLUG}-bangalore-chennai-hyderabad.csv" > /dev/null
  if [ $? -ne 0 ]; then
    echo "WARNING: build-subcategory-csv.ts failed for '$STUCK_SUB' (its per-subcategory CSV export is missing/incomplete even though the underlying query data is staged) — continuing, but this needs a manual re-run of build-subcategory-csv.ts for it later."
  fi

  npx tsx scripts/gmaps-scraper/check-subcategory-complete.ts "$STUCK_SUB"
  if [ $? -eq 0 ]; then
    echo "--- '$STUCK_SUB' complete. ---"
  else
    echo "--- '$STUCK_SUB' still incomplete this pass — will resume it next loop. ---"
  fi
done
