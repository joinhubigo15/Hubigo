import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

interface PlaceIdItem {
  category?: string;
  subcategory?: string;
  place_id: string;
}

async function exportUniquePlaceIdsToExcel() {
  const inputFileArg = process.argv[2] || 'google-place-ids-bangalore.json';
  const inputFilePath = path.isAbsolute(inputFileArg)
    ? inputFileArg
    : path.resolve(__dirname, '..', inputFileArg);

  if (!fs.existsSync(inputFilePath)) {
    console.error(`Input file not found: ${inputFilePath}`);
    process.exit(1);
  }

  console.log(`Reading input file: ${inputFilePath}...`);
  const rawData = fs.readFileSync(inputFilePath, 'utf8');
  const items: PlaceIdItem[] = JSON.parse(rawData);

  console.log(`Total records in input JSON: ${items.length}`);

  // Deduplicate by place_id and aggregate unique subcategories
  const uniqueMap = new Map<string, Set<string>>();

  for (const item of items) {
    if (!item.place_id) continue;
    const pid = item.place_id.trim();
    if (!pid) continue;

    if (!uniqueMap.has(pid)) {
      uniqueMap.set(pid, new Set<string>());
    }

    if (item.subcategory && item.subcategory.trim()) {
      uniqueMap.get(pid)!.add(item.subcategory.trim());
    }
  }

  console.log(`Unique place_ids count: ${uniqueMap.size}`);

  // Prepare Excel rows
  const rows: { place_id: string; subcategory: string }[] = [];
  for (const [pid, subcatsSet] of uniqueMap.entries()) {
    const subcategoryStr = Array.from(subcatsSet).join(', ');
    rows.push({
      place_id: pid,
      subcategory: subcategoryStr,
    });
  }

  console.log('Generating Excel worksheet...');
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: ['place_id', 'subcategory'],
  });

  // Set column widths for better readability in Excel
  worksheet['!cols'] = [
    { wch: 35 }, // place_id
    { wch: 60 }, // subcategory
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Unique Place IDs');

  const baseName = path.basename(inputFilePath, '.json');
  const outputFileName = `${baseName}-unique.xlsx`;
  const outputPath = path.resolve(path.dirname(inputFilePath), outputFileName);

  console.log(`Writing Excel file to: ${outputPath}...`);
  XLSX.writeFile(workbook, outputPath);

  const stats = fs.statSync(outputPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\n--- Export Complete ---');
  console.log(`Output File: ${outputPath}`);
  console.log(`File Size: ${fileSizeMB} MB`);
  console.log(`Unique Place IDs: ${rows.length}`);
}

exportUniquePlaceIdsToExcel().catch((err) => {
  console.error('Error generating Excel file:', err);
  process.exit(1);
});
