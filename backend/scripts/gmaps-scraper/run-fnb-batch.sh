#!/usr/bin/env bash
# Orchestrates the remaining 11 Food & Beverage subcategories (Bakery already done) across
# Bangalore/Chennai/Hyderabad, depth 3, plain mode, starting rotation at API key 2 (key 1 is
# known rate-limited from the earlier Movie Theater + Bakery runs). Checkpoints after each
# subcategory: builds its standalone CSV and reports credit headroom before continuing.
set -uo pipefail
cd "$(dirname "$0")/../.."  # backend/

# Keys 1-99ish turned out to be exhausted/dead (only the original 10 were ever real, the rest of
# the block up to ~99 got rate-limited immediately when tried) — override via env var if this
# needs to change again without editing the script.
START_KEY="${FNB_START_KEY:-100}"

# Everything else is permanently complete (343/343 each) — trimmed from this list so resuming
# doesn't replay them every time.
SUBCATS=(
  "Wine Store Database"
)

FIRST=true

for SUBCAT in "${SUBCATS[@]}"; do
  SLUG=$(echo "$SUBCAT" | sed 's/ Database$//' | tr '[:upper:] ' '[:lower:]_')
  echo ""
  echo "===== SUBCATEGORY: $SUBCAT ====="

  for CITY_SPEC in "bangalore:Bangalore_pincode.txt" "chennai:../Chennai_Pincode.txt" "hyderabad:../Hyderabad_Pincode.txt"; do
    CITY="${CITY_SPEC%%:*}"
    FILE="${CITY_SPEC##*:}"

    if [ "$FIRST" = true ]; then
      START_KEY_ARG="--start-key $START_KEY"
      FIRST=false
    else
      START_KEY_ARG=""
    fi

    echo "--- $SUBCAT / $CITY ---"
    npx tsx scripts/gmaps-scraper/cli.ts --subcategory "$SUBCAT" --city "$CITY" --location-file "$FILE" --mode plain --depth 3 --max-credits 1000 $START_KEY_ARG

    if [ $? -ne 0 ]; then
      echo "FATAL: cli.ts exited non-zero for $SUBCAT / $CITY. Stopping batch."
      exit 1
    fi
  done

  OUT_FILE="${SLUG}-bangalore-chennai-hyderabad.csv"
  echo "--- Building combined CSV for $SUBCAT ---"
  npx tsx scripts/gmaps-scraper/build-subcategory-csv.ts "$SUBCAT" "$OUT_FILE"

  echo "CHECKPOINT_DONE: $SUBCAT"
done

echo ""
echo "ALL_SUBCATEGORIES_COMPLETE"
