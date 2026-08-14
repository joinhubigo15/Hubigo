#!/usr/bin/env bash
# Runs the rest of Retail Stores continuously, never stopping to wait for a human:
#  - concurrent batch per subcategory on a 10-key block, blocks always taken in strict sequential
#    order (41-50, then 51-60, then 61-70, ...) — never a random jump.
#  - if a block gets exhausted mid-subcategory (run-category-batch.sh exits 1 or 3), the
#    in-progress subcategory is finished off single-key (concurrency 1, natural full-pool
#    rotation) instead of hopping to another fresh 10-key block — hopping blocks burns a fresh
#    block (up to 7 keys confirmed dead each time) per city leg, which chews through keys far
#    faster than the account-wide cap actually clears. Single-key finish reuses the SAME already
#    -proven-live keys via natural rotation instead of sacrificing a new batch of untested ones.
#    Once the current subcategory is finished, the NEXT sequential 10-key block is picked up for
#    the subcategory after that.
#  - stops (for real) only on: STOPPED_LOW_CREDITS (exit 2), the whole category list finishing
#    (exit 0), or Retail Stores itself finishing (checked after every subcategory).
set -uo pipefail
cd "$(dirname "$0")/../.."  # backend/

BLOCK_START="${RETAIL_BLOCK_START:-41}"
BLOCK_SIZE=10
CONCURRENCY="${FNB_CONCURRENCY:-10}"
SINGLE_KEY_CONCURRENCY="${FNB_SINGLE_KEY_CONCURRENCY:-1}"

is_retail_stores_done() {
  npx tsx scripts/gmaps-scraper/check-retail-stores-complete.ts
}

while true; do
  BLOCK_END=$((BLOCK_START + BLOCK_SIZE - 1))
  echo ""
  echo "===== Continuous run: key block $BLOCK_START-$BLOCK_END, concurrency $CONCURRENCY ====="

  FNB_CONCURRENCY="$CONCURRENCY" FNB_KEY_RANGE="$BLOCK_START-$BLOCK_END" bash scripts/gmaps-scraper/run-category-batch.sh
  EXIT=$?

  if [ $EXIT -eq 0 ]; then
    echo "ALL_CATEGORIES_COMPLETE"
    exit 0
  fi

  if [ $EXIT -eq 2 ]; then
    echo "STOPPED_LOW_CREDITS — halting continuous run, needs a human to add credits/keys."
    exit 2
  fi

  # exit 1 (FATAL) or 3 (STOPPED_INCOMPLETE): the block is spent or something broke mid-subcategory.
  # Finish whichever subcategory was in progress via single-key (full pool, natural rotation) so
  # the run keeps making progress without stopping, then move the block forward for the next one.
  STUCK_SUB=$(npx tsx scripts/gmaps-scraper/find-stuck-subcategory.ts 2>/dev/null)
  if [ -z "$STUCK_SUB" ]; then
    echo "Could not identify a stuck subcategory after exit $EXIT — stopping to avoid looping blindly."
    exit 1
  fi

  # A single-key pass can come back empty if the account-wide "max 10 concurrent jobs" cap is
  # saturated right at that moment (zombie/stuck jobs occupying slots) — that's transient
  # congestion, not a real problem, and it clears on its own. Retry several times with a short
  # wait before ever surfacing to a human, so a bad-luck window doesn't halt an unattended run.
  SLUG=$(echo "$STUCK_SUB" | sed 's/ Database$//' | tr '[:upper:] ' '[:lower:]_' | tr -cd '[:alnum:]_')
  SINGLE_KEY_ATTEMPT=1
  MAX_SINGLE_KEY_ATTEMPTS=10
  while true; do
    echo "--- Finishing '$STUCK_SUB' full-pool, concurrency $SINGLE_KEY_CONCURRENCY, attempt $SINGLE_KEY_ATTEMPT/$MAX_SINGLE_KEY_ATTEMPTS (block $BLOCK_START-$BLOCK_END exhausted or errored) ---"
    for CITY_SPEC in "bangalore:Bangalore_pincode.txt" "chennai:../Chennai_Pincode.txt" "hyderabad:../Hyderabad_Pincode.txt"; do
      CITY="${CITY_SPEC%%:*}"
      FILE="${CITY_SPEC##*:}"
      npx tsx scripts/gmaps-scraper/cli.ts --subcategory "$STUCK_SUB" --city "$CITY" --location-file "$FILE" --mode plain --depth 3 --max-credits 100000 --concurrency "$SINGLE_KEY_CONCURRENCY"
    done

    npx tsx scripts/gmaps-scraper/build-subcategory-csv.ts "$STUCK_SUB" "${SLUG}-bangalore-chennai-hyderabad.csv" > /dev/null

    npx tsx scripts/gmaps-scraper/check-subcategory-complete.ts "$STUCK_SUB"
    if [ $? -eq 0 ]; then
      break
    fi

    if [ "$SINGLE_KEY_ATTEMPT" -ge "$MAX_SINGLE_KEY_ATTEMPTS" ]; then
      echo "'$STUCK_SUB' still incomplete after $MAX_SINGLE_KEY_ATTEMPTS single-key attempts — stopping for a human to look (likely more than transient congestion)."
      exit 1
    fi

    echo "'$STUCK_SUB' still incomplete (likely account-wide concurrency cap) — waiting 60s and retrying single-key pass..."
    sleep 60
    SINGLE_KEY_ATTEMPT=$((SINGLE_KEY_ATTEMPT + 1))
  done

  echo "--- '$STUCK_SUB' finished single-key. Advancing to next block. ---"

  if is_retail_stores_done; then
    echo "RETAIL_STORES_COMPLETE"
    exit 0
  fi

  BLOCK_START=$((BLOCK_START + BLOCK_SIZE))
done
