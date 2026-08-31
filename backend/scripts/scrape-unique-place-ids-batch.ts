import "dotenv/config";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY2 || process.env.GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error("Error: GOOGLE_MAPS_API_KEY2 is not set in environment or .env file");
  process.exit(1);
}

// Configuration
const DEFAULT_LIMIT = 8000;
const CONCURRENCY = 15; // Parallel workers for fast scraping
const STATE_SAVE_INTERVAL = 200; // Save checkpoint every 200 items

const INPUT_EXCEL = path.resolve(__dirname, "../google-place-ids-bangalore-unique.xlsx");

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

async function fetchPlaceDetails(placeId: string, retries = 2): Promise<any> {
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

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": fieldMask,
        },
      });

      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      if (!res.ok) {
        return null;
      }

      return await res.json();
    } catch (e) {
      if (attempt === retries) return null;
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return null;
}

function saveStateAndExcel(results: Map<string, ScrapedPlaceRow>, stateJsonPath: string, outputExcelPath: string) {
  const dataArray = Array.from(results.values());

  // Write checkpoint JSON
  fs.writeFileSync(stateJsonPath, JSON.stringify(dataArray, null, 2), "utf8");

  // Write Excel
  if (dataArray.length > 0) {
    const worksheet = XLSX.utils.json_to_sheet(dataArray);
    const headers = Object.keys(dataArray[0] || {});
    worksheet["!cols"] = headers.map((h) => ({
      wch: Math.max(h.length + 5, 20),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Scraped ${dataArray.length}`);
    XLSX.writeFile(workbook, outputExcelPath);
  }
}

async function startBatchScrape() {
  const targetLimit = Number(process.argv[2]) || DEFAULT_LIMIT;

  const outputExcel = path.resolve(__dirname, `../google-place-ids-${targetLimit}-scraped.xlsx`);
  const stateJson = path.resolve(__dirname, `../google-place-ids-${targetLimit}-state.json`);

  console.log(`====================================================`);
  console.log(`🛡️ SAFE BATCH SCRAPER INITIALIZED`);
  console.log(`Target Limit: STRICT CAP OF ${targetLimit} PLACE IDs`);
  console.log(`Fields: Price Level, Editorial Summary, Payment Options, Intl Phone included`);
  console.log(`Estimated Cost: ~$${((targetLimit / 1000) * 6).toFixed(2)} USD (100% Covered by Free Credit)`);
  console.log(`Output File: ${outputExcel}`);
  console.log(`====================================================\n`);

  if (!fs.existsSync(INPUT_EXCEL)) {
    console.error(`Input file missing: ${INPUT_EXCEL}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(INPUT_EXCEL);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const allRows: InputRow[] = XLSX.utils.sheet_to_json(sheet);

  const targetItems = allRows.slice(0, targetLimit);
  console.log(`Loaded ${targetItems.length} place IDs to scrape.\n`);

  const results = new Map<string, ScrapedPlaceRow>();

  // Check state file for this targetLimit
  if (fs.existsSync(stateJson)) {
    try {
      const existing: ScrapedPlaceRow[] = JSON.parse(fs.readFileSync(stateJson, "utf8"));
      if (existing.length > 0 && "price_level" in existing[0]) {
        for (const row of existing) {
          results.set(row.place_id, row);
        }
        console.log(`Resumed previous checkpoint: ${results.size}/${targetItems.length} already scraped.`);
      }
    } catch (e) {
      console.log("Could not parse state checkpoint, starting fresh.");
    }
  }

  let completedCount = results.size;
  const queue = targetItems.filter((item) => !results.has(item.place_id));

  if (queue.length === 0) {
    console.log(`All ${targetItems.length} place IDs are already scraped! Saving Excel...`);
    saveStateAndExcel(results, stateJson, outputExcel);
    console.log(`Done! Output saved to: ${outputExcel}`);
    return;
  }

  console.log(`Remaining to scrape: ${queue.length} items.\n`);

  const startTime = Date.now();
  let queueIndex = 0;

  async function worker() {
    while (queueIndex < queue.length) {
      const idx = queueIndex++;
      const item = queue[idx];

      const placeDetails = await fetchPlaceDetails(item.place_id);

      if (placeDetails) {
        const { area, city, state, country } = extractAddressComponents(placeDetails.addressComponents);
        const operationalHours = placeDetails.regularOpeningHours?.weekdayDescriptions
          ? placeDetails.regularOpeningHours.weekdayDescriptions.join("; ")
          : "";
        const typesJoined = Array.isArray(placeDetails.types) ? placeDetails.types.join(", ") : "";

        results.set(item.place_id, {
          place_id: placeDetails.id || item.place_id,
          name: placeDetails.displayName?.text || "",
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
        saveStateAndExcel(results, stateJson, outputExcel);
      }
    }
  }

  const workers: Promise<void>[] = [];
  for (let w = 0; w < CONCURRENCY; w++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  saveStateAndExcel(results, stateJson, outputExcel);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalCost = ((targetItems.length / 1000) * 6).toFixed(2);

  console.log(`\n====================================================`);
  console.log(`✅ BATCH SCRAPE COMPLETED SUCCESSFULLY`);
  console.log(`Total Scraped: ${results.size} Place IDs`);
  console.log(`Total Time Taken: ${totalTime} seconds`);
  console.log(`Est. Total Credit Used: $${totalCost} USD (Fully Covered by Free Credit)`);
  console.log(`Output Excel: ${outputExcel}`);
  console.log(`====================================================\n`);
}

startBatchScrape().catch((err) => {
  console.error("Batch scrape failed:", err);
  process.exit(1);
});
