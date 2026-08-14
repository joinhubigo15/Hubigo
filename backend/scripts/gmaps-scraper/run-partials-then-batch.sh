#!/usr/bin/env bash
# Finishes the subcategories that were left partially scraped (due to the now-fixed key-rotation
# bug) in a fixed order, each fully completed (all 3 cities) before moving to the next — then
# hands off to run-category-batch.sh for the rest, which naturally skips these since they'll be
# complete by then.
set -uo pipefail
cd "$(dirname "$0")/../.."  # backend/

START_KEY="${PARTIAL_START_KEY:-150}"
CONCURRENCY="${FNB_CONCURRENCY:-10}"
KEY_RANGE="${FNB_KEY_RANGE:-}"
FIRST=true

PARTIALS=(
  "Grocery Store Database"
  "Women's Clothing Store Database"
  "Antique Store Database"
  "Bag Store Database"
  "Boutique Database"
  "Building Materials Store Database"
  "Meat Store Database"
  "Costume Jewelry Store Database"
)

STATE_FILE=scripts/gmaps-scraper/state/state.json

for SUBCAT in "${PARTIALS[@]}"; do
  SLUG=$(echo "$SUBCAT" | sed 's/ Database$//' | tr '[:upper:] ' '[:lower:]_' | tr -cd '[:alnum:]_')
  OUT_FILE="${SLUG}-bangalore-chennai-hyderabad.csv"

  npx tsx scripts/gmaps-scraper/check-subcategory-complete.ts "$SUBCAT"
  if [ $? -eq 0 ]; then
    echo "--- $SUBCAT already complete, skipping ---"
    continue
  fi

  echo ""
  echo "--- $SUBCAT (finishing partial scrape) ---"

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
      START_KEY_ARG=""
    fi

    npx tsx scripts/gmaps-scraper/cli.ts --subcategory "$SUBCAT" --city "$CITY" --location-file "$FILE" --mode plain --depth 3 --max-credits 100000 --concurrency "$CONCURRENCY" $START_KEY_ARG $KEY_RANGE_ARG

    if [ $? -ne 0 ]; then
      echo "FATAL: cli.ts exited non-zero for $SUBCAT / $CITY. Stopping."
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

  SUBCAT_CREDITS_SPENT=$SUBCAT_CREDITS_SPENT npx tsx scripts/gmaps-scraper/log-subcategory-status.ts "Retail Stores" "$SUBCAT" "$OUT_FILE" "completed"
done

echo ""
echo "PARTIALS_COMPLETE — handing off to run-category-batch.sh for the rest."
echo ""

exec bash scripts/gmaps-scraper/run-category-batch.sh
