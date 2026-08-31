import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import XLSX from "xlsx";

interface InputItem {
  place_id: string;
  google_maps_url?: string;
  category?: string;
  subcategory?: string;
}

interface ScrapedLead {
  place_id: string;
  name: string;
  address: string;
  phone_number: string;
  website_url: string;
  rating: string;
  reviews_count: string;
  category: string;
  subcategory: string;
  area: string;
  city: string;
  state: string;
  country: string;
  latitude: string;
  longitude: string;
  operational_hours: string;
  google_maps_url: string;
}

async function scrapeFreeWithPlaywright() {
  const args = process.argv.slice(2);
  const targetFile = args[0] || "google-place-ids-unique-35001-to-45000.json";
  const startOffset = parseInt(args[1] || "0", 10);
  const batchLimit = parseInt(args[2] || "10", 10);

  const inputFilePath = path.isAbsolute(targetFile)
    ? targetFile
    : path.join(__dirname, "../", targetFile);

  if (!fs.existsSync(inputFilePath)) {
    console.error(`\n❌ Input file not found: ${inputFilePath}`);
    process.exit(1);
  }

  console.log(`======================================================`);
  console.log(`🌐 100% FREE LOCAL PLAYWRIGHT SCRAPER (NO API KEYS!)`);
  console.log(`======================================================`);
  console.log(`📁 Input: ${path.basename(inputFilePath)}`);
  console.log(`📍 Offset: ${startOffset} | Limit: ${batchLimit}`);
  console.log(`💰 Cost: $0.00 (100% Free on your laptop)`);
  console.log(`======================================================\n`);

  const rawData: InputItem[] = JSON.parse(fs.readFileSync(inputFilePath, "utf8"));
  const batchItems = rawData.slice(startOffset, startOffset + batchLimit);

  if (batchItems.length === 0) {
    console.log("❌ No items to process in specified range.");
    process.exit(0);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--lang=en-US"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, Gecko) Chrome/122.0.0.0 Safari/537.36",
    locale: "en-US",
  });

  await context.addCookies([
    {
      name: "SOCS",
      value: "CAESHAgBEhJnd3NfMjAyNDAyMTUtMF9SQzEaAmVuIAEaBgiA_9yrBg",
      domain: ".google.com",
      path: "/",
    },
    {
      name: "CONSENT",
      value: "YES+cb",
      domain: ".google.com",
      path: "/",
    },
  ]);

  const scrapedLeads: ScrapedLead[] = [];

  for (let i = 0; i < batchItems.length; i++) {
    const item = batchItems[i];
    const targetUrl = `https://www.google.com/maps/place/?q=place_id:${item.place_id}`;

    console.log(`[${i + 1}/${batchItems.length}] Scraping Place ID: ${item.place_id}...`);

    const page = await context.newPage();
    try {
      await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
      await page.waitForTimeout(2000); // Allow Google Maps dynamic panel to render

      const finalUrl = page.url();

      // Extract Name
      const name =
        (await page.locator("h1.DUwfxb, h1.fontTitleLarge, h1").first().textContent({ timeout: 3000 }).catch(() => "")) || "";

      // Extract Rating & Reviews
      const rating =
        (await page.locator('span[aria-label*="stars"], span.ceNzKf').first().getAttribute("aria-label").catch(() => "")) ||
        (await page.locator("span.fontBodyMedium span").first().textContent().catch(() => "")) ||
        "";

      const reviews_count =
        (await page.locator('button[aria-label*="reviews"]').first().textContent().catch(() => "")) || "";

      // Extract Address
      const address =
        (await page.locator('button[data-item-id="address"] div.Io6YTe, button[data-item-id="address"]').first().textContent().catch(() => "")) || "";

      // Extract Phone
      const phone_number =
        (await page.locator('button[data-item-id*="phone"] div.Io6YTe, button[data-item-id*="phone"]').first().textContent().catch(() => "")) || "";

      // Extract Website
      const website_url =
        (await page.locator('a[data-item-id="authority"]').first().getAttribute("href").catch(() => "")) || "";

      // Extract Subcategory/Category
      const subcategory =
        (await page.locator('button[data-item-id="category"], button.DkbrZe').first().textContent().catch(() => "")) ||
        item.subcategory ||
        "";

      // Extract Lat / Lng from URL (e.g. /@12.9715987,77.5945627,15z)
      let latitude = "";
      let longitude = "";
      const latLngMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (latLngMatch) {
        latitude = latLngMatch[1];
        longitude = latLngMatch[2];
      }

      // Address Breakdown (City/Area/State/Country)
      let area = "";
      let city = "Bengaluru";
      let state = "Karnataka";
      let country = "India";
      if (address) {
        const parts = address.split(",").map((p) => p.trim());
        if (parts.length >= 3) {
          area = parts[parts.length - 3] || "";
          city = parts[parts.length - 2] || "Bengaluru";
        }
      }

      const leadRecord: ScrapedLead = {
        place_id: item.place_id,
        name: name.trim(),
        address: address.trim(),
        phone_number: phone_number.trim(),
        website_url: website_url.trim(),
        rating: rating.trim(),
        reviews_count: reviews_count.replace(/[^\d]/g, "").trim(),
        category: item.category || "Healthcare & Medical",
        subcategory: subcategory.trim(),
        area: area.trim(),
        city: city.trim(),
        state,
        country,
        latitude,
        longitude,
        operational_hours: "",
        google_maps_url: finalUrl,
      };

      scrapedLeads.push(leadRecord);
      console.log(`   ✅ Scraped: "${leadRecord.name || "Place"}" | Phone: ${leadRecord.phone_number || "N/A"}`);
    } catch (err: any) {
      console.warn(`   ⚠️ Warning scraping ${item.place_id}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // Save Outputs
  const baseName = path.basename(inputFilePath, path.extname(inputFilePath));
  const timestamp = Date.now();
  const outputJson = path.join(__dirname, "../", `${baseName}-free-${startOffset}-${batchLimit}-${timestamp}.json`);
  const outputExcel = path.join(__dirname, "../", `${baseName}-free-${startOffset}-${batchLimit}-${timestamp}.xlsx`);

  fs.writeFileSync(outputJson, JSON.stringify(scrapedLeads, null, 2), "utf8");

  const worksheet = XLSX.utils.json_to_sheet(scrapedLeads);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
  XLSX.writeFile(workbook, outputExcel);

  console.log(`\n======================================================`);
  console.log(`🎉 COMPLETED 100% FREE LOCAL PLAYWRIGHT SCRAPE!`);
  console.log(`📊 Scraped: ${scrapedLeads.length} leads`);
  console.log(`📁 Excel File: ${outputExcel}`);
  console.log(`📁 JSON File:  ${outputJson}`);
  console.log(`======================================================\n`);
}

scrapeFreeWithPlaywright().catch((err) => {
  console.error("Fatal Scraper Error:", err);
  process.exit(1);
});
