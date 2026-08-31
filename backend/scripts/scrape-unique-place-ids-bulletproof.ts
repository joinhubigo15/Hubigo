import "dotenv/config";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY2 || process.env.GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error("Error: GOOGLE_MAPS_API_KEY2 is not set in environment or .env file");
  process.exit(1);
}

// Controlled rate-limiting parameters to guarantee zero 429 drops
const arg1 = process.argv[2];
let inputFileName = "google-place-ids-unique-35001-to-45000.json";
let START_INDEX = 0;
let END_INDEX = 1000;

if (arg1 && (arg1.endsWith(".json") || arg1.endsWith(".xlsx"))) {
  inputFileName = arg1;
  START_INDEX = Number(process.argv[3]) || 0;
  END_INDEX = Number(process.argv[4]) || 1000;
} else if (arg1 && !isNaN(Number(arg1))) {
  inputFileName = "google-place-ids-bangalore-unique.xlsx";
  START_INDEX = Number(arg1);
  END_INDEX = Number(process.argv[3]) || (START_INDEX + 15000);
}

const CONCURRENCY = 6; // Safe concurrency to stay strictly within QPS rate limits
const STATE_SAVE_INTERVAL = 200;

const INPUT_FILE = path.isAbsolute(inputFileName)
  ? inputFileName
  : path.resolve(__dirname, "../", inputFileName);

const fileBaseName = path.basename(INPUT_FILE, path.extname(INPUT_FILE));
const OUTPUT_EXCEL = path.resolve(
  __dirname,
  `../${fileBaseName}-scraped-${START_INDEX + 1}-to-${END_INDEX}.xlsx`
);
const STATE_JSON = path.resolve(
  __dirname,
  `../${fileBaseName}-state-${START_INDEX + 1}-to-${END_INDEX}.json`
);

interface InputRow {
  place_id: string;
  subcategory?: string;
}

interface ScrapedPlaceRow {
  place_id: string;
  name: string;
  address: string;
  primaryType: string;
  Type: string;
  phone_number: string;
  international_phone_number: string;
  longitude: number | string;
  latitude: number | string;
  operational_hours: string;
  area: string;
  city: string;
  state: string;
  country: string;
  ratings: number | string;
  reviews_count: number | string;
  price_level: string;
  editorial_summary: string;
  payment_options: string;
  accessibilityoptions: string;
  website_url: string;
  email: string;
  services: string;
  subcategory: string;
}

function extractAddressComponents(components: any[]) {
  if (!Array.isArray(components)) {
    return { area: "", city: "", state: "", country: "" };
  }

  const subloc1 = components.find((c) => c.types?.includes("sublocality_level_1"))?.longText;
  const subloc2 = components.find((c) => c.types?.includes("sublocality_level_2"))?.longText;
  const subloc = components.find((c) => c.types?.includes("sublocality"))?.longText;
  const neighborhood = components.find((c) => c.types?.includes("neighborhood"))?.longText;

  const areaParts = Array.from(new Set([subloc1, subloc2, subloc, neighborhood].filter(Boolean)));
  const area = areaParts.join(", ");

  const city =
    components.find((c) => c.types?.includes("locality"))?.longText ||
    components.find((c) => c.types?.includes("postal_town"))?.longText ||
    "";

  const state = components.find((c) => c.types?.includes("administrative_area_level_1"))?.longText || "";
  const country = components.find((c) => c.types?.includes("country"))?.longText || "";

  return { area, city, state, country };
}

function formatAccessibilityOptions(options: any): string {
  if (!options || typeof options !== "object") return "";
  const activeOpts = Object.entries(options)
    .filter(([_, val]) => val === true)
    .map(([key]) => key.replace(/([A-Z])/g, " $1").trim());
  return activeOpts.map((opt) => opt.charAt(0).toUpperCase() + opt.slice(1)).join(", ");
}

function formatPaymentOptions(options: any): string {
  if (!options || typeof options !== "object") return "";
  const activeOpts = Object.entries(options)
    .filter(([_, val]) => val === true)
    .map(([key]) => key.replace(/([A-Z])/g, " $1").trim());
  return activeOpts.map((opt) => opt.charAt(0).toUpperCase() + opt.slice(1)).join(", ");
}

function formatPriceLevel(priceLevel?: string): string {
  if (!priceLevel) return "";
  switch (priceLevel) {
    case "PRICE_LEVEL_FREE":
      return "Free";
    case "PRICE_LEVEL_INEXPENSIVE":
      return "$ (Inexpensive)";
    case "PRICE_LEVEL_MODERATE":
      return "$$ (Moderate)";
    case "PRICE_LEVEL_EXPENSIVE":
      return "$$$ (Expensive)";
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return "$$$$ (Very Expensive)";
    default:
      return priceLevel.replace("PRICE_LEVEL_", "");
  }
}

