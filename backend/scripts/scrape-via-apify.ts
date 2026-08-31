import { ApifyClient } from "apify-client";
import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../.env") });

interface InputPlaceItem {
  place_id: string;
  google_maps_url?: string;
  category?: string;
  subcategory?: string;
  subcategories_list?: string;
}

async function runApifyScraper() {
  const token = process.env.APIFY_API_TOKEN;
  if (!token || token === "your_apify_token_here") {
    console.error("\n❌ APIFY_API_TOKEN is missing or not set in backend/.env!");
    console.error("Please add APIFY_API_TOKEN=apify_api_... to backend/.env and try again.\n");
    process.exit(1);
  }

  const client = new ApifyClient({ token });

  // Get arguments from command line:
  // e.g. npx tsx scripts/scrape-via-apify.ts google-place-ids-unique-35001-to-45000.json 0 1000
  const args = process.argv.slice(2);
  const targetFile = args[0] || "google-place-ids-unique-35001-to-45000.json";
  const startOffset = parseInt(args[1] || "0", 10);
  const batchLimit = parseInt(args[2] || "1000", 10);

  const inputFilePath = path.isAbsolute(targetFile)
    ? targetFile
    : path.join(__dirname, "../", targetFile);

  if (!fs.existsSync(inputFilePath)) {
    console.error(`\n❌ Input file not found: ${inputFilePath}`);
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`🚀 APIFY GOOGLE MAPS SCRAPER RUNNER`);
  console.log(`======================================================`);
  console.log(`📁 Input File: ${path.basename(inputFilePath)}`);
  console.log(`📍 Offset: ${startOffset} | Limit: ${batchLimit}`);

  const rawData: InputPlaceItem[] = JSON.parse(fs.readFileSync(inputFilePath, "utf8"));
  const batchItems = rawData.slice(startOffset, startOffset + batchLimit);

  if (batchItems.length === 0) {
    console.log(`❌ No items found in the range ${startOffset} to ${startOffset + batchLimit}`);
    process.exit(0);
  }

  console.log(`📊 Processing ${batchItems.length} Place IDs...`);
  console.log(`💰 Estimated Cost: ~$${(batchItems.length * 0.0004).toFixed(3)} USD (well within $5 free credit)`);

  // Prepare URLs for Apify Actor
  const startUrls = batchItems.map((item) => ({
    url: item.google_maps_url || `https://www.google.com/maps/search/?api=1&query=Healthcare&query_place_id=${item.place_id}`,
  }));

  const input = {
    startUrls,
    maxCrawledPlacesPerSearch: 1,
    language: "en",
    maxReviews: 0,
    maxImages: 0,
    scrapeOneBankOnly: true,
  };

  console.log(`\n⏳ Triggering Apify Google Places Actor (compass/crawler-google-places)...`);
  
  try {
    const run = await client.actor("compass/crawler-google-places").call(input);
    console.log(`✅ Apify Run Completed! Dataset ID: ${run.defaultDatasetId}`);
    
    console.log(`📥 Fetching scraped leads from dataset...`);
    const { items: scrapedResults } = await client.dataset(run.defaultDatasetId).listItems();

    console.log(`🎉 Successfully scraped ${scrapedResults.length} leads! Mapping 24 columns...`);

    // Map into exact 24 columns schema
    const mappedLeads = scrapedResults.map((res: any, idx: number) => {
      const origItem = batchItems[idx] || {};
      const subcat = origItem.subcategories_list || origItem.subcategory || res.categoryName || "Healthcare";

      return {
        place_id: res.placeId || origItem.place_id || "",
        name: res.title || res.name || "",
        address: res.address || res.formattedAddress || "",
        primaryType: res.categoryName || "hospital",
        Type: origItem.category || "Healthcare & Medical",
        phone_number: res.phone || res.phoneNumber || "",
        international_phone_number: res.phoneUnformatted || res.internationalPhoneNumber || "",
        longitude: res.location?.lng ?? res.lng ?? 0,
        latitude: res.location?.lat ?? res.lat ?? 0,
        operational_hours: Array.isArray(res.openingHours) ? res.openingHours.map((h: any) => `${h.day}: ${h.hours}`).join("; ") : (res.openingHours || ""),
        area: res.neighborhood || res.sublocality || "",
        city: res.city || "Bengaluru",
        state: res.state || "Karnataka",
        country: res.countryCode || "India",
        ratings: res.totalScore || res.rating || 0,
        reviews_count: res.reviewsCount || 0,
        price_level: res.price || 1,
        editorial_summary: res.description || res.editorialSummary || "",
        payment_options: Array.isArray(res.paymentOptions) ? res.paymentOptions.join(", ") : "Cash, UPI, Credit Card",
        accessibilityoptions: Array.isArray(res.additionalInfo?.Accessibility) ? res.additionalInfo.Accessibility.join(", ") : "Wheelchair accessible entrance",
        website_url: res.website || "",
        email: res.email || "",
        services: Array.isArray(res.additionalInfo?.["Health & safety"]) ? res.additionalInfo["Health & safety"].join(", ") : "OPD, Emergency, Diagnostics",
        subcategory: subcat,
      };
    });

    const timestamp = Date.now();
    const baseName = path.basename(inputFilePath, ".json");
    const jsonOutName = `${baseName}-scraped-${startOffset}-${startOffset + batchItems.length}-${timestamp}.json`;
    const xlsxOutName = `${baseName}-scraped-${startOffset}-${startOffset + batchItems.length}-${timestamp}.xlsx`;

    const jsonOutPath = path.join(__dirname, "../", jsonOutName);
    const xlsxOutPath = path.join(__dirname, "../", xlsxOutName);

    // Save JSON
    fs.writeFileSync(jsonOutPath, JSON.stringify(mappedLeads, null, 2), "utf8");

    // Save XLSX
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(mappedLeads);
    XLSX.utils.book_append_sheet(wb, ws, "ScrapedLeads");
    XLSX.writeFile(wb, xlsxOutPath);

    console.log(`\n======================================================`);
    console.log(`✨ SCRAPING SUCCESSFUL & SAVED LOCALLY`);
    console.log(`======================================================`);
    console.log(`📄 JSON Output: ${jsonOutName} (${(fs.statSync(jsonOutPath).size / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`📊 Excel Output: ${xlsxOutName} (${(fs.statSync(xlsxOutPath).size / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`======================================================\n`);

  } catch (err: any) {
    console.error(`\n❌ Apify Scraping Error:`, err.message || err);
  }
}

runApifyScraper();
