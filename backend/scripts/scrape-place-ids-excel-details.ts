import "dotenv/config";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY2 || process.env.GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error("Error: GOOGLE_MAPS_API_KEY2 is not set in environment or .env file");
  process.exit(1);
}

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
  longitude: number | string;
  latitude: number | string;
  operational_hours: string;
  area: string;
  city: string;
  state: string;
  country: string;
  ratings: number | string;
  reviews_count: number | string;
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

  // Unique area parts
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
  return activeOpts.join(", ");
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

async function fetchPlaceDetails(placeId: string): Promise<any> {
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

  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": fieldMask,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`HTTP Error ${res.status} for place_id ${placeId}:`, errorText);
    return null;
  }

  return await res.json();
}

async function runScrapeFirst5() {
  const excelPath = path.resolve(__dirname, "../google-place-ids-bangalore-unique.xlsx");
  if (!fs.existsSync(excelPath)) {
    console.error(`File not found: ${excelPath}`);
    process.exit(1);
  }

  console.log(`Reading input file: ${excelPath}...`);
  const wb = XLSX.readFile(excelPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const allRows: InputRow[] = XLSX.utils.sheet_to_json(sheet);

  const targetRows = allRows.slice(0, 5);
  console.log(`Scraping details for first 5 place IDs using GOOGLE_MAPS_API_KEY2...\n`);

  const scrapedData: ScrapedPlaceRow[] = [];

  for (let i = 0; i < targetRows.length; i++) {
    const input = targetRows[i];
    console.log(`[${i + 1}/5] Fetching details for place_id: ${input.place_id}...`);

    const placeDetails = await fetchPlaceDetails(input.place_id);

    if (!placeDetails) {
      scrapedData.push({
        place_id: input.place_id,
        name: "",
        address: "",
        primaryType: "",
        Type: "",
        phone_number: "",
        longitude: "",
        latitude: "",
        operational_hours: "",
        area: "",
        city: "",
        state: "",
        country: "",
        ratings: "",
        reviews_count: "",
        accessibilityoptions: "",
        website_url: "",
        email: "",
        services: "",
        subcategory: input.subcategory || "",
      });
      continue;
    }

    const { area, city, state, country } = extractAddressComponents(placeDetails.addressComponents);

    const operationalHours = placeDetails.regularOpeningHours?.weekdayDescriptions
      ? placeDetails.regularOpeningHours.weekdayDescriptions.join("; ")
      : "";

    const typesJoined = Array.isArray(placeDetails.types) ? placeDetails.types.join(", ") : "";

    scrapedData.push({
      place_id: placeDetails.id || input.place_id,
      name: placeDetails.displayName?.text || "",
      address: placeDetails.formattedAddress || "",
      primaryType: placeDetails.primaryType || "",
      Type: typesJoined,
      phone_number: placeDetails.nationalPhoneNumber || placeDetails.internationalPhoneNumber || "",
      longitude: placeDetails.location?.longitude ?? "",
      latitude: placeDetails.location?.latitude ?? "",
      operational_hours: operationalHours,
      area: area,
      city: city,
      state: state,
      country: country,
      ratings: placeDetails.rating ?? "",
      reviews_count: placeDetails.userRatingCount ?? "",
      accessibilityoptions: formatAccessibilityOptions(placeDetails.accessibilityOptions),
      website_url: placeDetails.websiteUri || "",
      email: "", // Email if available or standard empty field
      services: formatServices(placeDetails),
      subcategory: input.subcategory || "",
    });
  }

  // Create Excel workbook
  console.log("\nBuilding Excel spreadsheet for scraped details...");
  const worksheet = XLSX.utils.json_to_sheet(scrapedData);

  // Auto-fit column widths
  const headers = Object.keys(scrapedData[0] || {});
  worksheet["!cols"] = headers.map((h) => ({
    wch: Math.max(h.length + 5, 20),
  }));

  const outWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(outWb, worksheet, "Scraped First 5");

  const outputPath = path.resolve(__dirname, "../google-place-ids-first5-scraped.xlsx");
  XLSX.writeFile(outWb, outputPath);

  console.log(`\n--- Done! ---`);
  console.log(`Saved output Excel to: ${outputPath}`);
  console.log(JSON.stringify(scrapedData, null, 2));
}

runScrapeFirst5().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