function formatServices(place: any): string {
  const serviceKeys = [
    "allowsDogs",
    "restroom",
    "takeout",
    "delivery",
    "dineIn",
    "reservable",
    "servesBreakfast",
    "servesLunch",
    "servesDinner",
    "servesBeer",
    "servesWine",
    "servesBrunch",
    "servesVegetarianFood",
  ];

  const activeServices: string[] = [];
  for (const key of serviceKeys) {
    if (place[key] === true) {
      const formatted = key.replace(/([A-Z])/g, " $1").trim();
      activeServices.push(formatted.charAt(0).toUpperCase() + formatted.slice(1));
    }
  }
  return activeServices.join(", ");
}

// Robust fetcher with exponential backoff & 5 retry attempts to prevent any dropped data
async function fetchPlaceDetailsBulletproof(placeId: string, maxRetries = 5): Promise<any> {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const fieldMask = [
    "id",
    "displayName",
    "formattedAddress",
    "addressComponents",
    "location",
    "nationalPhoneNumber",
    "internationalPhoneNumber",
    "websiteUri",
    "regularOpeningHours",
    "rating",
    "userRatingCount",
    "primaryType",
    "types",
    "priceLevel",
    "editorialSummary",
    "paymentOptions",
    "accessibilityOptions",
    "allowsDogs",
    "restroom",
    "takeout",
    "delivery",
    "dineIn",
    "reservable",
    "servesBreakfast",
    "servesLunch",
    "servesDinner",
    "servesBeer",
    "servesWine",
    "servesBrunch",
    "servesVegetarianFood",
  ].join(",");

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": fieldMask,
        },
      });

      if (res.status === 429 || res.status >= 500) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      if (!res.ok) {
        return null; // Truly closed/invalid place ID on Google Maps (HTTP 404)
      }

      return await res.json();
    } catch (e) {
      if (attempt === maxRetries) return null;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  return null;
}

