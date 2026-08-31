import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

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

const BATCH_FILES = [
  'google-place-ids-6000-state.json',
  'google-place-ids-6001-to-10000-state.json',
  'google-place-ids-10001-to-20000-state.json',
  'google-place-ids-20001-to-35000-state.json',
];

async function mergeBatches() {
  const backendDir = path.resolve(__dirname, '..');
  const masterMap = new Map<string, ScrapedPlaceRow>();
  let totalRawRecords = 0;

  console.log('====================================================');
  console.log('🔄 MERGING ALL 4 SCRAPED BATCH FILES');
  console.log('====================================================\n');

  for (const file of BATCH_FILES) {
    const filePath = path.join(backendDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File not found: ${file}`);
      continue;
    }

    console.log(`Reading ${file}...`);
    const rawData = fs.readFileSync(filePath, 'utf8');
    const items: ScrapedPlaceRow[] = JSON.parse(rawData);
    totalRawRecords += items.length;

    console.log(`  -> Found ${items.length} records in ${file}`);

    for (const item of items) {
      if (!item.place_id) continue;
      const pid = item.place_id.trim();
      if (!pid) continue;

      if (!masterMap.has(pid)) {
        masterMap.set(pid, { ...item });
      } else {
        // Merge subcategories if present and different
        const existing = masterMap.get(pid)!;
        if (item.subcategory && item.subcategory.trim()) {
          const currentSubcats = new Set(
            existing.subcategory
              ? existing.subcategory.split(',').map((s) => s.trim()).filter(Boolean)
              : []
          );
          item.subcategory.split(',').forEach((s) => {
            if (s.trim()) currentSubcats.add(s.trim());
          });
          existing.subcategory = Array.from(currentSubcats).join(', ');
        }
        // Prefer non-empty fields if existing has empty values
        for (const [key, val] of Object.entries(item)) {
          const k = key as keyof ScrapedPlaceRow;
          if ((!existing[k] || existing[k] === '') && val !== undefined && val !== '') {
            (existing as any)[k] = val;
          }
        }
      }
    }
  }

  const mergedList = Array.from(masterMap.values());

  console.log('\n----------------------------------------------------');
  console.log(`Total records read across 4 files: ${totalRawRecords}`);
  console.log(`Unique place_ids in merged dataset: ${mergedList.length}`);
  console.log('----------------------------------------------------\n');

  // Output paths
  const outputJsonPath = path.join(backendDir, 'google-place-ids-35000-scraped-complete.json');
  const outputExcelPath = path.join(backendDir, 'google-place-ids-35000-scraped-complete.xlsx');

  // Also write generic master paths for ease of use
  const masterJsonPath = path.join(backendDir, 'google-place-ids-scraped-master.json');
  const masterExcelPath = path.join(backendDir, 'google-place-ids-scraped-master.xlsx');

  console.log(`Writing JSON to: ${outputJsonPath}...`);
  fs.writeFileSync(outputJsonPath, JSON.stringify(mergedList, null, 2), 'utf8');
  fs.writeFileSync(masterJsonPath, JSON.stringify(mergedList, null, 2), 'utf8');

  console.log(`Generating Excel file: ${outputExcelPath}...`);
  const worksheet = XLSX.utils.json_to_sheet(mergedList);

  if (mergedList.length > 0) {
    const headers = Object.keys(mergedList[0]);
    worksheet['!cols'] = headers.map((h) => ({
      wch: Math.max(h.length + 5, 20),
    }));
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Master Scraped (${mergedList.length})`);

  XLSX.writeFile(workbook, outputExcelPath);
  XLSX.writeFile(workbook, masterExcelPath);

  const jsonStats = fs.statSync(outputJsonPath);
  const excelStats = fs.statSync(outputExcelPath);

  console.log('\n====================================================');
  console.log('✅ MERGE COMPLETED SUCCESSFULLY');
  console.log(`Master JSON File: ${outputJsonPath} (${(jsonStats.size / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`Master Excel File: ${outputExcelPath} (${(excelStats.size / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`Total Records: ${mergedList.length}`);
  console.log('====================================================\n');
}

mergeBatches().catch((err) => {
  console.error('Failed to merge batch files:', err);
  process.exit(1);
});
