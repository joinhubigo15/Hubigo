import "dotenv/config";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY2 || process.env.GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error("Error: GOOGLE_MAPS_API_KEY2 is not set in environment or .env file");
  process.exit(1);
}

const CONCURRENCY = 5; // Safe lower concurrency to prevent 429 rate limits

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

async function fetchPlaceDetailsWithRobustRetry(placeId: string, retries = 4): Promise<any> {
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

      if (res.status === 429 || res.status >= 500) {
        const waitMs = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      if (!res.ok) {
        return null; // Truly 404 or invalid place ID on Google Maps
      }

      return await res.json();
    } catch (e) {
      if (attempt === retries) return null;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return null;
}

async function repairTargetFile(stateJsonPath: string, outputExcelPath: string) {
  if (!fs.existsSync(stateJsonPath)) {
    console.log(`File not found: ${stateJsonPath}`);
    return;
  }

  console.log(`\n==============================================`);
  console.log(`REPAIRING DATASET: ${path.basename(stateJsonPath)}`);
  console.log(`==============================================`);

  const data: ScrapedPlaceRow[] = JSON.parse(fs.readFileSync(stateJsonPath, "utf8"));
  const emptyIndices: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (!data[i].name || data[i].name.trim() === "") {
      emptyIndices.push(i);
    }
  }

  console.log(`Total rows in dataset: ${data.length}`);
  console.log(`Found empty/missing rows: ${emptyIndices.length}`);

  if (emptyIndices.length === 0) {
    console.log(`Dataset is 100% complete! No repairs needed.`);
    return;
  }

  let repairedCount = 0;
  let trulyMissingCount = 0;
  let queueIndex = 0;
  const startTime = Date.now();

  async function worker() {
    while (queueIndex < emptyIndices.length) {
      const idx = emptyIndices[queueIndex++];
      const row = data[idx];

      const placeDetails = await fetchPlaceDetailsWithRobustRetry(row.place_id);

      if (placeDetails && placeDetails.displayName?.text) {
        const { area, city, state, country } = extractAddressComponents(placeDetails.addressComponents);
        const operationalHours = placeDetails.regularOpeningHours?.weekdayDescriptions
          ? placeDetails.regularOpeningHours.weekdayDescriptions.join("; ")
          : "";
        const typesJoined = Array.isArray(placeDetails.types) ? placeDetails.types.join(", ") : "";

        data[idx] = {
          place_id: placeDetails.id || row.place_id,
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
          subcategory: row.subcategory || "",
        };
        repairedCount++;
      } else {
        trulyMissingCount++;
      }

      const totalProcessed = repairedCount + trulyMissingCount;
      if (totalProcessed % 50 === 0 || totalProcessed === emptyIndices.length) {
        console.log(
          `[REPAIR PROGRESS] ${totalProcessed}/${emptyIndices.length} (${((totalProcessed / emptyIndices.length) * 100).toFixed(1)}%) | Repaired: ${repairedCount} | Permanently Invalid/Closed: ${trulyMissingCount}`
        );
      }
    }
  }

  const workers: Promise<void>[] = [];
  for (let w = 0; w < CONCURRENCY; w++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  // Save updated JSON state
  fs.writeFileSync(stateJsonPath, JSON.stringify(data, null, 2), "utf8");

  // Save updated Excel file
  const worksheet = XLSX.utils.json_to_sheet(data);
  const headers = Object.keys(data[0] || {});
  worksheet["!cols"] = headers.map((h) => ({
    wch: Math.max(h.length + 5, 20),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Repaired Data");
  XLSX.writeFile(workbook, outputExcelPath);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n✅ REPAIR COMPLETE FOR ${path.basename(stateJsonPath)}`);
  console.log(`Total empty rows processed: ${emptyIndices.length}`);
  console.log(`Successfully recovered & filled: ${repairedCount} Place IDs`);
  console.log(`Permanently closed/invalid on Google Maps: ${trulyMissingCount} Place IDs`);
  console.log(`Time taken: ${totalTime}s`);
  console.log(`Updated Excel: ${outputExcelPath}\n`);
}

async function main() {
  const targetFileArg = process.argv[2];

  if (targetFileArg) {
    const jsonPath = path.resolve(__dirname, "..", targetFileArg);
    const baseName = path.basename(jsonPath, "-state.json").replace(".json", "");
    const excelPath = path.resolve(path.dirname(jsonPath), `${baseName}-scraped.xlsx`);
    await repairTargetFile(jsonPath, excelPath);
  } else {
    // Repair all 3 state files
    await repairTargetFile(
      path.resolve(__dirname, "../google-place-ids-6000-state.json"),
      path.resolve(__dirname, "../google-place-ids-6000-scraped.xlsx")
    );
    await repairTargetFile(
      path.resolve(__dirname, "../google-place-ids-6001-to-10000-state.json"),
      path.resolve(__dirname, "../google-place-ids-6001-to-10000-scraped.xlsx")
    );
    await repairTargetFile(
      path.resolve(__dirname, "../google-place-ids-10001-to-20000-state.json"),
      path.resolve(__dirname, "../google-place-ids-10001-to-20000-scraped.xlsx")
    );
  }
}

main().catch((err) => {
  console.error("Repair failed:", err);
  process.exit(1);
});
