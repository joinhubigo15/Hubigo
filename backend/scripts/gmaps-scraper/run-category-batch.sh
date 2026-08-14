#!/usr/bin/env bash
# Autonomous run: entire category list (Retail Stores onward — Food & Beverage already done),
# sector by sector in Sector Rank order, subcategory by subcategory in Priority order, all 3
# cities, concurrency 10. Skips any subcategory already fully staged. Logs every subcategory
# result to staging/category-batch-status.jsonl instead of chat. Stops only when: (a) shared
# credit balance drops below ~15% of a fresh key's balance — checked once per SECTOR, not per
# subcategory, (b) a genuine schema/data surprise, or (c) the whole list is done.
set -uo pipefail
cd "$(dirname "$0")/../.."  # backend/

START_KEY="${FNB_START_KEY:-104}"
CONCURRENCY="${FNB_CONCURRENCY:-10}"
KEY_RANGE="${FNB_KEY_RANGE:-}"
FIRST=true
CURRENT_SECTOR=""

STATE_FILE=scripts/gmaps-scraper/state/state.json

while IFS=$'\t' read -r TYPE VALUE; do
  if [ "$TYPE" = "SECTOR" ]; then
    if [ -n "$CURRENT_SECTOR" ]; then
      echo ""
      echo "=== Sector complete: $CURRENT_SECTOR — checking credit headroom ==="
      CHECK_OUTPUT=$(npx tsx scripts/gmaps-scraper/fast-credit-check.ts --fresh-key-baseline 150000 --threshold-pct 15)
      CHECK_EXIT=$?
      echo "$CHECK_OUTPUT"
      if [ $CHECK_EXIT -ne 0 ] && echo "$CHECK_OUTPUT" | grep -q '"belowThreshold":true'; then
        echo "STOPPED_LOW_CREDITS: halting after sector \"$CURRENT_SECTOR\" — add another key before continuing."
        exit 2
      fi
    fi
    CURRENT_SECTOR="$VALUE"
    echo ""
    echo "===== SECTOR: $CURRENT_SECTOR ====="
    continue
  fi

  SUBCAT="$VALUE"
  SLUG=$(echo "$SUBCAT" | sed 's/ Database$//' | tr '[:upper:] ' '[:lower:]_' | tr -cd '[:alnum:]_')
  OUT_FILE="${SLUG}-bangalore-chennai-hyderabad.csv"

  npx tsx scripts/gmaps-scraper/check-subcategory-complete.ts "$SUBCAT"
  if [ $? -eq 0 ]; then
    npx tsx scripts/gmaps-scraper/log-subcategory-status.ts "$CURRENT_SECTOR" "$SUBCAT" "$OUT_FILE" "skipped-already-done" > /dev/null
    continue
  fi

  echo ""
  echo "--- $SUBCAT ($CURRENT_SECTOR) ---"

  CREDITS_BEFORE=$(node -e "console.log(require('./$STATE_FILE').totalCreditsSpent)")

  for CITY_SPEC in "bangalore:Bangalore_pincode.txt" "chennai:../Chennai_Pincode.txt" "hyderabad:../Hyderabad_Pincode.txt"; do
    CITY="${CITY_SPEC%%:*}"
    FILE="${CITY_SPEC##*:}"

    if [ "$FIRST" = true ]; then
      START_KEY_ARG="--start-key $START_KEY"
      FIRST=false
    else
      START_KEY_ARG=""
    fi

    KEY_RANGE_ARG=""
    if [ -n "$KEY_RANGE" ]; then
      KEY_RANGE_ARG="--key-range $KEY_RANGE"
      START_KEY_ARG=""  # --key-range picks its own starting key; don't fight it with --start-key
    fi

    npx tsx scripts/gmaps-scraper/cli.ts --subcategory "$SUBCAT" --city "$CITY" --location-file "$FILE" --mode plain --depth 3 --max-credits 100000 --concurrency "$CONCURRENCY" $START_KEY_ARG $KEY_RANGE_ARG

    if [ $? -ne 0 ]; then
      echo "FATAL: cli.ts exited non-zero for $SUBCAT / $CITY. Stopping batch."
      exit 1
    fi
  done

  npx tsx scripts/gmaps-scraper/check-subcategory-complete.ts "$SUBCAT"
  if [ $? -ne 0 ]; then
    echo "STOPPED_INCOMPLETE: $SUBCAT did not finish all 3 cities this pass (likely key-block exhaustion.) Not moving to the next subcategory — rerun to pick up where it left off."
    exit 3
  fi

  npx tsx scripts/gmaps-scraper/build-subcategory-csv.ts "$SUBCAT" "$OUT_FILE" > /dev/null

  CREDITS_AFTER=$(node -e "console.log(require('./$STATE_FILE').totalCreditsSpent)")
  SUBCAT_CREDITS_SPENT=$((CREDITS_AFTER - CREDITS_BEFORE))

  SUBCAT_CREDITS_SPENT=$SUBCAT_CREDITS_SPENT npx tsx scripts/gmaps-scraper/log-subcategory-status.ts "$CURRENT_SECTOR" "$SUBCAT" "$OUT_FILE" "completed"
done < <(npx tsx scripts/gmaps-scraper/list-remaining-subcategories.ts)

echo ""
echo "=== Final sector complete: $CURRENT_SECTOR — checking credit headroom ==="
npx tsx scripts/gmaps-scraper/fast-credit-check.ts --fresh-key-baseline 150000 --threshold-pct 15

echo ""
echo "ALL_CATEGORIES_COMPLETE"