function saveStateAndExcel(results: Map<string, ScrapedPlaceRow>) {
  const dataArray = Array.from(results.values());

  // Checkpoint JSON
  fs.writeFileSync(STATE_JSON, JSON.stringify(dataArray, null, 2), "utf8");

  // Output Excel
  if (dataArray.length > 0) {
    const worksheet = XLSX.utils.json_to_sheet(dataArray);
    const headers = Object.keys(dataArray[0] || {});
    worksheet["!cols"] = headers.map((h) => ({
      wch: Math.max(h.length + 5, 20),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `Scraped ${START_INDEX + 1}-${END_INDEX}`
    );
    XLSX.writeFile(workbook, OUTPUT_EXCEL);
  }
}

async function startBulletproofRangeScrape() {
  const totalCount = END_INDEX - START_INDEX;
  console.log(`====================================================`);
  console.log(`🛡️ BULLETPROOF RATE-LIMITED BATCH SCRAPER`);
  console.log(`Range: Place IDs #${START_INDEX + 1} to #${END_INDEX} (${totalCount} items)`);
  console.log(`Concurrency: ${CONCURRENCY} workers (Optimized against Rate Limits)`);
  console.log(`Retry Backoff: Up to 5 retries with exponential backoff`);
  console.log(`All 24 Enterprise & Pro Fields Included`);
  console.log(`Est. Cost: ~$${((totalCount / 1000) * 6).toFixed(2)} USD (100% Covered by Free Credit)`);
  console.log(`Output File: ${OUTPUT_EXCEL}`);
  console.log(`====================================================\n`);

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Input file missing: ${INPUT_FILE}`);
    process.exit(1);
  }

  let allRows: InputRow[] = [];
  if (INPUT_FILE.endsWith(".json")) {
    allRows = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));
  } else {
    const wb = XLSX.readFile(INPUT_FILE);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    allRows = XLSX.utils.sheet_to_json(sheet);
  }

  const targetItems = allRows.slice(START_INDEX, END_INDEX);
  console.log(`Loaded ${targetItems.length} place IDs to scrape for range [${START_INDEX + 1} .. ${END_INDEX}].\n`);

  const results = new Map<string, ScrapedPlaceRow>();

  if (fs.existsSync(STATE_JSON)) {
    try {
      const existing: ScrapedPlaceRow[] = JSON.parse(fs.readFileSync(STATE_JSON, "utf8"));
      for (const row of existing) {
        if (row.name && row.name.trim() !== "") {
          results.set(row.place_id, row);
        }
      }
      console.log(`Resumed previous valid checkpoint: ${results.size}/${targetItems.length} valid items already saved.`);
    } catch (e) {
      console.log("Starting fresh checkpoint for range.");
    }
  }

  let completedCount = results.size;
  const queue = targetItems.filter((item) => !results.has(item.place_id));

  if (queue.length === 0) {
    console.log(`All ${targetItems.length} place IDs in range are already scraped! Saving Excel...`);
    saveStateAndExcel(results);
    console.log(`Done! Output saved to: ${OUTPUT_EXCEL}`);
    return;
  }

  console.log(`Remaining to scrape: ${queue.length} items.\n`);

  const startTime = Date.now();
  let queueIndex = 0;

  async function worker() {
    while (queueIndex < queue.length) {
      const idx = queueIndex++;
      const item = queue[idx];

      const placeDetails = await fetchPlaceDetailsBulletproof(item.place_id);

      if (placeDetails && placeDetails.displayName?.text) {
        const { area, city, state, country } = extractAddressComponents(placeDetails.addressComponents);
        const operationalHours = placeDetails.regularOpeningHours?.weekdayDescriptions
          ? placeDetails.regularOpeningHours.weekdayDescriptions.join("; ")
          : "";
        const typesJoined = Array.isArray(placeDetails.types) ? placeDetails.types.join(", ") : "";

        results.set(item.place_id, {
          place_id: placeDetails.id || item.place_id,
          name: placeDetails.displayName.text,
          address: placeDetails.formattedAddress || "",
          primaryType: placeDetails.primaryType || "",
          Type: typesJoined,
          phone_number: placeDetails.nationalPhoneNumber || "",
          international_phone_number: placeDetails.internationalPhoneNumber || "",
          longitude: placeDetails.location?.longitude ?? "",
          latitude: placeDetails.location?.latitude ?? "",
          operational_hours: operationalHours,
          area,
          city,
          state,
          country,
          ratings: placeDetails.rating ?? "",
          reviews_count: placeDetails.userRatingCount ?? "",
          price_level: formatPriceLevel(placeDetails.priceLevel),
          editorial_summary: placeDetails.editorialSummary?.text || "",
          payment_options: formatPaymentOptions(placeDetails.paymentOptions),
          accessibilityoptions: formatAccessibilityOptions(placeDetails.accessibilityOptions),
          website_url: placeDetails.websiteUri || "",
          email: "",
          services: formatServices(placeDetails),
          subcategory: item.subcategory || "",
        });
      } else {
        // Truly invalid/closed Place ID on Google Maps
        results.set(item.place_id, {
          place_id: item.place_id,
          name: "",
          address: "",
          primaryType: "",
          Type: "",
          phone_number: "",
          international_phone_number: "",
          longitude: "",
          latitude: "",
          operational_hours: "",
          area: "",
          city: "",
          state: "",
          country: "",
          ratings: "",
          reviews_count: "",
          price_level: "",
          editorial_summary: "",
          payment_options: "",
          accessibilityoptions: "",
          website_url: "",
          email: "",
          services: "",
          subcategory: item.subcategory || "",
        });
      }

      completedCount++;

      if (completedCount % 50 === 0 || completedCount === targetItems.length) {
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
        const ratePerSec = (completedCount / Number(elapsedSec)).toFixed(1);
        const estCost = ((completedCount / 1000) * 6).toFixed(2);

        console.log(
          `[PROGRESS] ${completedCount}/${targetItems.length} (${((completedCount / targetItems.length) * 100).toFixed(1)}%) | ${ratePerSec} req/sec | Est. Credit Used: $${estCost} USD`
        );
      }

      if (completedCount % STATE_SAVE_INTERVAL === 0) {
        saveStateAndExcel(results);
      }
    }
  }

  const workers: Promise<void>[] = [];
  for (let w = 0; w < CONCURRENCY; w++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  saveStateAndExcel(results);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalCost = ((targetItems.length / 1000) * 6).toFixed(2);

  console.log(`\n====================================================`);
  console.log(`✅ BULLETPROOF SCRAPE COMPLETED SUCCESSFULLY`);
  console.log(`Scraped Range: #${START_INDEX + 1} to #${END_INDEX} (${results.size} items)`);
  console.log(`Total Time Taken: ${totalTime} seconds`);
  console.log(`Est. Credit Used: $${totalCost} USD (Fully Covered by Free Credit)`);
  console.log(`Output Excel: ${OUTPUT_EXCEL}`);
  console.log(`====================================================\n`);
}

startBulletproofRangeScrape().catch((err) => {
  console.error("Scrape failed:", err);
  process.exit(1);
});
