import fs from "fs";
import path from "path";

const LEADS_DIR = "C:\\Hubigo\\Leads";
const STAGING_CSV = path.join(__dirname, "gmaps-scraper", "staging", "businesses.csv");
const PINCODE_FILE = path.join(__dirname, "..", "Bangalore_pincode.txt");
const OUTPUT_CSV = path.join(__dirname, "gmaps-scraper", "staging", "bangalore_movie_theaters_master.csv");

// 1. Read Bangalore_pincode.txt
function getRequiredPincodes(): string[] {
  const text = fs.readFileSync(PINCODE_FILE, "utf-8");
  return text
    .split(/[,\s\n]+/)
    .map((p) => p.trim())
    .filter((p) => /^\d{6}$/.test(p));
}

// Simple CSV parser supporting quotes
function parseCsvRows(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx];
      });
      rows.push(row);
    }
  }

  return { headers, rows };
}

function extractPincodeFromRow(row: Record<string, string>): string | null {
  if (row["source_location"] && /^\d{6}$/.test(row["source_location"])) {
    return row["source_location"];
  }
  const addr = row["complete_address"] || row["address"] || "";
  const match = addr.match(/\b(560\d{3}|562\d{3})\b/);
  return match ? match[1] : null;
}

function main() {
  const requiredPincodes = getRequiredPincodes();
  console.log(`Required Pincodes in Bangalore_pincode.txt: ${requiredPincodes.length}`);

  const pincodesFound = new Set<string>();
  const stagedPincodes = new Set<string>();

  const masterRows: string[] = [];
  let headerLine = "";
  const seenDeduplicationKeys = new Set<string>();

  // A. Process staging businesses.csv
  if (fs.existsSync(STAGING_CSV)) {
    const stagingContent = fs.readFileSync(STAGING_CSV, "utf-8");
    const lines = stagingContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length > 0) {
      headerLine = lines[0];
      masterRows.push(lines[0]);

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Deduplicate using place_id / data_id / title+address
        const matchPincode = line.match(/\b(560\d{3}|562\d{3})\b/);
        if (matchPincode) {
          pincodesFound.add(matchPincode[1]);
          stagedPincodes.add(matchPincode[1]);
        }

        // Generate dedup key
        const cols = line.split(",");
        const title = cols[9] || cols[0] || "";
        const key = title.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (key && !seenDeduplicationKeys.has(key)) {
          seenDeduplicationKeys.add(key);
          masterRows.push(line);
        }
      }
    }
  }

  console.log(`Processed staging CSV: ${masterRows.length - 1} records from staging.`);

  // B. Process files in C:\Hubigo\Leads
  if (fs.existsSync(LEADS_DIR)) {
    const files = fs.readdirSync(LEADS_DIR).filter((f) => f.endsWith(".csv"));
    console.log(`Found ${files.length} lead CSV files in ${LEADS_DIR}`);

    for (const file of files) {
      const filePath = path.join(LEADS_DIR, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const { headers, rows } = parseCsvRows(content);

      // Extract pincode from filename e.g. leads-Movie_Theater_-_560067.csv
      const filenameMatch = file.match(/(560\d{3}|562\d{3})/);
      if (filenameMatch) {
        pincodesFound.add(filenameMatch[1]);
      }

      for (const row of rows) {
        const pincode = extractPincodeFromRow(row);
        if (pincode) {
          pincodesFound.add(pincode);
        }

        const title = row["title"] || row["name"] || "";
        const address = row["address"] || row["complete_address"] || "";
        const dataId = row["data_id"] || row["place_id"] || "";
        const key = (dataId || `${title}_${address}`).toLowerCase().replace(/[^a-z0-9]/g, "");

        if (title && !seenDeduplicationKeys.has(key)) {
          seenDeduplicationKeys.add(key);

          // Convert row to master CSV row matching staging header format
          const nowISO = new Date().toISOString();
          const stagedPincode = pincode || (filenameMatch ? filenameMatch[1] : "560000");

          const escapeCsv = (str: string) => `"${(str || "").replace(/"/g, '""')}"`;

          const masterRowString = [
            nowISO, // staged_at
            "Movie Theater Database", // source_subcategory
            "bangalore", // source_city
            stagedPincode, // source_location
            "plain", // source_mode
            `Movie Theater in ${stagedPincode}`, // source_search_query
            "false", // is_incomplete
            "false", // is_permanently_closed
            row["data_id"] || row["place_id"] || key, // dedup_key
            escapeCsv(row["title"] || ""),
            escapeCsv(row["category"] || "Movie Theater"),
            escapeCsv(row["address"] || ""),
            escapeCsv(row["complete_address"] || row["address"] || ""),
            escapeCsv(row["plus_code"] || ""),
            row["latitude"] || "",
            row["longitude"] || "",
            escapeCsv(row["phone"] || ""),
            escapeCsv(row["website"] || ""),
            escapeCsv(row["open_hours"] || "{}"),
            row["review_rating"] || "0.0",
            row["review_count"] || "0",
            escapeCsv(row["place_id"] || ""),
            escapeCsv(row["cid"] || ""),
            escapeCsv(row["data_id"] || ""),
            escapeCsv(row["status"] || "OPERATIONAL"),
            escapeCsv(row["thumbnail"] || ""),
            escapeCsv(row["images"] || ""),
            escapeCsv(row["price_range"] || ""),
            escapeCsv(row["emails"] || ""),
            escapeCsv(row["link"] || ""),
          ].join(",");

          masterRows.push(masterRowString);
        }
      }
    }
  }

  // C. Write Master Output CSV
  fs.writeFileSync(OUTPUT_CSV, masterRows.join("\n"));
  console.log(`\nMaster Combined CSV written to: ${OUTPUT_CSV}`);
  console.log(`Total Unique Movie Theaters: ${masterRows.length - 1}`);

  // D. Compare against Bangalore_pincode.txt
  const missingPincodes = requiredPincodes.filter((p) => !pincodesFound.has(p));

  console.log("\n==========================================");
  console.log("PINCODE COVERAGE AUDIT REPORT");
  console.log("==========================================");
  console.log(`Total Pincodes in Bangalore_pincode.txt: ${requiredPincodes.length}`);
  console.log(`Total Pincodes Scraped/Found in Data: ${pincodesFound.size}`);
  console.log(`Missing Pincodes Count: ${missingPincodes.length}`);

  if (missingPincodes.length > 0) {
    console.log("\nMISSING PINCODES:");
    console.log(missingPincodes.join(", "));
  } else {
    console.log("\n✅ ALL PINCODES ARE PRESENT AND COVERED!");
  }
}

main();
